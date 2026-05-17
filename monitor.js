const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// UI Configuration
const SCREEN_HEIGHT = 30;
const LEFT_WIDTH = 28;
const RIGHT_WIDTH = 58;

// State
let selectedIndex = 0;
let botsList = [];
let latestIntents = [];
let logsBuffer = [];
let stats = {
  dbStatus: 'CONNECTING...',
  totalVolume: 0,
  matchedCount: 0,
  lastUpdated: 'NEVER',
};

// Key Helper for Clean Text Clipping
function clip(str, len) {
  str = String(str || '');
  if (str.length > len) {
    return str.substring(0, len - 3) + '...';
  }
  return str.padEnd(len);
}

async function updateState() {
  try {
    // 1. Get bot list
    botsList = await prisma.googlePayAccount.findMany({
      orderBy: { name: 'asc' }
    });

    // Clamp selected index if list changes
    if (botsList.length > 0) {
      selectedIndex = Math.max(0, Math.min(selectedIndex, botsList.length - 1));
    }

    // 2. Read logs of selected bot
    logsBuffer = [];
    if (botsList.length > 0 && selectedIndex < botsList.length) {
      const selectedBot = botsList[selectedIndex];
      const logPath = path.join(__dirname, '.sessions', `session-${selectedBot.name}`, 'bot.log');
      
      if (fs.existsSync(logPath)) {
        try {
          const content = fs.readFileSync(logPath, 'utf8');
          const lines = content.split(/\r?\n/).filter(Boolean);
          // Get last 15 lines
          logsBuffer = lines.slice(-15);
        } catch (e) {
          logsBuffer = [`Error reading logs: ${e.message}`];
        }
      } else {
        logsBuffer = [`No log sessions found. Bot might be offline.`];
      }
    } else {
      logsBuffer = ['No active processes selected.'];
    }

    // 3. Get latest matched intents
    latestIntents = await prisma.paymentIntent.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { transaction: true }
    });

    // 4. Overall stats
    const successfulIntents = await prisma.paymentIntent.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true }
    });
    stats.matchedCount = successfulIntents.length;
    stats.totalVolume = successfulIntents.reduce((sum, item) => sum + Number(item.amount), 0);

    stats.dbStatus = 'ONLINE';
    stats.lastUpdated = new Date().toLocaleTimeString();
  } catch (e) {
    stats.dbStatus = `DISCONNECTED: ${e.message.substring(0, 20)}`;
  }
}

function render() {
  // Clear screen and reset cursor position to top-left
  process.stdout.write('\x1b[2J\x1b[H');

  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const red = '\x1b[31m';
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const dim = '\x1b[2m';
  const bgSelected = '\x1b[46m\x1b[30m'; // Cyan background, black text

  // 1. HEADER ROW
  console.log(`${cyan}┌─────────────────────────────┬────────────────────────────────────────────────────────┐${reset}`);
  const titleText = `${bold}  󱦶  PAYXMINT CONTROL FLEET  ${reset}${cyan}│${reset}${bold}  󱥿  PROCESS ACTIVITY LOGS (Tailed Live)               ${reset}${cyan}│${reset}`;
  console.log(`${cyan}│${reset}${titleText}`);
  console.log(`${cyan}├─────────────────────────────┼────────────────────────────────────────────────────────┤${reset}`);

  // Grid drawing space
  for (let i = 0; i < 15; i++) {
    let leftSide = '';
    let rightSide = '';

    // LEFT PANEL: Process List
    if (i < botsList.length) {
      const bot = botsList[i];
      const isSelected = i === selectedIndex;
      const selectIndicator = isSelected ? '● ' : '○ ';
      const statusIcon = bot.sessionStatus === 'ONLINE' ? `${green}● online${reset}` : (bot.sessionStatus === 'ERROR' ? `${red}● error${reset}` : `${yellow}● offline${reset}`);
      
      const rawText = `${selectIndicator}${clip(bot.name, 12)} (${statusIcon})`;
      const padLen = LEFT_WIDTH - 2 - (bot.sessionStatus === 'ONLINE' ? 8 : (bot.sessionStatus === 'ERROR' ? 7 : 9));
      
      if (isSelected) {
        // Highlight active selected process row
        leftSide = ` ${bgSelected}${clip(bot.name, 12).padEnd(14)} │ ${bot.sessionStatus.padEnd(8)}${reset} `;
      } else {
        leftSide = ` ${dim}${selectIndicator}${reset}${clip(bot.name, 12)} │ ${statusIcon} `;
      }
    } else if (i === botsList.length && botsList.length === 0) {
      leftSide = ` ${dim}No active bots.${reset}`.padEnd(LEFT_WIDTH + 8);
    } else {
      leftSide = ' '.repeat(LEFT_WIDTH);
    }

    // RIGHT PANEL: selected bot log tail
    if (i < logsBuffer.length) {
      const logLine = logsBuffer[i];
      // Format timestamps or ENGINE tags slightly for color
      let formattedLine = logLine;
      if (formattedLine.includes('[ENGINE-A]')) formattedLine = formattedLine.replace('[ENGINE-A]', `${green}[ENGINE-A]${reset}`);
      if (formattedLine.includes('[ENGINE-B]')) formattedLine = formattedLine.replace('[ENGINE-B]', `${yellow}[ENGINE-B]${reset}`);
      if (formattedLine.includes('[CRITICAL]') || formattedLine.includes('failed')) formattedLine = formattedLine.replace(/CRITICAL|failed/g, `${red}$&${reset}`);
      if (formattedLine.includes('[DUAL]')) formattedLine = formattedLine.replace('[DUAL]', `${cyan}[DUAL]${reset}`);
      
      rightSide = ` ${clip(formattedLine, RIGHT_WIDTH - 2)}`;
    } else {
      rightSide = ' '.repeat(RIGHT_WIDTH);
    }

    // Clean padding adjustments for escape codes
    const leftFill = leftSide.padEnd(LEFT_WIDTH + (leftSide.includes('\x1b') ? 18 : 0));
    const rightFill = rightSide.padEnd(RIGHT_WIDTH + (rightSide.includes('\x1b') ? 18 : 0));
    console.log(`${cyan}│${reset}${leftFill}${cyan}│${reset}${rightFill}${cyan}│${reset}`);
  }

  // 2. MIDDLE RECONCILIATION SEPARATOR
  console.log(`${cyan}├─────────────────────────────┴────────────────────────────────────────────────────────┤${reset}`);
  console.log(`${cyan}│${reset}${bold}  󰡏  REAL-TIME TRANSACTION MATCHING & RECONCILIATION FEED (Live Hub Matches)          ${reset}${cyan}│${reset}`);
  console.log(`${cyan}├──────────────────────────────────────────────────────────────────────────────────────┤${reset}`);
  console.log(`${cyan}│${reset}   ${dim}${'Order Ref ID'.padEnd(20)} │ ${'Amount'.padEnd(12)} │ ${'Status'.padEnd(12)} │ ${'UTR / Bank Reference ID'.padEnd(24)} │ ${'Payer'}${reset}   ${cyan}│${reset}`);
  console.log(`${cyan}│${reset}   ${'─'.repeat(20)}┼${'─'.repeat(14)}┼${'─'.repeat(14)}┼${'─'.repeat(26)}┼${'─'.repeat(12)}   ${cyan}│${reset}`);

  // Render bottom matching rows
  for (let i = 0; i < 6; i++) {
    if (i < latestIntents.length) {
      const intent = latestIntents[i];
      const statusColor = intent.status === 'SUCCESS' ? green : (intent.status === 'PENDING' ? yellow : red);
      const utrStr = intent.transaction?.utr || 'Awaiting Sync...';
      const payerStr = intent.payerName || 'N/A';
      
      const rowContent = `   ${intent.referenceId.padEnd(20)} │ ${green}₹${Number(intent.amount).toFixed(2).padEnd(10)}${reset} │ ${statusColor}${intent.status.padEnd(12)}${reset} │ ${utrStr.padEnd(24)} │ ${clip(payerStr, 12)}`;
      const fillLen = 82 + (rowContent.includes('\x1b') ? 18 : 0);
      console.log(`${cyan}│${reset}${rowContent.padEnd(fillLen)}${cyan}│${reset}`);
    } else {
      console.log(`${cyan}│${reset}${' '.repeat(82)}${cyan}│${reset}`);
    }
  }

  // 3. STATS SUMMARY FOOTER
  console.log(`${cyan}├──────────────────────────────────────────────────────────────────────────────────────┤${reset}`);
  const dbStatusStr = stats.dbStatus === 'ONLINE' ? `${green}ONLINE${reset}` : `${red}${stats.dbStatus}${reset}`;
  const statsLine = `  ${bold}DB Status:${reset} ${dbStatusStr}  │  ${bold}Total Reconciled Volume:${reset} ${green}₹${stats.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}${reset}  │  ${bold}Sync Time:${reset} ${yellow}${stats.lastUpdated}${reset}`;
  const statsFill = 86 + (statsLine.includes('\x1b') ? 18 : 0);
  console.log(`${cyan}│${reset}${statsLine.padEnd(statsFill)}${cyan}│${reset}`);
  
  // 4. KEYBOARD CONTROLS
  console.log(`${cyan}└──────────────────────────────────────────────────────────────────────────────────────┘${reset}`);
  console.log(`  ${bold}CONTROLS:${reset} Press ${bold}[↑ / Down]${reset} to Select Bot  │  ${bold}[r]${reset} Instant Refresh  │  ${bold}[q]${reset} Safe Exit Monitor`);
}

async function loop() {
  await updateState();
  render();
}

// Tick loop (every 1 second for live scrolling logs!)
const intervalId = setInterval(loop, 1000);
loop();

// Setup Keyboard interaction
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
  
  if (key.name === 'up') {
    if (selectedIndex > 0) {
      selectedIndex--;
      loop();
    }
  }
  
  if (key.name === 'down') {
    if (selectedIndex < botsList.length - 1) {
      selectedIndex++;
      loop();
    }
  }
  
  if (key.name === 'r') {
    loop();
  }
});
