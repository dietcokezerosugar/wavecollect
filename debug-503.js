const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("\n=== 503_NO_ROUTE DIAGNOSTIC ===\n");

  // 1. Check Payment Links
  const links = await prisma.paymentLink.findMany({ include: { apiKey: { include: { merchant: true } } } });
  console.log("Payment Links:", links.length);
  for (const l of links) {
    console.log(`  [${l.slug}] amount=${l.amount} active=${l.isActive} merchant=${l.apiKey?.merchant?.name} merchantStatus=${l.apiKey?.merchant?.status}`);
  }

  // 2. Check Merchants
  const merchants = await prisma.merchant.findMany({ select: { id: true, name: true, status: true, processingMode: true } });
  console.log("\nMerchants:", merchants.length);
  for (const m of merchants) {
    console.log(`  [${m.id.slice(0,8)}] name=${m.name} status=${m.status} processingMode=${m.processingMode}`);
  }

  // 3. Check API Keys
  const apiKeys = await prisma.apiKey.findMany({ select: { id: true, merchantId: true, isBlocked: true, usedAmount: true, monthlyLimit: true } });
  console.log("\nAPI Keys:", apiKeys.length);
  for (const k of apiKeys) {
    console.log(`  [${k.id.slice(0,8)}] blocked=${k.isBlocked} used=${k.usedAmount}/${k.monthlyLimit}`);
  }

  // 4. Check GPay Accounts (THE KEY ISSUE)
  const accounts = await prisma.googlePayAccount.findMany({
    select: {
      id: true, name: true, upiId: true, status: true, reviewStatus: true,
      sessionStatus: true, lastHeartbeat: true, riskTier: true, accountType: true,
      minTicket: true, maxTicket: true, dailyLimit: true, currentDaily: true,
      successfulTxn: true, cooldownUntil: true, merchantId: true, isAdmin: true,
    }
  });
  
  console.log("\n=== GPay Accounts (ALL) ===", accounts.length);
  const heartbeatThreshold = new Date(Date.now() - 2 * 60 * 1000);
  
  for (const a of accounts) {
    const heartbeatOk = a.lastHeartbeat && a.lastHeartbeat >= heartbeatThreshold;
    const timeSinceHeartbeat = a.lastHeartbeat ? Math.floor((Date.now() - a.lastHeartbeat.getTime()) / 1000) + 's ago' : 'NEVER';
    
    console.log(`\n  Account: ${a.name} (${a.upiId})`);
    console.log(`    status=${a.status} | reviewStatus=${a.reviewStatus} | sessionStatus=${a.sessionStatus}`);
    console.log(`    riskTier=${a.riskTier} | accountType=${a.accountType} | isAdmin=${a.isAdmin}`);
    console.log(`    heartbeat=${timeSinceHeartbeat} | heartbeatOK=${heartbeatOk}`);
    console.log(`    tickets=${a.minTicket}-${a.maxTicket} | daily=${a.currentDaily}/${a.dailyLimit}`);
    console.log(`    successfulTxn=${a.successfulTxn} | cooldown=${a.cooldownUntil}`);
    
    // Check each filter condition
    const issues = [];
    if (a.status !== 'ACTIVE') issues.push('NOT_ACTIVE');
    if (a.reviewStatus !== 'APPROVED') issues.push('NOT_APPROVED');
    if (a.sessionStatus !== 'ONLINE') issues.push('NOT_ONLINE');
    if (!heartbeatOk) issues.push('HEARTBEAT_STALE');
    if (a.successfulTxn >= 100) issues.push('TXN_LIMIT_100');
    
    if (issues.length > 0) {
      console.log(`    ❌ BLOCKED BY: ${issues.join(', ')}`);
    } else {
      console.log(`    ✅ ELIGIBLE FOR ROUTING`);
    }
  }

  console.log("\n=== DIAGNOSIS ===");
  const eligible = accounts.filter(a => {
    const heartbeatOk = a.lastHeartbeat && a.lastHeartbeat >= heartbeatThreshold;
    return a.status === 'ACTIVE' && a.reviewStatus === 'APPROVED' && a.sessionStatus === 'ONLINE' && heartbeatOk && a.successfulTxn < 100;
  });
  
  if (eligible.length === 0) {
    console.log("❌ NO ELIGIBLE ACCOUNTS — This is why you get 503_NO_ROUTE!");
    
    const activeCount = accounts.filter(a => a.status === 'ACTIVE').length;
    const approvedCount = accounts.filter(a => a.reviewStatus === 'APPROVED').length;
    const onlineCount = accounts.filter(a => a.sessionStatus === 'ONLINE').length;
    const heartbeatCount = accounts.filter(a => a.lastHeartbeat && a.lastHeartbeat >= heartbeatThreshold).length;
    
    console.log(`  Active: ${activeCount}/${accounts.length}`);
    console.log(`  Approved: ${approvedCount}/${accounts.length}`);
    console.log(`  Online: ${onlineCount}/${accounts.length}`);
    console.log(`  Heartbeat OK: ${heartbeatCount}/${accounts.length}`);
  } else {
    console.log(`✅ ${eligible.length} accounts eligible for routing`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
