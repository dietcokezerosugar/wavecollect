import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET: Fetch merchant's own transactions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let merchantId = session?.user?.merchantId;

    // Fallback removed for security

    if (!merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: any = { merchantId };
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }
    if (search) {
      where.OR = [
        { referenceId: { contains: search, mode: 'insensitive' } },
        { payerName: { contains: search, mode: 'insensitive' } },
        { transaction: { utr: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let intents: any[] = [];
    try {
      intents = await prisma.paymentIntent.findMany({
        where,
        include: { transaction: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (e) {
      console.error("PaymentIntent fetch failed:", e);
      intents = [];
    }

    return NextResponse.json({ status: "success", data: intents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Merchant manual approval — mark PENDING → SUCCESS (with UTR) or PENDING → FAILED
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let merchantId = session?.user?.merchantId;

    // Fallback removed for security

    if (!merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return NextResponse.json({ error: "No merchant found" }, { status: 404 });

    const { id, status, utr: rawUtr, note } = await req.json();
    const utr = rawUtr?.trim().toUpperCase();

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    // Verify the intent belongs to this merchant
    const intent = await prisma.paymentIntent.findFirst({
      where: { id, merchantId },
    });

    if (!intent) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Update PaymentIntent status
    const updatedIntent = await prisma.paymentIntent.update({
      where: { id },
      data: { 
        status,
        isManualApproval: true,
        approvalIp: req.headers.get("x-forwarded-for") || req.headers.get("host")
      },
    });

    // If marking SUCCESS, create/link Transaction record
    if (status === "SUCCESS" && utr) {
      // 1. Check if a transaction with this UTR already exists (e.g. from CSV)
      let txn = await prisma.transaction.findFirst({
        where: { utr }
      });

      if (txn) {
        // Link existing txn
        await prisma.paymentIntent.update({
          where: { id },
          data: { transactionId: txn.id }
        });
      } else {
        // 2. Create new transaction with a predictable ID that CSV engine can respect
        // We use MANUAL-{utr} to ensure that if someone uploads a CSV with the same UTR, we don't duplicate
        txn = await prisma.transaction.create({
          data: {
            externalId: `MANUAL-${utr}-${id}`,
            utr,
            amount: updatedIntent.amount,
            note: note || "Merchant Manual Approval",
          }
        });

        await prisma.paymentIntent.update({
          where: { id },
          data: { transactionId: txn.id },
        });
      }
    }

    // ── SaaS: Trigger Notifications ───────────────────────────────
    if (status === "SUCCESS") {
      // 1. Webhook
      if (merchant.webhookUrl) {
        const { WebhookService } = await import("@/services/webhook/WebhookService");
        WebhookService.queueEvent(merchantId, "payment.success", {
          event: "payment.success",
          status: "SUCCESS",
          amount: Number(intent.amount),
          txn_id: `MANUAL-${id}`,
          reference_id: intent.referenceId,
          utr: utr,
          payer_name: "Manual Approval",
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Telegram Alert
      const { TelegramService } = await import("@/services/notifications/TelegramService");
      TelegramService.notifyManualApproval(merchant, Number(intent.amount), intent.referenceId);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: merchant.id,
        action: `MERCHANT_MANUAL_${status}`,
        metadata: JSON.stringify({ intentId: id, utr, note }),
      },
    });

    return NextResponse.json({ status: "success", data: updatedIntent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
