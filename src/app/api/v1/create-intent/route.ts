import { NextRequest, NextResponse } from "next/server";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";
import { logApi } from "@/lib/log";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await logApi("WARNING", "Handshake Denied: Missing Authorization Header", undefined, { ip });
      return NextResponse.json({ 
        status: "failure", 
        error: "AUTHENTICATION_FAILED",
        message: "Missing or invalid API key in Authorization header." 
      }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    
    // Parse and validate body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      await logApi("ERROR", "Protocol Violation: Invalid JSON Payload", undefined, { ip });
      return NextResponse.json({ 
        status: "failure", 
        error: "INVALID_JSON",
        message: "Request body must be valid JSON." 
      }, { status: 400 });
    }

    const { amount, order_id, customer_mobile, customer_email, customer_ip, customer_device_id, redirect_url } = body;

    // Strict validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ 
        status: "failure", 
        error: "INVALID_AMOUNT",
        message: "Amount is required and must be a positive number greater than zero." 
      }, { status: 400 });
    }

    const MAX_TRANSACTION_LIMIT = 1000000; // ₹10,00,000
    if (parseFloat(amount) > MAX_TRANSACTION_LIMIT) {
      return NextResponse.json({ 
        status: "failure", 
        error: "AMOUNT_EXCEEDS_LIMIT",
        message: `Amount cannot exceed ₹${MAX_TRANSACTION_LIMIT.toLocaleString()}.` 
      }, { status: 400 });
    }

    if (!order_id || String(order_id).length < 3) {
      return NextResponse.json({ 
        status: "failure", 
        error: "INVALID_ORDER_ID",
        message: "order_id is required and must be at least 3 characters." 
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
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await logApi("SUCCESS", "Protocol Handshake: Intent Created", intent.merchantId, {
      intentId: intent.id,
      orderId: intent.referenceId,
      amount: intent.amount,
      ip
    });

    return NextResponse.json({
      status: "success",
      data: {
        id: intent.id,
        amount: intent.amount,
        order_id: intent.referenceId,
        status: intent.status,
        checkout_url: `${appUrl}/pay/${intent.paymentToken}`,
        payment_token: intent.paymentToken,
        upi_link: intent.upiDeepLink,
        qr_data: intent.qrData,
        expire_at: intent.expireAt,
      },
    });

  } catch (error: any) {
    await logApi("ERROR", "Protocol Exception: Request Failed", undefined, { 
      error: error.message,
      ip
    });
    
    // Map internal errors to HTTP statuses
    const errorMap: Record<string, number> = {
      "Invalid API Key": 401,
      "Order ID already exists": 409,
      "Insufficient merchant wallet balance": 402,
      "API Key monthly limit reached": 403,
      "ROUTING_ERROR": 503
    };

    let statusCode = 400;
    for (const [key, code] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        statusCode = code;
        break;
      }
    }

    return NextResponse.json({ 
      status: "failure", 
      error: statusCode === 503 ? "SERVICE_UNAVAILABLE" : "REQUEST_FAILED",
      message: error.message 
    }, { status: statusCode });
  }
}
