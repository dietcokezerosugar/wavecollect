import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logApi } from "@/lib/log";
import { validateIpWhitelist } from "@/lib/security";

async function getStatus(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ 
        status: "failure", 
        error: "AUTHENTICATION_FAILED",
        message: "Missing API key" 
      }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    
    // Get order_id from body or query params
    let order_id: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        order_id = body.order_id;
      } catch (e) {}
    } else {
      order_id = req.nextUrl.searchParams.get("order_id");
    }

    if (!order_id) {
      return NextResponse.json({ 
        status: "failure", 
        error: "MISSING_PARAMETER",
        message: "order_id is required." 
      }, { status: 400 });
    }

    // Validate API key
    const keyData = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!keyData) {
      return NextResponse.json({ 
        status: "failure", 
        error: "INVALID_API_KEY",
        message: "The provided API key is invalid." 
      }, { status: 401 });
    }

    // Validate IP Whitelist
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!(await validateIpWhitelist(keyData.merchantId, ip))) {
       return NextResponse.json({ 
         status: "failure", 
         error: "SECURITY_ERROR",
         message: `IP Address ${ip} is not authorized for this merchant.` 
       }, { status: 403 });
    }

    const intent = await prisma.paymentIntent.findUnique({
      where: { referenceId: order_id },
      include: { transaction: true },
    });

    if (!intent || intent.merchantId !== keyData.merchantId) {
      return NextResponse.json({ 
        status: "failure", 
        error: "NOT_FOUND",
        message: "Payment intent not found for this order_id." 
      }, { status: 404 });
    }

    await logApi("INFO", "External API: Check Status", keyData.merchantId, { orderId: order_id, status: intent.status });

    return NextResponse.json({
      status: "success",
      data: {
        order_id: intent.referenceId,
        amount: intent.amount,
        status: intent.status,
        payer: {
          name: intent.payerName || intent.transaction?.payerName || null,
          upi: intent.payerUpiId || intent.transaction?.payerUpiId || null,
        },
        settlement: {
          utr: intent.transaction?.utr || null,
          txn_id: intent.transaction?.externalId || null,
          timestamp: intent.transaction?.timestamp || null,
        },
        meta: {
          created_at: intent.createdAt,
          expire_at: intent.expireAt,
        }
      },
    });
  } catch (error: any) {
    await logApi("ERROR", "External API: Check Status Failure", undefined, { error: error.message });
    return NextResponse.json({ 
      status: "failure", 
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred." 
    }, { status: 500 });
  }
}

export { getStatus as GET, getStatus as POST };
