import { prisma } from "@/lib/prisma";
import { GooglePayAccount } from "@prisma/client";

export class GatewayRouter {
  /**
   * Selects an active GPay account that fits the transaction amount and limits.
   * Now verifies: reviewStatus, sessionStatus, and bot heartbeat health.
   */
  static async selectAccount(merchantId: string, amount: number, forRecharge: boolean = false, customerRiskTier: string = "HIGH") {
    
    // 1. Determine processing mode for the merchant
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return null;

    const isPoolMode = merchant.processingMode === "PLATFORM_POOL";
    const heartbeatThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes stale = dead

    // 2. Build the query based on processing mode
    const baseWhere: any = {
      status: "ACTIVE",
      reviewStatus: "APPROVED",        // Staff must have approved
      sessionStatus: "ONLINE",          // Session must be alive
      lastHeartbeat: { gte: heartbeatThreshold }, // Bot must have recent heartbeat
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
      
      const dailyOk = acc.dailyLimit === 0 || acc.currentDaily + amount <= acc.dailyLimit;
      const weeklyOk = acc.weeklyLimit === 0 || acc.currentWeekly + amount <= acc.weeklyLimit;
      const monthlyOk = acc.monthlyLimit === 0 || acc.currentMonthly + amount <= acc.monthlyLimit;
      
      return dailyOk && weeklyOk && monthlyOk;
    });

    if (validAccounts.length === 0) return null;

    // 4. Risk-Based Routing
    const getAccountsByTier = (tier: string) => validAccounts.filter(a => a.riskTier === tier);
    
    let fallbackUsed = false;
    let poolToUse: GooglePayAccount[] = [];

    if (forRecharge) {
      poolToUse = validAccounts;
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

    if (poolToUse.length === 0) return null;

    // 5. Load Balancing: Round Robin (select one with lowest current daily usage)
    poolToUse.sort((a, b) => a.currentDaily - b.currentDaily);

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
