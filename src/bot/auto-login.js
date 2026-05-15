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

if (!ACCOUNT_NAME || !EMAIL || !PASSWORD) {
    console.error("[ERROR] Missing arguments. Usage: node auto-login.js <name> <email> <password> [proxy]");
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
    
    // Launch Playwright headful but we don't strictly need to be visible. 
    // However, Google login is less likely to block if it's a standard headful browser
    const chromePath = chromium.executablePath();
    const isManual = process.argv.includes('--manual');
    if (isManual) log("🔧 INTERACTIVE MODE: Launching visible browser on VPS desktop...");

    const chromePath = chromium.executablePath();
    const launchOptions = {
        headless: !isManual,
        executablePath: chromePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1280,800'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        viewport: { width: 1280, height: 800 }
    };

    if (PROXY_CONFIG && PROXY_CONFIG.length > 5) {
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
    
    log(`Checking for existing session...`);
    try {
        await page.goto('https://pay.google.com/g4b/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Fast check: Are we already on a dashboard or BCR URL?
        const checkUrl = page.url();
        if (checkUrl.includes('BCR') || checkUrl.includes('/home') || checkUrl.includes('/transactions')) {
            log(`[SUCCESS] Session is already active. Reusing...`);
            await context.close();
            process.exit(0);
        }
    } catch (e) {
        log(`[WARNING] Initial check timed out, attempting login...`);
    }

    let loopCount = 0;
    const maxLoops = 20; 
    let isLoggedIn = false;

    while (loopCount < maxLoops) {
        loopCount++;
        await page.waitForTimeout(1500); // GPay 9 optimized delay

        const currentUrl = page.url();
        log(`Scan: State \${loopCount}/\${maxLoops}`);

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
                log(`Skip: \${text}...`);
                await btn.first().click();
                clicked = true;
                await page.waitForTimeout(2000);
                break;
            }
        }
        if (clicked) continue;

        if (await page.getByText('2-Step Verification').count() > 0 || 
            await page.getByText('Verify it\'s you').count() > 0 ||
            await page.getByText('Verify it’s you').count() > 0 ||
            await page.getByText('Confirm your recovery email').count() > 0 ||
            await page.getByText('Confirm your phone number').count() > 0 ||
            await page.getByText('Protect your account').count() > 0 ||
            await page.getByText('Add recovery phone').count() > 0 ||
            await page.getByText('Enter code').count() > 0) {
            
            const vpsUrl = process.env.VPS_URL || process.env.HUB_URL || 'http://localhost:3000';
            const botSecret = process.env.BOT_SECRET || process.env.BOT_SYSTEM_SECRET || 'wave_collect_bridge_secret_998877';

            log(`[WARNING] Security checkpoint reached (2FA/Recovery). Requesting OTP from Dashboard...`);
            
            try {
                await axios.post(`${vpsUrl}/api/bots/control`, {
                    action: "waiting_otp",
                    name: ACCOUNT_NAME
                }, { 
                    headers: { "x-bot-secret": botSecret },
                    timeout: 10000
                });
            } catch(e) {}

            let otpReceived = null;
            for (let i = 0; i < 60; i++) { // Wait up to 5 minutes
                await page.waitForTimeout(5000);
                try {
                    const res = await axios.post(`${vpsUrl}/api/bots/bridge`, { action: "sync" }, { 
                        headers: { "x-bot-secret": botSecret },
                        timeout: 10000
                    });
                    const acc = res.data.accounts.find(a => a.name === ACCOUNT_NAME);
                    if (acc && acc.desiredStatus === "OTP_READY" && acc.otpCode) {
                        otpReceived = acc.otpCode;
                        break;
                    }
                } catch(e) {}
            }

            if (otpReceived) {
                log(`[SUCCESS] Received OTP from Dashboard: ${otpReceived}`);
                // Try to find the generic OTP or text input field
                const otpInput = await page.$('input[type="tel"], input[name="Pin"], input[autocomplete="one-time-code"], input[type="text"], input[type="email"]');
                if (otpInput) {
                    await otpInput.focus();
                    await page.waitForTimeout(500);
                    await page.keyboard.type(otpReceived, { delay: 100 + Math.random() * 100 });
                    await page.waitForTimeout(1000);
                    const nextBtns = await page.$$('button:has-text("Next"), span:has-text("Next"), button:has-text("Continue"), span:has-text("Continue")');
                    if (nextBtns.length > 0) {
                        await nextBtns[0].click();
                    } else {
                        await page.keyboard.press('Enter');
                    }
                    await page.waitForTimeout(5000);
                    continue; // Re-evaluate URL after submitting OTP
                }
            }
            
            log(`[ERROR] Timed out waiting for OTP or could not find input field.`);
            break;
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
