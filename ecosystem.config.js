module.exports = {
  apps: [
    {
      name: "wavecollect-web",
      script: "npm",
      args: "start",
      cwd: "./",
      env: {
        NODE_ENV: "production",
      },
      instances: 1, // Single instance to avoid DB pool issues unless properly clustered
      autorestart: true,
      watch: false,
      max_memory_restart: "1G", // Prevent Next.js from leaking
    },
    {
      name: "wavecollect-bot-fleet",
      script: "./src/bot/bot.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
      },
      instances: 1, // Start with 1 fleet manager
      autorestart: true,
      watch: false,
      max_memory_restart: "2G", // CRITICAL: Kill Puppeteer if it leaks memory
      cron_restart: "0 */6 * * *", // Hard restart every 6 hours to clear zombie Chrome instances
    }
  ]
};
