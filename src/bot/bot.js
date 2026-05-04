const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { parseTransactions } = require('./parser');

process.env.PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW = '1';

const ACCOUNT_NAME = process.argv[2];
if (!ACCOUNT_NAME) { console.error('Required bot name via args'); process.exit(1); }

// Deterministic port for the bot's internal control UI
const BOT_PORT = 5000 + (parseInt(Buffer.from(ACCOUNT_NAME).toString('hex').slice(0, 4), 16) % 1000);

const SESSION_DIR = path.join(__dirname, `../../.sessions/session-${ACCOUNT_NAME}`);
const DOWNLOAD_DIR = path.join(__dirname, `../../.downloads/${ACCOUNT_NAME}`);

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

let accountConfig = { report_id: null, download_interval_sec: 10, email: '' };
let engineContext = null;
let enginePage = null;
let engineRunning = false;
let isInitialLoad = true;
const knownTransactions = new Set();
const MAX_KNOWN_TRANSACTIONS = 2000;

const startTime = new Date();
let lastBootTime = new Date();
let totalSweeps = 0;
let webhookStats = { success: 0, failure: 0 };

let statsEngineA = { captured: 0, lastCapture: null };
let statsEngineB = { captured: 0, lastCapture: null, lastDownload: null };

const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let uiClients = [];
let recentLogs = [];
function log(msg) { 
    const formatted = `[${new Date().toISOString()}] [${ACCOUNT_NAME}] ${msg}`;
    console.log(formatted); 
    
    recentLogs.push(formatted);
    if (recentLogs.length > 100) recentLogs.shift();

    let safeMsg = `[${ACCOUNT_NAME}] ${msg}`.replace(/\n/g, '<br>');
    uiClients.forEach(client => client.write(`data: ${safeMsg}\n\n`));
}

const HUB_URL = process.env.HUB_URL || 'http://localhost:3000';
const BOT_SECRET = process.env.BOT_SYSTEM_SECRET || 'wave_collect_bridge_secret_998877';

// GPay 9 Standard: Fetch configuration from Wave Collect Hub
async function fetchConfig() {
    try {
        const res = await axios.get(`${HUB_URL}/api/bots/config?name=${encodeURIComponent(ACCOUNT_NAME)}`, {
            headers: { "x-bot-secret": BOT_SECRET }
        });
        if (res.data.data) {
            accountConfig = res.data.data;
        }
    } catch (e) {
        log(`Failed to fetch config from hub: ${e.message}`);
    }
}

// GPay 9 Standard: Auto-update discovered Merchant ID
async function updateReportId(reportId) {
    try {
        await axios.post(`${HUB_URL}/api/bots/config`, {
            name: ACCOUNT_NAME,
            report_id: reportId
        }, {
            headers: { "x-bot-secret": BOT_SECRET }
        });
        log(`[SYSTEM] 🎯 Auto-discovered & saved Merchant ID: ${reportId}`);
        accountConfig.report_id = reportId;
    } catch (e) {
        log(`Failed to save Merchant ID: ${e.message}`);
    }
}

app.get('/api/control/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    uiClients.push(res);
    req.on('close', () => uiClients = uiClients.filter(c => c !== res));
});

function normalizeFromXHR(trx) {
    return {
        externalId: trx.merchantTransactionId || '',
        utr: trx.utr || null,
        payerName: trx.payerName || 'Unknown',
        amount: parseFloat(trx.amount) || 0,
        payerUpiId: trx.payerUpiId || null,
        timestamp: trx.timestamp || new Date().toISOString(),
        note: trx.note || null
    };
}

async function syncToHub(rows, engine) {
    if (!rows || rows.length === 0) return;
    try {
        await axios.post(`${HUB_URL}/api/v1/report`, {
            account: ACCOUNT_NAME,
            timestamp: new Date().toISOString(),
            transactions: rows
        }, { 
            timeout: 15000,
            headers: {
                'Authorization': `Bearer ${BOT_SECRET}`,
                'x-bot-secret': BOT_SECRET
            }
        });
        log(`[${engine}] Synced ${rows.length} rows → Hub`);
        webhookStats.success++;
    } catch (e) {
        log(`[${engine}] Hub sync failed: ${e.message}`);
        webhookStats.failure++;
    }
}

function trackTransactions(payload) {
    for (const trx of payload) {
        const id = trx.merchantTransactionId || trx.externalId;
        if (id) knownTransactions.add(id);
    }
    // Memory Hardening: Sliding window for IDs
    if (knownTransactions.size > MAX_KNOWN_TRANSACTIONS) {
        const it = knownTransactions.values();
        for (let i = 0; i < 500; i++) {
            const val = it.next().value;
            if (val) knownTransactions.delete(val);
        }
    }
}

async function processEngineA(payload) {
    if (!payload || payload.length === 0) return;
    const exportRows = payload.map(trx => normalizeFromXHR(trx));
    const newOnes = payload.filter(t => !knownTransactions.has(t.merchantTransactionId));
    
    trackTransactions(payload);

    if (newOnes.length > 0) {
        await syncToHub(exportRows, 'ENGINE-A');
        statsEngineA.captured += newOnes.length;
        statsEngineA.lastCapture = new Date().toISOString();
        for (const trx of newOnes) {
            log(`[ENGINE-A] ⚡ NEW: ₹${trx.amount} | ${trx.payerName} | ${trx.note}`);
        }
    } else if (isInitialLoad) {
        log(`[ENGINE-A] Initial load complete. Tracking ${exportRows.length} historical txns.`);
    }
    isInitialLoad = false;
}

function parseCSV(text) {
    const results = [];
    const lines = text.split(/\r?\n/);
    if (lines.length < 1) return results;
    const headers = lines[0].replace(/^\ufeff/, '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = [];
        let current = ''; let inQuotes = false;
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
            else { current += char; }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, idx) => { row[header] = values[idx] || ''; });
        results.push({
            externalId: row['Transaction ID'] || '',
            payerName: row['Payer name'] || row['Payer'] || 'Unknown',
            amount: parseFloat(row['Amount']) || 0,
            payerUpiId: row['Paid via'] || null,
            timestamp: row['Creation time'] || new Date().toISOString(),
            note: row['Notes'] || null
        });
    }
    return results;
}

async function runEngineB() {
    if (!engineRunning || !enginePage || !accountConfig.report_id) return;
    try {
        const reportUrl = `https://pay.google.com/g4b/reports/${accountConfig.report_id}`;
        const reportPage = await engineContext.newPage();
        try {
            await reportPage.goto(reportUrl, { timeout: 30000, waitUntil: 'load' });
            await reportPage.waitForTimeout(3000);
            await reportPage.evaluate(() => {
                const radio = document.querySelector('input[type="radio"][value="today"]');
                if (radio && !radio.checked) radio.click();
            });
            await reportPage.waitForTimeout(1500);

            const oldFiles = fs.readdirSync(DOWNLOAD_DIR);
            for (const file of oldFiles) fs.unlinkSync(path.join(DOWNLOAD_DIR, file));

            log('[ENGINE-B] 📄 Initiating CSV download...');
            await reportPage.getByRole('button', { name: /download/i }).first().click();

            const downloadPromise = reportPage.waitForEvent('download', { timeout: 15000 }).catch(() => null);
            const modalPromise = reportPage.waitForSelector('text=CSV', { timeout: 5000 }).catch(() => null);
            const firstAction = await Promise.race([downloadPromise, modalPromise]);

            let downloadObj;
            if (firstAction && !firstAction.saveAs) {
                await reportPage.getByText('CSV').click(); 
                await reportPage.waitForTimeout(1000);
                const finalBtn = reportPage.getByRole('button', { name: /download/i }).last();
                [downloadObj] = await Promise.all([
                    reportPage.waitForEvent('download', { timeout: 30000 }),
                    finalBtn.click()
                ]);
            } else if (firstAction) {
                downloadObj = firstAction;
            } else {
                log('[ENGINE-B] Download timeout');
                await reportPage.close(); return;
            }

            const dlPath = path.join(DOWNLOAD_DIR, `report_${Date.now()}.csv`);
            await downloadObj.saveAs(dlPath);
            const csvText = fs.readFileSync(dlPath, 'utf-8');
            const rows = parseCSV(csvText);
            log(`[ENGINE-B] 📄 CSV captured: ${rows.length} rows`);
            await syncToHub(rows, 'ENGINE-B'); 
            statsEngineB.captured += rows.length;
            statsEngineB.lastDownload = new Date().toISOString();
        } finally {
            await reportPage.close().catch(() => {});
        }
    } catch (e) {
        log(`[ENGINE-B] CSV cycle error: ${e.message}`);
    }
}

async function runDualPollingLoop() {
    if (!engineRunning) return;

    // Memory Hardening: Guard checks
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const uptimeHrs = (new Date() - lastBootTime) / 1000 / 60 / 60;

    if (memUsage > 500 || uptimeHrs > 6) {
        const reason = memUsage > 500 ? `Memory threshold exceeded (${Math.round(memUsage)}MB)` : 'Scheduled 6-hour refresh';
        log(`[STABILITY] 🔄 ${reason}. Restarting browser context...`);
        try { if (engineContext) await engineContext.close(); } catch(e) {}
        engineContext = null; enginePage = null;
        return setTimeout(async () => { await bootEngine(); }, 1000);
    }

    try {
        log('[DUAL] 🔄 Sweep cycle starting...');
        totalSweeps++;
        await enginePage.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
        
        // GPay 9 Resilience: Health Check (Smart Detection)
        const currentUrl = enginePage.url();
        const pageContent = await enginePage.content();
        
        // If we are redirected to the landing/signup page, session is definitely dead
        const isLoggedOut = currentUrl.includes('/g4b/signup') || 
                           (pageContent.includes('Sign in') && currentUrl.includes('accounts.google.com'));

        if (isLoggedOut) {
            log('[CRITICAL] 🚨 Bot session expired! Redirected to Login page. Stopping polling.');
            engineRunning = false;
            return;
        }

        log('[ENGINE-A] ⚡ XHR sweep complete');
        if (statsEngineB.captured === 0 || Math.random() < 0.2) await runEngineB();
        setTimeout(runDualPollingLoop, (accountConfig.download_interval_sec || 10) * 1000);
    } catch(e) {
        log(`[CRASH] Playwright stalled: ${e.message}. Recovering...`);
        engineRunning = false;
        try { if (engineContext) await engineContext.close(); } catch(x){}
        engineContext = null; enginePage = null;
        setTimeout(async () => { engineRunning = true; await bootEngine(); }, 5000);
    }
}

async function bootEngine() {
    lastBootTime = new Date();
    await fetchConfig();
    let merchantUrl = 'https://pay.google.com/g4b/signup';
    if (accountConfig.report_id) {
        merchantUrl = `https://pay.google.com/g4b/transactions/${accountConfig.report_id}`;
    }

    try {
        log(`🚀 GPay 9 Engine Booting for ${ACCOUNT_NAME}...`);
        
        // GPay 9 Resilience: Clean up locks
        const lockPath = path.join(SESSION_DIR, 'SingletonLock');
        if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);

        const chromePath = require('playwright').chromium.executablePath();
        engineContext = await chromium.launchPersistentContext(SESSION_DIR, {
            headless: true,
            executablePath: chromePath,
            acceptDownloads: true,
            downloadsPath: DOWNLOAD_DIR,
            args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
        });

        enginePage = await engineContext.newPage();
        
        log(`[SYSTEM] Navigating to Merchant Portal...`);
        await enginePage.goto(merchantUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // 🛡️ SELF-HEALING: Detect if logged out
        const currentUrl = enginePage.url();
        if (currentUrl.includes('accounts.google.com') || await enginePage.$('text="Sign in"')) {
            log(`[WARNING] Session expired. Triggering Self-Healing Auto-Login...`);
            await engineContext.close();
            
            const { spawnSync } = require('child_process');
            const loginScript = path.join(__dirname, 'auto-login.js');
            // Fetch credentials from config or env
            const res = await axios.get(`${HUB_URL}/api/bots/config?name=${encodeURIComponent(ACCOUNT_NAME)}`, {
                headers: { "x-bot-secret": BOT_SECRET }
            });
            const creds = res.data.data;
            
            if (creds && creds.email && creds.password) {
                spawnSync('node', [loginScript, ACCOUNT_NAME, creds.email, creds.password]);
                log(`[SUCCESS] Self-healing complete. Retrying boot...`);
                return await bootEngine(); // Retry boot after login
            } else {
                log(`[CRITICAL] Cannot self-heal: Missing credentials.`);
                return false;
            }
        }

        const match = enginePage.url().match(/(BCR[A-Z0-9]{10,})/);
        if (match && match[1]) {
            if (accountConfig.report_id !== match[1]) await updateReportId(match[1]);
            log(`[SYSTEM] Session Authenticated: ${match[1]}`);
        }

        log('[SYSTEM] ⚡ Engines ARMED and MONITORING.');
        setTimeout(runDualPollingLoop, 5000);
        return true;
    } catch (e) {
        log(`[CRITICAL] Engine Boot failed: ${e.message}`);
        engineRunning = false; return false;
    }
}

app.get('/internal/stats', (req, res) => {
    res.json({ 
        engineA: statsEngineA, 
        engineB: statsEngineB, 
        known: knownTransactions.size,
        recentLogs: recentLogs,
        uptime: Math.floor((new Date() - startTime) / 1000),
        totalSweeps,
        webhookStats,
        memory: process.memoryUsage().heapUsed
    });
});

app.listen(BOT_PORT, async () => {
    log(`GPay 9 Controller Active on port ${BOT_PORT}`);
    engineRunning = true;
    await bootEngine();
});

async function handleShutdown() {
    log(`Terminating engine...`);
    if (engineContext) await engineContext.close().catch(() => {});
    process.exit(0);
}
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
