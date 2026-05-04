import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Fetch all Transactions for Admin Oversight
 */
export async function GET(req: NextRequest) {
  try {
    const transactions = await prisma.paymentIntent.findMany({
      include: {
        merchant: {
          select: { name: true }
        },
        transaction: true // Real bank verification data
      },
      orderBy: { createdAt: "desc" },
      take: 100 // Optimization: Latest 100
    });

    return NextResponse.json({ status: "success", data: transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Manual Status Update (Admin Override)
 */
export async function POST(req: NextRequest) {
  try {
    const { id, status, utr, note } = await req.json();

    // 1. Update PaymentIntent
    const updatedIntent = await prisma.paymentIntent.update({
      where: { id },
      data: { status },
      include: { merchant: true }
    });

    // 2. If marking SUCCESS, ensure a Transaction record exists and link it
    if (status === "SUCCESS" && utr) {
      const txn = await prisma.transaction.upsert({
        where: { externalId: `MANUAL-${id}` },
        update: { utr, amount: updatedIntent.amount, note: note || "Manual Admin Override" },
        create: { 
          externalId: `MANUAL-${id}`, 
          utr, 
          amount: updatedIntent.amount,
          note: note || "Manual Admin Override"
        }
      });

      // Link back and debit fee
      await prisma.paymentIntent.update({
        where: { id },
        data: { transactionId: txn.id }
      });

      // SaaS Billing: Deduct fee for manual success
      const fee = (updatedIntent.amount * (updatedIntent.merchant.commissionRate || 0)) / 100;
      if (fee > 0) {
        const { WalletService } = require("@/services/wallet/WalletService");
        await WalletService.debit(
          updatedIntent.merchantId,
          fee,
          `Manual Success Fee (Ref: ${updatedIntent.referenceId})`,
          "TRANSACTION",
          updatedIntent.id
        );
      }

      // Notify Merchant via Webhook
      if (updatedIntent.merchant.webhookUrl) {
        const { WebhookService } = require("@/services/notifications/WebhookService");
        WebhookService.dispatch(updatedIntent.merchantId, updatedIntent.merchant.webhookUrl, {
          event: "payment.success",
          status: "SUCCESS",
          amount: updatedIntent.amount,
          txn_id: updatedIntent.id,
          reference_id: updatedIntent.referenceId,
          utr: utr,
          timestamp: new Date().toISOString()
        }).catch((err: any) => console.error("[ManualWebhook] Failed:", err.message));
      }
    }

    // 3. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: "SYSTEM_ADMIN", // In prod, get current user session
        action: `MANUAL_OVERRIDE_${status}`,
        metadata: JSON.stringify({ intentId: id, utr, note })
      }
    });

    return NextResponse.json({ status: "success", data: updatedIntent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
