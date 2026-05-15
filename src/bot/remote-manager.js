const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');
const promisify = require('util').promisify;
const execAsync = promisify(exec);

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// CONFIGURATION
const VPS_URL = process.env.VPS_URL || "https://your-vps-domain.com"; 
const BOT_SECRET = process.env.INTERNAL_BOT_SECRET || "wave_collect_bridge_secret_998877";
const SYNC_INTERVAL_MS = 30000; // 30 seconds

async function sync() {
    try {
        console.log(`[SYSTEM] Syncing with VPS: ${VPS_URL}...`);
        const res = await axios.post(`${VPS_URL}/api/bots/bridge`, {
            action: "sync"
        }, {
            headers: { "x-bot-secret": BOT_SECRET },
            timeout: 10000
        });

        const accounts = res.data.accounts || [];
        console.log(`[SYSTEM] Received ${accounts.length} managed accounts.`);

        for (const acc of accounts) {
            await handleAccount(acc);
        }

    } catch (e) {
        console.error(`[ERROR] Sync failed: ${e.message}`);
    }
}

async function handleAccount(acc) {
    const pm2Name = `gpay-${acc.name}`;
    
    // Check local PM2 status
    let localStatus = "offline";
    try {
        const { stdout } = await execAsync(`pm2 jlist`);
        const list = JSON.parse(stdout);
        const proc = list.find(p => p.name === pm2Name);
        if (proc) localStatus = proc.pm2_env.status;
    } catch (e) {}

    console.log(`[BOT] ${acc.name} | Desired: ${acc.desiredStatus} | Local: ${localStatus}`);

    if (acc.desiredStatus === "START" && localStatus !== "online") {
        console.log(`[ACTION] Starting ${acc.name}...`);
        const ecosystemPath = path.join(__dirname, '../../ecosystem.config.js');
        await execAsync(`pm2 start "${ecosystemPath}" --only "${pm2Name}"`);
    } else if (acc.desiredStatus === "STOP" && localStatus === "online") {
        console.log(`[ACTION] Stopping ${acc.name}...`);
        await execAsync(`pm2 stop "${pm2Name}"`);
    } else if (acc.desiredStatus === "LOGIN_AUTO" || acc.desiredStatus === "LOGIN_MANUAL") {
        const isManual = acc.desiredStatus === "LOGIN_MANUAL";
        console.log(`[ACTION] ${isManual ? '🖥️' : '🔐'} Attempting ${isManual ? 'MANUAL' : 'AUTO'}-LOGIN for ${acc.name}...`);
        try {
            const loginScript = path.join(__dirname, 'auto-login.js');
            const manualFlag = isManual ? '--manual' : '';
            
            // Usage: node auto-login.js <name> <email> <password> <proxy> [--manual]
            await execAsync(`node "${loginScript}" "${acc.name}" "${acc.email}" "${acc.botPassword}" "${acc.proxyConfig || ''}" ${manualFlag}`, {
                env: { 
                    ...process.env, 
                    VPS_URL, 
                    BOT_SECRET,
                    DISPLAY: process.env.DISPLAY || ':0' // Ensure it shows in VNC
                }
            });
            console.log(`[SUCCESS] Login complete for ${acc.name}. Switching to START.`);
            
            await axios.post(`${VPS_URL}/api/bots/control`, {
                action: "start",
                name: acc.name
            }, {
                headers: { "x-bot-secret": BOT_SECRET },
                timeout: 10000
            });
        } catch (e) {
            console.error(`[ERROR] Login failed: ${e.message}`);
        }
    } else if (acc.desiredStatus === "RESTART") {
        console.log(`[ACTION] Restarting ${acc.name}...`);
        await execAsync(`pm2 restart "${pm2Name}"`);
        // We should report back that we restarted so the server can reset desiredStatus to START
    }

    // Report Heartbeat
    await axios.post(`${VPS_URL}/api/bots/bridge`, {
        action: "heartbeat",
        payload: { name: acc.name, currentStatus: localStatus }
    }, {
        headers: { "x-bot-secret": BOT_SECRET },
        timeout: 10000
    }).catch(() => {});
}

console.log("=== payxmint REMOTE MANAGER ===");
console.log(`Target: ${VPS_URL}`);
sync();
setInterval(sync, SYNC_INTERVAL_MS);
