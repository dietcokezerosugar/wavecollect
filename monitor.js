const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

// State
let stats = {
  activeBots: 0,
  totalBots: 0,
  dbStatus: 'CONNECTING...',
  totalVolume: 0,
  matchedCount: 0,
  lastUpdated: 'NEVER',
};

async function fetchData() {
  try {
    // 1. Get bot stats
    const bots = await prisma.googlePayAccount.findMany({
      orderBy: { name: 'asc' }
    });
    stats.totalBots = bots.length;
    stats.activeBots = bots.filter(b => b.sessionStatus === 'ONLINE').length;

    // 2. Get latest payments and total volume
    const latestIntents = await prisma.paymentIntent.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
    });

    const successfulIntents = await prisma.paymentIntent.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true }
    });
    stats.matchedCount = successfulIntents.length;
    stats.totalVolume = successfulIntents.reduce((sum, item) => sum + Number(item.amount), 0);

    // 3. Get latest transactions
    const latestTxns = await prisma.transaction.findMany({
      take: 8,
      orderBy: { timestamp: 'desc' }
    });

    stats.dbStatus = 'ONLINE';
    stats.lastUpdated = new Date().toLocaleTimeString();

    return { bots, latestIntents, latestTxns };
  } catch (e) {
    stats.dbStatus = `DISCONNECTED: ${e.message.substring(0, 30)}`;
    return null;
  }
}

function render(data) {
  // Clear screen and reset cursor position
  process.stdout.write('\x1b[2J\x1b[H');

  const blue = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const red = '\x1b[31m';
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const dim = '\x1b[2m';

  // 1. HEADER
  console.log(`${blue}┌──────────────────────────────────────────────────────────────────────────────┐${reset}`);
  console.log(`${blue}│${reset}${bold}  ⚡ PAYXMINT REAL-TIME CONTROL DASHBOARD & FLEET MONITOR v2.0  ${reset}${blue}│${reset}`);
  console.log(`${blue}└──────────────────────────────────────────────────────────────────────────────┘${reset}`);
  
  const dbColor = stats.dbStatus === 'ONLINE' ? green : red;
  console.log(`  ${bold}DB:${reset} ${dbColor}${stats.dbStatus}${reset}  │  ${bold}Active Bots:${reset} ${green}${stats.activeBots}/${stats.totalBots}${reset}  │  ${bold}Matches:${reset} ${yellow}${stats.matchedCount}${reset}  │  ${bold}Vol:${reset} ${green}₹${stats.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${reset}`);
  console.log(`  ${dim}Last Sync: ${stats.lastUpdated} | Press [r] to Refresh, [q] to Exit${reset}`);
  console.log(`${blue}────────────────────────────────────────────────────────────────────────────────${reset}`);

  if (!data) {
    console.log(`\n  ${red}⚠️ Database connection paused or offline. Retrying connection...${reset}`);
    return;
  }

  // 2. SCRAPER FLEET PANEL
  console.log(` ${bold}󱦶  SCRAPER FLEET STATUS (Google Pay Nodes)${reset}`);
  console.log(`   ${dim}${'VPA Name'.padEnd(16)} │ ${'UPI ID'.padEnd(24)} │ ${'Status'.padEnd(8)} │ ${'Session'.padEnd(8)} │ ${'Daily Quota (Used/Total)'}${reset}`);
  console.log(`   ${'─'.repeat(16)}┼${'─'.repeat(26)}┼${'─'.repeat(10)}┼${'─'.repeat(10)}┼${'─'.repeat(25)}`);
  
  if (data.bots.length === 0) {
    console.log(`   ${dim}No active bot accounts registered in the database.${reset}`);
  } else {
    data.bots.forEach(bot => {
      const statusColor = bot.status === 'ACTIVE' ? green : red;
      const sessionColor = bot.sessionStatus === 'ONLINE' ? green : (bot.sessionStatus === 'ERROR' ? red : yellow);
      const quotaStr = `₹${Number(bot.usedQuota).toFixed(0)}/₹${Number(bot.totalQuota).toFixed(0)}`;
      console.log(`   ${bot.name.padEnd(16)} │ ${bot.upiId.padEnd(24)} │ ${statusColor}${bot.status.padEnd(8)}${reset} │ ${sessionColor}${bot.sessionStatus.padEnd(8)}${reset} │ ${quotaStr}`);
    });
  }

  console.log(`${blue}────────────────────────────────────────────────────────────────────────────────${reset}`);

  // 3. LIVE TRANSACTIONS PANEL
  console.log(` ${bold}󱥿  LIVE CAPTURED BANK TRANSACTIONS (Google Pay Sync)${reset}`);
  console.log(`   ${dim}${'UTR/External Txn ID'.padEnd(24)} │ ${'Amount'.padEnd(12)} │ ${'Payer UPI ID'.padEnd(24)} │ ${'Order Note/Ref'}${reset}`);
  console.log(`   ${'─'.repeat(24)}┼${'─'.repeat(14)}┼${'─'.repeat(26)}┼${'─'.repeat(20)}`);

  if (data.latestTxns.length === 0) {
    console.log(`   ${dim}No Google Pay transactions synced to database yet.${reset}`);
  } else {
    data.latestTxns.forEach(txn => {
      const noteStr = txn.note ? txn.note.substring(0, 18) : 'N/A';
      console.log(`   ${txn.externalId.substring(0, 22).padEnd(24)} │ ${green}₹${Number(txn.amount).toFixed(2).padEnd(10)}${reset} │ ${String(txn.payerUpiId || 'unknown').substring(0, 22).padEnd(24)} │ ${noteStr}`);
    });
  }

  console.log(`${blue}────────────────────────────────────────────────────────────────────────────────${reset}`);

  // 4. ACTIVE PAYMENT INTENTS PANEL
  console.log(` ${bold}󰡏  ACTIVE PAYMENT INTENTS (Merchant Orders)${reset}`);
  console.log(`   ${dim}${'Order Reference ID'.padEnd(20)} │ ${'Order Amount'.padEnd(14)} │ ${'Status'.padEnd(12)} │ ${'Created At'.padEnd(12)} │ ${'Customer'}${reset}`);
  console.log(`   ${'─'.repeat(20)}┼${'─'.repeat(16)}┼${'─'.repeat(14)}┼${'─'.repeat(14)}┼${'─'.repeat(15)}`);

  if (data.latestIntents.length === 0) {
    console.log(`   ${dim}No active merchant payment intents found in the database.${reset}`);
  } else {
    data.latestIntents.forEach(intent => {
      const statusColor = intent.status === 'SUCCESS' ? green : (intent.status === 'PENDING' ? yellow : red);
      const timeStr = new Date(intent.createdAt).toLocaleTimeString();
      console.log(`   ${intent.referenceId.padEnd(20)} │ ${green}₹${Number(intent.amount).toFixed(2).padEnd(12)}${reset} │ ${statusColor}${intent.status.padEnd(12)}${reset} │ ${timeStr.padEnd(12)} │ ${intent.customerMobile || 'N/A'}`);
    });
  }

  console.log(`${blue}────────────────────────────────────────────────────────────────────────────────${reset}`);
}

async function loop() {
  const data = await fetchData();
  render(data);
}

// Start auto-refresh interval (2 seconds)
const intervalId = setInterval(loop, 2000);
loop();

// Setup keyboard listeners
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    clearInterval(intervalId);
    prisma.$disconnect();
    process.exit(0);
  }
  
  if (key.name === 'q') {
    process.stdout.write('\x1b[2J\x1b[H');
    console.log('Monitor terminated. Goodbye!');
    clearInterval(intervalId);
    prisma.$disconnect();
    process.exit(0);
  }
  
  if (key.name === 'r') {
    loop(); // Trigger instant refresh
  }
});
