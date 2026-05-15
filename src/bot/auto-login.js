const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const ACCOUNT_NAME = process.argv[2];
const EMAIL = process.argv[3];
const PASSWORD = process.argv[4];
const PROXY_CONFIG = process.argv[5];
const isManual = process.argv.includes('--manual');
const isTerminal = process.argv.includes('--terminal');

if (!ACCOUNT_NAME || !EMAIL || !PASSWORD) {
    console.error("[ERROR] Missing arguments. Usage: node auto-login.js <name> <email> <password> [proxy] [--manual | --terminal]");
    process.exit(1);
}

const SESSION_DIR = path.join(__dirname, `../../.sessions/session-${ACCOUNT_NAME}`);
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

const LOG_FILE = path.join(SESSION_DIR, 'auto-login.log');

function log(msg) {
    const formatted = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(`[PROGRESS] ${formatted}`);
    fs.appendFileSync(LOG_FILE, formatted + '\n');
}

// Clear log at start
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

async function run() {
    log(`🚀 Initiating Node Onboarding for ${ACCOUNT_NAME}...`);
    if (isManual) log("🔧 INTERACTIVE MODE: Cloud Browser will stream to your dashboard.");
    if (isTerminal) log("🖥️ TERMINAL MODE: Browser will open on VPS display (VNC required).");

    // 🛡️ VPS VISIBILITY HARDENING:
    // If running in terminal mode, we MUST ensure the DISPLAY is set for the VNC server.
    if (isTerminal && !process.env.DISPLAY) {
        process.env.DISPLAY = ':0'; 
    }

    const chromePath = chromium.executablePath();
    const launchOptions = {
        headless: (!isManual && !isTerminal),
        executablePath: chromePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1280,800',
            '--disable-gpu',                // Essential for VPS stability
            '--disable-software-rasterizer', // Prevents rendering hangs
            '--start-maximized'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        viewport: { width: 1280, height: 800 }
    };

    if (PROXY_CONFIG && PROXY_CONFIG.length > 5 && PROXY_CONFIG !== '--manual' && PROXY_CONFIG !== '--terminal') {
        log(`Using Proxy: ${PROXY_CONFIG}`);
        const proxyUrl = new URL(PROXY_CONFIG.startsWith('http') ? PROXY_CONFIG : `http://${PROXY_CONFIG}`);
        launchOptions.proxy = { server: `${proxyUrl.protocol}//${proxyUrl.hostname}:${proxyUrl.port}` };
        if (proxyUrl.username) {
            launchOptions.proxy.username = proxyUrl.username;
            launchOptions.proxy.password = proxyUrl.password;
        }
    }

    const context = await chromium.launchPersistentContext(SESSION_DIR, launchOptions);
    const page = await context.newPage();
    let isLoggedIn = false;

    log(`Checking for existing session...`);
    try {
        await page.goto('https://pay.google.com/g4b/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const checkUrl = page.url();
        if (checkUrl.includes('BCR') || checkUrl.includes('/home') || checkUrl.includes('/transactions')) {
            log(`[SUCCESS] Session is already active. Reusing...`);
            await context.close();
            process.exit(0);
        }
    } catch (e) {
        log(`[WARNING] Initial check timed out, attempting login...`);
    }

    if (isManual) {
        // ═══════════════════════════════════════════
        // MANUAL / INTERACTIVE MODE — Cloud Browser
        // ═══════════════════════════════════════════
        const express = require('express');
        const cors = require('cors');
        const app = express();
        app.use(cors());
        app.use(express.json());
        
        // Deterministic port so the dashboard proxy can find us
        const INTERACT_PORT = 5000 + (parseInt(Buffer.from(ACCOUNT_NAME).toString('hex').slice(0, 4), 16) % 1000); 

        app.get('/api/control/screen', async (req, res) => {
            try {
                const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Cache-Control', 'no-cache');
                res.send(screenshot);
            } catch (e) { res.status(500).send(e.message); }
        });

        app.post('/api/control/interact', async (req, res) => {
            const { type, x, y, key } = req.body;
            try {
                if (type === 'click') {
                    log(`🖱️ Click at (${x}, ${y})`);
                    await page.mouse.click(x, y);
                } else if (type === 'type') {
                    await page.keyboard.type(key, { delay: 50 });
                } else if (type === 'press') {
                    log(`⌨️ Key: ${key}`);
                    await page.keyboard.press(key);
                }
                res.json({ status: "ok" });
            } catch (e) { res.status(500).json({ error: e.message }); }
        });

        const server = app.listen(INTERACT_PORT, () => {
            log(`📡 Cloud Browser live on port ${INTERACT_PORT}. View it in your dashboard now!`);
        });

        // Poll until the user completes login
        while (true) {
            const currentUrl = page.url();
            if (currentUrl.includes('BCR') || currentUrl.includes('/home') || currentUrl.includes('/transactions')) {
                log(`[SUCCESS] Interactive login verified!`);
                isLoggedIn = true;
                break;
            }
            await page.waitForTimeout(2000);
        }
        server.close();

    } else if (isTerminal) {
        // ═══════════════════════════════════════════
        // TERMINAL MODE — User interacts on VPS VNC
        // ═══════════════════════════════════════════
        log("Waiting for you to complete login in the browser window...");
        
        while (true) {
            const currentUrl = page.url();
            if (currentUrl.includes('BCR') || currentUrl.includes('/home') || currentUrl.includes('/transactions')) {
                log(`[SUCCESS] Terminal login verified!`);
                isLoggedIn = true;
                break;
            }
            // Check if page is closed
            if (page.isClosed()) {
                log("[ERROR] Browser window closed before login was verified.");
                break;
            }
            await page.waitForTimeout(2000);
        }
    } else {
        // ═══════════════════════════════════════════
        // AUTOMATIC MODE — Bot handles everything
        // ═══════════════════════════════════════════
        let loopCount = 0;
        const maxLoops = 20; 

        while (loopCount < maxLoops) {
            loopCount++;
            await page.waitForTimeout(1500);

            const currentUrl = page.url();
            log(`Scan: State ${loopCount}/${maxLoops}`);

            if (currentUrl.includes('pay.google.com/g4b/signup') || currentUrl.includes('pay.google.com/g4b/transactions') || currentUrl.includes('pay.google.com/g4b/home')) {
                const loginBtn = await page.$('a[href*="accounts.google.com"], button:has-text("Sign in")');
                if (loginBtn && !currentUrl.includes('home')) {
                    await loginBtn.click();
                    continue;
                }
                
                const match = page.url().match(/(BCR[A-Z0-9]{10,})/);
                if (match || currentUrl.includes('home') || currentUrl.includes('transactions')) {
                    log(`[SUCCESS] Login verified.`);
                    isLoggedIn = true;
                    break;
                }
            }

            // Email
            const emailInput = await page.$('input[type="email"], input#identifierId, input[name="identifier"]');
            if (emailInput && await emailInput.isVisible()) {
                log(`Auth: Email...`);
                await emailInput.focus();
                await page.waitForTimeout(800 + Math.random() * 500);
                await page.keyboard.type(EMAIL, { delay: 100 + Math.random() * 100 });
                await page.waitForTimeout(1000 + Math.random() * 1000);
                
                const nextBtns = await page.$$('button:has-text("Next"), span:has-text("Next"), button:has-text("Continue"), span:has-text("Continue")');
                if (nextBtns.length > 0) {
                    await nextBtns[0].click();
                } else {
                    await page.keyboard.press('Enter');
                }
                await page.waitForTimeout(3000 + Math.random() * 1000);
                continue;
            }

            // Password
            const passInput = await page.$('input[type="password"], input[name="Passwd"]');
            if (passInput && await passInput.isVisible()) {
                log(`Auth: Password...`);
                await passInput.focus();
                await page.waitForTimeout(800 + Math.random() * 500);
                await page.keyboard.type(PASSWORD, { delay: 100 + Math.random() * 100 });
                await page.waitForTimeout(1000 + Math.random() * 1000);
                
                const nextBtns = await page.$$('button:has-text("Next"), span:has-text("Next"), button:has-text("Continue"), span:has-text("Continue")');
                if (nextBtns.length > 0) {
                    await nextBtns[0].click();
                } else {
                    await page.keyboard.press('Enter');
                }
                await page.waitForTimeout(4000 + Math.random() * 2000);
                continue;
            }

            // Bypasses
            const buttonTexts = ['Not now', 'Skip', 'I understand', 'No thanks', 'Continue', 'Done', 'Confirm'];
            let clicked = false;
            for (const text of buttonTexts) {
                const btn = page.getByRole('button', { name: text, exact: true });
                if (await btn.count() > 0 && await btn.first().isVisible()) {
                    log(`Skip: ${text}...`);
                    await btn.first().click();
                    clicked = true;
                    await page.waitForTimeout(2000);
                    break;
                }
            }
            if (clicked) continue;

            if (await page.getByText('2-Step Verification').count() > 0 || 
                await page.getByText('Verify it\'s you').count() > 0 ||
                await page.getByText('Confirm your recovery email').count() > 0 ||
                await page.getByText('Confirm your phone number').count() > 0 ||
                await page.getByText('Enter code').count() > 0) {
                
                log(`[WARNING] Security challenge reached. Use Manual Mode if this stalls.`);
                await page.waitForTimeout(10000);
            }
        }
    }

    if (isLoggedIn) {
        log(`[SUCCESS] Bot linking complete.`);
        
        // GPay 9 Auto-Start Sequence
        try {
            log(`[SYSTEM] Initiating GPay 9 boot sequence for ${ACCOUNT_NAME}...`);
            const { exec } = require('child_process');
            const ecosystemPath = path.join(__dirname, '../../ecosystem.config.js');
            const cmd = `pm2 start "${ecosystemPath}" --only "gpay-${ACCOUNT_NAME}"`;
            
            exec(cmd, (err) => {
                if (err) log(`[ERROR] GPay 9 boot failed: ${err.message}`);
                else log("[SUCCESS] GPay 9 Engine is now LIVE and monitoring.");
            });
        } catch (e) {
            log("[ERROR] Failed to initiate bot boot.");
        }

        await context.close();
        process.exit(0);
    } else {
        const errorPath = path.join(SESSION_DIR, 'error-snapshot.png');
        await page.screenshot({ path: errorPath });
        log(`[ERROR] Automatic linking failed.`);
        await context.close();
        process.exit(1);
    }
}

run().catch(async (e) => {
    log(`[CRITICAL] Engine Crash: ${e.message}`);
    process.exit(1);
});
