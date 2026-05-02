const fs = require('fs');
const path = require('path');

// Dynamically generate app list based on sessions/accounts
// This ensures that 'pm2 start ecosystem.config.js' always knows about all accounts
const sessionDir = path.join(__dirname, '.sessions');
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

const accounts = fs.readdirSync(sessionDir)
    .filter(f => f.startsWith('session-'))
    .map(f => f.replace('session-', ''));

module.exports = {
    apps: accounts.map((name, index) => ({
        name: `gpay-${name}`,
        script: path.join(__dirname, 'src/bot/bot.js'),
        args: name,
        cwd: __dirname,
        autorestart: true,
        max_restarts: 50,
        min_uptime: '10s',
        restart_delay: 5000 + (index * 2000),
        max_memory_restart: '800M',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        error_file: `./logs/${name}-error.log`,
        out_file: `./logs/${name}-out.log`,
        merge_logs: true,
        env: {
            NODE_ENV: 'production',
            PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW: '1'
        }
    }))
};
