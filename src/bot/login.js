const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const ACCOUNT_NAME = process.argv[2];
if (!ACCOUNT_NAME) {
    console.error("Account name required");
    process.exit(1);
}

const SESSION_DIR = path.join(__dirname, `../../.sessions/session-${ACCOUNT_NAME}`);
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

async function run() {
    console.log(`[MANUAL] Launching headful login browser for ${ACCOUNT_NAME}`);
    const chromePath = chromium.executablePath();
    
    const context = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: false,
        executablePath: chromePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--window-size=1280,900'
        ],
        viewport: { width: 1280, height: 900 }
    });

    const page = await context.newPage();
    await page.goto('https://pay.google.com/g4b/signup');

    console.log("[MANUAL] Waiting for user to complete login and close window...");

    // Wait for the window to be closed
    await new Promise((resolve) => {
        context.on('close', resolve);
    });

    console.log("[SYSTEM] Window closed. Starting auto-discovery and bot provisioning...");

    // 1. Brief headless check to find the Merchant ID
    const discoveryContext = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: true,
        executablePath: chromePath,
        args: ['--no-sandbox']
    });
    const dPage = await discoveryContext.newPage();
    
    try {
        await dPage.goto('https://pay.google.com/g4b/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });
        const currentUrl = dPage.url();
        const match = currentUrl.match(/(BCR[A-Z0-9]{10,})/);
        
        if (match) {
            const reportId = match[1];
            console.log(`[SUCCESS] Auto-discovered Merchant ID: ${reportId}`);
            
            // 2. Save to Database
            await axios.post('http://localhost:3000/api/bots/config', {
                name: ACCOUNT_NAME,
                report_id: reportId
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
