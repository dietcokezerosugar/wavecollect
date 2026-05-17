import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET: Fetch all Transactions for Admin Oversight
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    const transactions = await prisma.paymentIntent.findMany({
      include: {
        merchant: {
          select: { name: true }
        },
        transaction: true, // Real bank verification data
        allocatedAccount: true
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
      const cleanUtr = utr.trim().toUpperCase();
      
      // Check for existing transaction with this UTR (e.g. from CSV engine)
      let txn = await prisma.transaction.findFirst({
        where: { utr: cleanUtr }
      });

      if (txn) {
        // Link existing
        await prisma.paymentIntent.update({
          where: { id },
          data: { transactionId: txn.id }
        });
      } else {
        // Create manual
        txn = await prisma.transaction.create({
          data: { 
            externalId: `ADMIN-MANUAL-${cleanUtr}-${id}`, 
            utr: cleanUtr, 
            amount: updatedIntent.amount,
            note: note || "Manual Admin Override"
          }
        });

        await prisma.paymentIntent.update({
          where: { id },
          data: { transactionId: txn.id }
        });
      }

      const finalUtr = cleanUtr;

      // SaaS Billing: Deduct fee for manual success
      const fee = (Number(updatedIntent.amount) * (Number(updatedIntent.merchant.commissionRate) || 0)) / 100;
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
        const { WebhookService } = require("@/services/webhook/WebhookService");
        WebhookService.queueEvent(updatedIntent.merchantId, "payment.success", {
          event: "payment.success",
          status: "SUCCESS",
          amount: Number(updatedIntent.amount),
          txn_id: updatedIntent.id,
          reference_id: updatedIntent.referenceId,
          utr: finalUtr,
          timestamp: new Date().toISOString()
        }).catch((err: any) => console.error("[ManualWebhook] Failed:", err.message));
      }
    }

    // 3. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: "SYSTEM_ADMIN",
        action: `MANUAL_OVERRIDE_${status}`,
        metadata: JSON.stringify({ intentId: id, utr, note })
      }
    });

    return NextResponse.json({ status: "success", data: updatedIntent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
