const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const ACCOUNT_NAME = process.argv[2];
const PROXY_CONFIG = process.argv[3];
const HUB_URL = process.env.HUB_URL || "http://localhost:3000";
const BOT_SECRET = process.env.BOT_SYSTEM_SECRET || "wave_collect_bridge_secret_998877";

if (!ACCOUNT_NAME) {
    console.error("Account name required");
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
    log(`🔧 MANUAL MODE: Launching visible browser for ${ACCOUNT_NAME}...`);
    log(`👉 PLEASE SWITCH TO YOUR VNC VIEWER TO COMPLETE THE LOGIN.`);
    const chromePath = chromium.executablePath();
    
    const launchOptions = {
        headless: false,
        executablePath: chromePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--window-size=1280,900'
        ],
        viewport: { width: 1280, height: 900 }
    };

    if (PROXY_CONFIG && PROXY_CONFIG.length > 5) {
        console.log(`[MANUAL] Routing through Proxy: ${PROXY_CONFIG}`);
        const proxyUrl = new URL(PROXY_CONFIG.startsWith('http') ? PROXY_CONFIG : `http://${PROXY_CONFIG}`);
        launchOptions.proxy = { server: `${proxyUrl.protocol}//${proxyUrl.hostname}:${proxyUrl.port}` };
        if (proxyUrl.username) {
            launchOptions.proxy.username = proxyUrl.username;
            launchOptions.proxy.password = proxyUrl.password;
        }
    }

    const context = await chromium.launchPersistentContext(SESSION_DIR, launchOptions);

    const page = await context.newPage();
    await page.goto('https://pay.google.com/g4b/signup');

    console.log("[MANUAL] Waiting for user to complete login and close window...");

    // Wait for the window to be closed
    await new Promise((resolve) => {
        context.on('close', resolve);
    });

    console.log("[SYSTEM] Window closed. Starting auto-discovery and bot provisioning...");

    // 1. Brief headless check to find the Merchant ID
    const discoveryLaunchOptions = {
        headless: true,
        executablePath: chromePath,
        args: ['--no-sandbox']
    };
    if (launchOptions.proxy) {
        discoveryLaunchOptions.proxy = launchOptions.proxy;
    }
    const discoveryContext = await chromium.launchPersistentContext(SESSION_DIR, discoveryLaunchOptions);
    const dPage = await discoveryContext.newPage();
    
    try {
        await dPage.goto('https://pay.google.com/g4b/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });
        const currentUrl = dPage.url();
        const match = currentUrl.match(/(BCR[A-Z0-9]{10,})/);
        
        if (match) {
            const reportId = match[1];
            console.log(`[SUCCESS] Auto-discovered Merchant ID: ${reportId}`);
            
            // 2. Save to Database
            await axios.post(`${HUB_URL}/api/bots/config`, {
                name: ACCOUNT_NAME,
                report_id: reportId
            }, {
                headers: { "x-bot-secret": BOT_SECRET }
            });
            console.log("[SYSTEM] Configuration updated successfully.");
        }
    } catch (e) {
        console.log("[WARNING] Could not auto-discover Merchant ID. Will use existing config.");
    } finally {
        await discoveryContext.close();
    }

    // 3. Automatically start the bot (GPay 9 direct execution)
    try {
        console.log(`[SYSTEM] Initiating GPay 9 boot sequence for ${ACCOUNT_NAME}...`);
        const { exec } = require('child_process');
        const ecosystemPath = path.join(__dirname, '../../ecosystem.config.js');
        const cmd = `pm2 start "${ecosystemPath}" --only "gpay-${ACCOUNT_NAME}"`;
        
        exec(cmd, (err) => {
            if (err) {
                console.error(`[ERROR] GPay 9 boot failed: ${err.message}`);
            } else {
                console.log("[SUCCESS] GPay 9 Engine is now LIVE and monitoring.");
            }
        });
    } catch (e) {
        console.error("[ERROR] Failed to initiate bot boot.");
    }

    process.exit(0);
}

run().catch(e => {
    console.error(`[CRITICAL] Manual login process crashed: ${e.message}`);
    process.exit(1);
});
