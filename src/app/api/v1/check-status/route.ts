import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logApi } from "@/lib/log";
import { validateIpWhitelist } from "@/lib/security";
import { parseSafeJson } from "@/lib/safe-body";

async function getStatus(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: "authentication_failed",
          message: "Missing or invalid API key"
        }
      }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    
    // Get order_id from body or query params
    let order_id: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await parseSafeJson(req, 10 * 1024); // Strict 10KB cap
        order_id = body.order_id;
      } catch (e) {}
    } else {
      order_id = req.nextUrl.searchParams.get("order_id");
    }

    if (!order_id) {
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: "parameter_missing",
          message: "order_id is required.",
          param: "order_id"
        }
      }, { status: 400 });
    }

    // Validate API key
    const keyData = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!keyData) {
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: "api_key_invalid",
          message: "The provided API key is invalid."
        }
      }, { status: 401 });
    }

    // Validate IP Whitelist (Commented out for instant integration)
    /*
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!(await validateIpWhitelist(keyData.merchantId, ip))) {
       return NextResponse.json({ 
         error: {
           type: "invalid_request_error",
           code: "security_error",
           message: `IP Address ${ip} is not authorized for this merchant.`
         }
       }, { status: 403 });
    }
    */

    const intent = await prisma.paymentIntent.findUnique({
      where: { referenceId: order_id },
      include: { transaction: true },
    });

    if (!intent || intent.merchantId !== keyData.merchantId) {
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: "resource_missing",
          message: "No such payment intent exists for this order_id."
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      id: intent.id,
      object: "payment_intent",
      amount: Number(intent.amount),
      currency: "INR",
      status: intent.status,
      order_id: intent.referenceId,
      metadata: (intent as any).metadata || {},
      payer: {
        name: intent.payerName || intent.transaction?.payerName || null,
        upi: intent.payerUpiId || intent.transaction?.payerUpiId || null,
      },
      settlement: {
        utr: intent.transaction?.utr || null,
        txn_id: intent.transaction?.externalId || null,
        timestamp: intent.transaction?.timestamp || null,
      },
      created: Math.floor(intent.createdAt.getTime() / 1000),
      expire_at: intent.expireAt ? Math.floor(intent.expireAt.getTime() / 1000) : null,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: {
        type: "api_error",
        code: "internal_error",
        message: "An unexpected error occurred."
      }
    }, { status: 500 });
  }
}

export { getStatus as GET, getStatus as POST };
