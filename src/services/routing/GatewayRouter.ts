import { prisma } from "@/lib/prisma";
import { GooglePayAccount } from "@prisma/client";

export class GatewayRouter {
  /**
   * Selects an active GPay account that fits the transaction amount and limits.
   */
  static async selectAccount(merchantId: string, amount: number, forRecharge: boolean = false, customerRiskTier: string = "HIGH") {
    // 1. Fetch active accounts
    const allAccounts = await prisma.googlePayAccount.findMany({
      where: {
        isAdmin: forRecharge,
        merchantId: forRecharge ? undefined : merchantId, // For admin, merchantId doesn't matter
        status: "ACTIVE",
        minTicket: { lte: amount },
        maxTicket: { gte: amount },
        // Enforce cooling period
        OR: [
          { cooldownUntil: null },
          { cooldownUntil: { lte: new Date() } }
        ]
      },
    });

    if (allAccounts.length === 0) return null;

    // 2. Filter by Hard Limits (100 txns OR daily/weekly/monthly limits)
    const validAccounts = allAccounts.filter((acc) => {
      // The 1 Lakh OR 100 txn rule
      if (acc.successfulTxn >= 100) return false;
      
      const dailyOk = acc.dailyLimit === 0 || acc.currentDaily + amount <= acc.dailyLimit;
      const weeklyOk = acc.weeklyLimit === 0 || acc.currentWeekly + amount <= acc.weeklyLimit;
      const monthlyOk = acc.monthlyLimit === 0 || acc.currentMonthly + amount <= acc.monthlyLimit;
      
      return dailyOk && weeklyOk && monthlyOk;
    });

    if (validAccounts.length === 0) return null;

    // 3. Fallback Risk Routing Strategy
    // High Risk users MUST ONLY use High Risk VPAs.
    // Mid Risk users use Mid Risk VPAs, fallback to High.
    // Low Risk users use Low Risk VPAs, fallback to Mid, then High.
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

    // 4. Load Balancing: Round Robin (select one with lowest current daily usage)
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
