import { prisma } from "@/lib/prisma";

export class SettlementEngine {
  /**
   * Process a batch of UNSETTLED transactions and release funds to the merchant's withdrawable balance.
   * In a real T+1 environment, you would filter by `createdAt < 24 hours ago`.
   */
  static async processBatch(hoursThreshold = 24) {
    console.log(`[SettlementEngine] Starting Settlement Batch Process (Threshold: ${hoursThreshold}h)...`);
    
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursThreshold);

    const unsettledRecords = await prisma.settlement.findMany({
      where: {
        status: "UNSETTLED",
        createdAt: { lte: cutoffDate }
      },
      include: {
        merchant: { include: { agent: true } }
      }
    });

    console.log(`[SettlementEngine] Found ${unsettledRecords.length} UNSETTLED records ready for processing.`);

    let processedCount = 0;
    let totalReleased = 0;

    for (const record of unsettledRecords) {
      await prisma.$transaction(async (tx) => {
        const feeAmount = Number(record.totalAmount) * Number(record.merchant.commissionRate) / 100;
        const netAmount = Number(record.totalAmount) - feeAmount;

        // 1. Update Settlement Status
        await tx.settlement.update({
          where: { id: record.id },
          data: {
            status: "SETTLED",
            releasedAmount: netAmount,
            settledAt: new Date(),
          }
        });

        // 2. Add Net Amount to Merchant's Withdrawable Balance
        const updatedMerchant = await tx.merchant.update({
          where: { id: record.merchantId },
          data: { walletBalance: { increment: netAmount } }
        });

        // 3. Log the Ledger Entry (use FRESH balance from the update result)
        await tx.walletLedger.create({
          data: {
            merchantId: record.merchantId,
            type: "CREDIT",
            amount: netAmount,
            description: `Settlement Release for Txn (Fee: ₹${feeAmount.toFixed(2)})`,
            balanceAfter: Number(updatedMerchant.walletBalance),
            referenceType: "SETTLED",
            referenceId: record.id
          }
        });

        // 4. Handle Agent Commissions (if applicable)
        if (record.merchant.agentId && record.merchant.agent) {
          const agentPayout = Number(record.totalAmount) * (Number(record.merchant.agent.commissionRate) || 0) / 100;
          if (agentPayout > 0) {
            await tx.agent.update({
              where: { id: record.merchant.agentId },
              data: { walletBalance: { increment: agentPayout } }
            });
            await tx.agentCommissionLog.create({
              data: {
                agentId: record.merchant.agentId,
                merchantId: record.merchantId,
                amount: agentPayout,
                description: `Settlement Comm: Merchant ${record.merchant.name}`,
                paymentIntentId: record.id // Using settlement ID as reference
              }
            });
          }
        }

        processedCount++;
        totalReleased += netAmount;
      });
    }

    console.log(`[SettlementEngine] Batch Complete. Processed: ${processedCount}, Total Released: ₹${totalReleased.toFixed(2)}`);
    return { processedCount, totalReleased };
  }

  /**
   * Admin function to manually release a HELD settlement.
   */
  static async releaseHold(settlementId: string) {
    return await prisma.$transaction(async (tx) => {
      const record = await tx.settlement.findUnique({
        where: { id: settlementId },
        include: { merchant: true }
      });

      if (!record || record.status !== "HELD") {
        throw new Error("Settlement is not in HELD status.");
      }

      // Move from HELD directly to UNSETTLED so the next batch picks it up, 
      // or we can settle it immediately. We'll settle immediately.
      const feeAmount = Number(record.totalAmount) * Number(record.merchant.commissionRate) / 100;
      const netAmount = Number(record.totalAmount) - feeAmount;

      await tx.settlement.update({
        where: { id: record.id },
        data: {
          status: "SETTLED",
          holdAmount: 0,
          releasedAmount: netAmount,
          settledAt: new Date(),
        }
      });

      const updatedMerchant = await tx.merchant.update({
        where: { id: record.merchantId },
        data: { walletBalance: { increment: netAmount } }
      });

      await tx.walletLedger.create({
        data: {
          merchantId: record.merchantId,
          type: "CREDIT",
          amount: netAmount,
          description: `Manual Hold Release for Txn (Fee: ₹${feeAmount.toFixed(2)})`,
          balanceAfter: Number(updatedMerchant.walletBalance),
          referenceType: "SETTLED",
          referenceId: record.id
        }
      });

      return netAmount;
    });
  }
}
