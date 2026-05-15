import { prisma } from "@/lib/prisma";
import { GooglePayAccount } from "@prisma/client";

export class GatewayRouter {
  /**
   * Selects an active GPay account that fits the transaction amount and limits.
   * Uses a two-phase approach: prefers accounts with live bot sessions,
   * but falls back to any ACTIVE+APPROVED account to prevent 503_NO_ROUTE
   * when bots are temporarily offline.
   */
  static async selectAccount(merchantId: string, amount: number, forRecharge: boolean = false, customerRiskTier: string = "HIGH") {
    
    // 1. Determine processing mode for the merchant
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return null;

    const isPoolMode = merchant.processingMode === "PLATFORM_POOL";
    const heartbeatThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes stale = dead

    // 2. Build the BASE query (ACTIVE + APPROVED + ticket range + cooldown)
    //    Heartbeat/session are NOT hard requirements — we prefer them but don't block on them.
    const baseWhere: any = {
      status: "ACTIVE",
      reviewStatus: "APPROVED",        // Staff must have approved
      minTicket: { lte: amount },
      maxTicket: { gte: amount },
      OR: [
        { cooldownUntil: null },
        { cooldownUntil: { lte: new Date() } }
      ]
    };

    if (forRecharge) {
      // Recharge: use admin pool accounts
      baseWhere.isAdmin = true;
    } else if (isPoolMode) {
      // Platform Pool: use shared pool accounts (not tied to this merchant)
      baseWhere.accountType = "PLATFORM_POOL";
    } else {
      // Own Account: use only this merchant's accounts
      baseWhere.merchantId = merchantId;
      baseWhere.accountType = "MERCHANT_OWNED";
    }

    const allAccounts = await prisma.googlePayAccount.findMany({
      where: baseWhere,
    });

    if (allAccounts.length === 0) return null;

    // 3. Filter by Hard Limits (100 txns OR daily/weekly/monthly limits)
    const validAccounts = allAccounts.filter((acc) => {
      if (acc.successfulTxn >= 100) return false;
      
      const dailyOk = Number(acc.dailyLimit) === 0 || Number(acc.currentDaily) + amount <= Number(acc.dailyLimit);
      const weeklyOk = Number(acc.weeklyLimit) === 0 || Number(acc.currentWeekly) + amount <= Number(acc.weeklyLimit);
      const monthlyOk = Number(acc.monthlyLimit) === 0 || Number(acc.currentMonthly) + amount <= Number(acc.monthlyLimit);
      
      return dailyOk && weeklyOk && monthlyOk;
    });

    if (validAccounts.length === 0) return null;

    // 3b. Two-Phase Selection: Prefer live-bot accounts, fallback to any valid account
    //     Phase 1: Accounts with sessionStatus=ONLINE + fresh heartbeat
    const liveAccounts = validAccounts.filter(acc =>
      acc.sessionStatus === "ONLINE" &&
      acc.lastHeartbeat &&
      acc.lastHeartbeat >= heartbeatThreshold
    );
    
    //     Use live accounts if available, otherwise use all valid accounts
    const routingPool = liveAccounts.length > 0 ? liveAccounts : validAccounts;

    // 4. Risk-Based Routing
    const getAccountsByTier = (tier: string) => routingPool.filter(a => a.riskTier === tier);
    
    let fallbackUsed = false;
    let poolToUse: GooglePayAccount[] = [];

    if (forRecharge) {
      poolToUse = routingPool;
    } else if (customerRiskTier === "HIGH") {
      poolToUse = getAccountsByTier("HIGH");
    } else if (customerRiskTier === "MID") {
      poolToUse = getAccountsByTier("MID");
      if (poolToUse.length === 0) {
        poolToUse = getAccountsByTier("HIGH");
        fallbackUsed = true;
      }
    } else if (customerRiskTier === "LOW") {
      poolToUse = getAccountsByTier("LOW");
      if (poolToUse.length === 0) {
        poolToUse = getAccountsByTier("MID");
        fallbackUsed = true;
      }
      if (poolToUse.length === 0) {
        poolToUse = getAccountsByTier("HIGH");
        fallbackUsed = true;
      }
    }

    // 4b. Risk tier fallback: if no accounts match the risk tier, use all available
    if (poolToUse.length === 0) {
      poolToUse = routingPool;
      fallbackUsed = true;
    }

    if (poolToUse.length === 0) return null;

    // 5. Load Balancing: Round Robin (select one with lowest current daily usage)
    poolToUse.sort((a, b) => Number(a.currentDaily) - Number(b.currentDaily));

    return { account: poolToUse[0], fallbackUsed };
  }

  /**
   * Updates account usage after a successful transaction.
   */
  static async recordUsage(accountId: string, amount: number) {
    return await prisma.googlePayAccount.update({
      where: { id: accountId },
      data: {
        currentDaily: { increment: amount },
        currentWeekly: { increment: amount },
        currentMonthly: { increment: amount },
        successfulTxn: { increment: 1 },
      },
    });
  }
}
