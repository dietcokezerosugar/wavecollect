const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ACCOUNT_NAME = process.argv[2];
const EMAIL = process.argv[3];
const PASSWORD = process.argv[4];

if (!ACCOUNT_NAME || !EMAIL || !PASSWORD) {
    console.error("[ERROR] Missing arguments. Usage: node auto-login.js <name> <email> <password>");
    process.exit(1);
}

const SESSION_DIR = path.join(__dirname, `../../.sessions/session-${ACCOUNT_NAME}`);
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

function log(msg) {
    console.log(`[PROGRESS] ${msg}`);
}

async function run() {
    log(`Booting automated login for ${ACCOUNT_NAME}...`);
    
    // Launch Playwright headful but we don't strictly need to be visible. 
    // However, Google login is less likely to block if it's a standard headful browser
    const chromePath = chromium.executablePath();
    const context = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: true,
        executablePath: chromePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1280,800'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        viewport: { width: 1280, height: 800 }
    });

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
        const emailInput = await page.$('input[type="email"]');
        if (emailInput && await emailInput.isVisible()) {
            log(`Auth: Email...`);
            await emailInput.fill(EMAIL);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            continue;
        }

        // Password
        const passInput = await page.$('input[type="password"]');
        if (passInput && await passInput.isVisible()) {
            log(`Auth: Password...`);
            await passInput.fill(PASSWORD);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);
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
            await page.getByText('Verify it’s you').count() > 0) {
            log(`[WARNING] Manual verification required.`);
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
