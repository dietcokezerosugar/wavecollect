import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logApi } from "@/lib/log";
import { MatchingEngine } from "@/services/matching/MatchingEngine";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseSafeJson } from "@/lib/safe-body";

/**
 * Simulate a transaction detection for testing the entire flow.
 * SECURITY: Gated behind ADMIN authentication. Disabled in production by default.
 * POST /api/v1/simulate-payment
 * Body: { order_id: string }
 */
export async function POST(req: NextRequest) {
  // SECURITY GATE: Only allow in development, or for authenticated ADMIN users
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ 
        status: "failure", 
        message: "Simulate payment is restricted to admin users in production." 
      }, { status: 403 });
    }
  }

  try {
    let body;
    try {
      body = await parseSafeJson(req, 10 * 1024); // Strict 10KB cap
    } catch (e: any) {
      return NextResponse.json({ status: "failure", message: e.message || "Invalid JSON payload" }, { status: 400 });
    }
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ status: "failure", message: "Missing order_id" }, { status: 400 });
    }

    const intent = await prisma.paymentIntent.findUnique({
      where: { referenceId: order_id },
    });

    if (!intent) {
      return NextResponse.json({ status: "failure", message: "Intent not found" }, { status: 404 });
    }

    if (intent.status !== "PENDING") {
      return NextResponse.json({ status: "failure", message: `Intent already ${intent.status}` }, { status: 409 });
    }

    // Simulate a transaction from GPay9
    const fakeTxn = {
      externalId: `SIM-${uuidv4().slice(0, 12)}`,
      utr: `UTR${Date.now()}`,
      amount: Number(intent.amount),
      payerName: "Test Payer",
      payerUpiId: "testpayer@upi",
      note: intent.referenceId,
      timestamp: new Date().toISOString(),
    };

    await logApi("INFO", "ADMIN: Simulating payment detection", intent.merchantId, { orderId: order_id, fakeTxn });
    await MatchingEngine.onTransactionDetected(fakeTxn);

    const updated = await prisma.paymentIntent.findUnique({ where: { referenceId: order_id } });

    return NextResponse.json({
      status: "success",
      message: "Payment simulated and matched",
      data: {
        order_id: updated?.referenceId,
        intent_status: updated?.status,
        simulated_txn: fakeTxn.externalId,
      },
    });
  } catch (error: any) {
    await logApi("ERROR", "Simulate payment failed", undefined, { error: error.message });
    return NextResponse.json({ status: "failure", message: error.message }, { status: 500 });
  }
}
