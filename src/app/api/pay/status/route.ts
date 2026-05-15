import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchingEngine } from "@/services/matching/MatchingEngine";

// Never cache status responses
export const dynamic = "force-dynamic";

/**
 * Payment page status polling endpoint.
 * The hosted payment page polls this to detect when payment is verified.
 * GET /api/pay/status?token=xxx
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ status: "failure", message: "Missing token" }, { status: 400 });
  }

  const intent = await prisma.paymentIntent.findUnique({
    where: { paymentToken: token },
    include: { merchant: true, transaction: true },
  });

  if (!intent) {
    return NextResponse.json({ status: "failure", message: "Invalid token" }, { status: 404 });
  }

  // Check expiry
  if (intent.status === "PENDING" && intent.expireAt && new Date() > intent.expireAt) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({
      status: "success",
      data: { payment_status: "EXPIRED" },
    });
  }

  // Build redirect URL if successful
  let redirectUrl: string | null = null;
  if (intent.status === "SUCCESS") {
    const baseRedirect = intent.redirectUrl || intent.merchant.redirectUrl;
    if (baseRedirect) {
      redirectUrl = MatchingEngine.buildRedirectUrl(baseRedirect, {
        status: "SUCCESS",
        amount: Number(intent.amount),
        txn_id: intent.transaction?.externalId || intent.transactionId || "",
        reference_id: intent.referenceId,
      });
    }
  }

  return NextResponse.json({
    status: "success",
    data: {
      payment_status: intent.status,
      payer_name: intent.payerName || intent.transaction?.payerName || null,
      utr: intent.transaction?.utr || null,
      redirect_url: redirectUrl,
    },
  }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}
