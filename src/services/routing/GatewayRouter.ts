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
    const heartbeatThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes stale = dead (Resilient for heavy loads)

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
      // Platform Pool: use the specific pool account allocated to this merchant (1:1)
      baseWhere.accountType = "PLATFORM_POOL";
      baseWhere.allocatedToMerchantId = merchantId;
      baseWhere.allocationStatus = "ASSIGNED";
    } else {
      // Own Account: use only this merchant's accounts
      baseWhere.merchantId = merchantId;
      baseWhere.accountType = "MERCHANT_OWNED";
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const allAccounts = await prisma.googlePayAccount.findMany({
      where: baseWhere,
    });

    if (allAccounts.length === 0) return null;

    // 2b. Lazy Daily Reset: if today's date != lastResetDate, reset account on-the-fly
    for (const acc of allAccounts) {
      if (acc.lastResetDate !== todayStr) {
        await prisma.googlePayAccount.update({
          where: { id: acc.id },
          data: {
            currentDaily: 0,
            lastResetDate: todayStr,
            // We keep weekly/monthly as they are reset on their own cycle or manually for now
          }
        });
        // Update local object to reflect the reset for the filtering below
        (acc as any).currentDaily = 0;
        acc.lastResetDate = todayStr;
      }
    }

    // 3. Filter by Hard Limits (100 txns OR daily/weekly/monthly limits + pool quota limit)
    const validAccounts = allAccounts.filter((acc) => {
      if (acc.successfulTxn >= 10000) return false;
      
      const dailyOk = Number(acc.dailyLimit) === 0 || Number(acc.currentDaily) + amount <= Number(acc.dailyLimit);
      const weeklyOk = Number(acc.weeklyLimit) === 0 || Number(acc.currentWeekly) + amount <= Number(acc.weeklyLimit);
      const monthlyOk = Number(acc.monthlyLimit) === 0 || Number(acc.currentMonthly) + amount <= Number(acc.monthlyLimit);
      
      if (!dailyOk || !weeklyOk || !monthlyOk) return false;

      // Optimize platform pool quota check at routing level
      if (acc.accountType === "PLATFORM_POOL" && Number(acc.totalQuota) > 0) {
        const remainingQuota = Number(acc.totalQuota) - Number(acc.usedQuota);
        if (remainingQuota < amount) {
          return false;
        }
      }

      return true;
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

    // 5. Load Balancing: Capacity & Quota Preserving Round Robin
    poolToUse.sort((a, b) => {
      // Phase 1: ONLINE session status priority
      const aOnline = a.sessionStatus === "ONLINE" ? 1 : 0;
      const bOnline = b.sessionStatus === "ONLINE" ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;

      // Phase 2: Platform Pool quota safety — prefer the one with MORE remaining quota
      if (a.accountType === "PLATFORM_POOL" && b.accountType === "PLATFORM_POOL") {
        const aRemaining = Number(a.totalQuota) > 0 ? Number(a.totalQuota) - Number(a.usedQuota) : Infinity;
        const bRemaining = Number(b.totalQuota) > 0 ? Number(b.totalQuota) - Number(b.usedQuota) : Infinity;
        if (Math.abs(aRemaining - bRemaining) > 0.01) {
          return bRemaining - aRemaining; // Descending (more remaining first)
        }
      }

      // Phase 3: Capacity Preserving (tighter limit fit)
      // Prefer the VPA with the smaller maxTicket that fits the transaction, keeping larger limit accounts free.
      const aRange = Number(a.maxTicket) - Number(a.minTicket);
      const bRange = Number(b.maxTicket) - Number(b.minTicket);
      if (Math.abs(aRange - bRange) > 0.01) {
        return aRange - bRange; // Ascending range (tighter fit first)
      }

      // Phase 4: Standard Load Balancing (lowest daily usage first)
      return Number(a.currentDaily) - Number(b.currentDaily);
    });

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
