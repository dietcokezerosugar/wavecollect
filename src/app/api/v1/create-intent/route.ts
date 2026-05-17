import { NextRequest, NextResponse } from "next/server";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";
import { logApi } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { IdempotencyService } from "@/services/routing/IdempotencyService";
import { parseSafeJson } from "@/lib/safe-body";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per merchant

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  // --- RATE LIMITING (Per Merchant/API Key) ---
  const authHeader = req.headers.get("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "") || ip;
  
  const currentTime = Date.now();
  
  // Prune expired rate limit entries to prevent memory exhaustion (DoS/OOM) attacks
  if (rateLimitMap.size > 1000) {
    const cutoff = currentTime - RATE_LIMIT_WINDOW_MS;
    for (const [key, data] of rateLimitMap.entries()) {
      if (data.timestamp < cutoff) {
        rateLimitMap.delete(key);
      }
    }
  }

  const rateLimitData = rateLimitMap.get(apiKey) || { count: 0, timestamp: currentTime };

  if (currentTime - rateLimitData.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitData.count = 1;
    rateLimitData.timestamp = currentTime;
  } else {
    rateLimitData.count++;
  }
  rateLimitMap.set(apiKey, rateLimitData);

  if (rateLimitData.count > MAX_REQUESTS_PER_WINDOW) {
    await logApi("WARNING", "Rate Limit Exceeded", undefined, { apiKey: apiKey.substring(0, 8), ip });
    return NextResponse.json({ 
      status: "failure", 
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this merchant. Limit is 60/min." 
    }, { status: 429 });
  }
  // ---------------------------------------------

  try {
    const authHeader = req.headers.get("Authorization");
    const idempotencyKey = req.headers.get("Idempotency-Key");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: "authentication_failed",
          message: "Missing or invalid API key in Authorization header."
        }
      }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    const apiKeyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    
    if (!apiKeyRecord) {
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: "api_key_invalid",
          message: "The provided API key is invalid."
        }
      }, { status: 401 });
    }

    // --- IDEMPOTENCY CHECK ---
    if (idempotencyKey) {
      const cached = await IdempotencyService.getCachedResponse(apiKeyRecord.merchantId, idempotencyKey, "/api/v1/create-intent");
      if (cached) return cached;
    }

    // Parse and validate body safely (protects against huge DoS payloads)
    let body;
    try {
      body = await parseSafeJson(req, 100 * 1024); // Strict 100KB cap (more than enough for transaction metadata)
    } catch (e: any) {
      const isTooLarge = e.message?.includes("PAYLOAD_TOO_LARGE");
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: isTooLarge ? "payload_too_large" : "invalid_json",
          message: e.message || "Request body must be valid JSON."
        }
      }, { status: isTooLarge ? 413 : 400 });
    }

    const { amount, order_id, customer_mobile, customer_email, customer_ip, customer_device_id, redirect_url, metadata } = body;

    // Strict validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ 
        error: {
          type: "invalid_request_error",
          code: "parameter_missing",
          message: "Amount is required and must be a positive number.",
          param: "amount"
        }
      }, { status: 400 });
    }

    const intent = await PaymentEngine.createIntent({
      amount: parseFloat(amount),
      orderId: String(order_id),
      customerMobile: customer_mobile,
      customerEmail: customer_email,
      customerIp: customer_ip,
      customerDeviceId: customer_device_id,
      apiKey,
      redirectUrl: redirect_url,
      ip: ip,
      metadata: metadata || {},
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const responseData = {
      id: intent.id,
      object: "payment_intent",
      amount: intent.amount,
      currency: "INR",
      status: intent.status,
      order_id: intent.referenceId,
      checkout_url: `${appUrl}/pay/${intent.paymentToken}`,
      payment_token: intent.paymentToken,
      upi_link: intent.upiDeepLink,
      qr_data: intent.qrData,
      metadata: (intent as any).metadata,
      created: Math.floor(intent.createdAt.getTime() / 1000),
    };

    // Save to idempotency cache if key was provided
    if (idempotencyKey) {
      await IdempotencyService.saveResponse(apiKeyRecord.merchantId, idempotencyKey, "/api/v1/create-intent", 200, responseData);
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("[CreateIntent] Error:", error.message);
    
    const statusCode = error.message.includes("ROUTING_ERROR") ? 503 : 400;
    const errorResponse = { 
      error: {
        type: statusCode === 503 ? "api_error" : "invalid_request_error",
        code: statusCode === 503 ? "service_unavailable" : "request_failed",
        message: error.message 
      }
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
