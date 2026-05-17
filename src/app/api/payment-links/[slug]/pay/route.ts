import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";
import { cookies } from "next/headers";
import { generateAlphanumericId } from "@/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { firstName, lastName, phone, email, amount } = body;

    // 1. Fetch the PaymentLink
    const link = await prisma.paymentLink.findUnique({
      where: { slug },
    });

    if (!link || !link.isActive) {
      return NextResponse.json(
        { success: false, message: "Payment link not found or inactive." },
        { status: 404 }
      );
    }

    // 2. Validate input fields
    if (!firstName || !lastName || !phone || !email) {
      return NextResponse.json(
        { success: false, message: "All customer billing fields are required." },
        { status: 400 }
      );
    }

    // 3. Resolve Amount: prefilled vs custom user amount
    const finalAmount = Number(link.amount) > 0 ? Number(link.amount) : Number(amount);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Please specify a valid payment amount." },
        { status: 400 }
      );
    }

    // 4. Retrieve API Key associated with the payment link
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: link.apiKeyId },
    });

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Merchant integration API key is missing." },
        { status: 500 }
      );
    }

    // 5. Generate Order ID (Fixed 12-character alphanumeric: upper, lower, numbers only)
    const orderId = generateAlphanumericId(12);

    // 6. Call PaymentEngine to initialize a payment intent
    const intent = await PaymentEngine.createIntent({
      amount: finalAmount,
      orderId,
      customerMobile: phone,
      customerEmail: email,
      apiKey: apiKey.key,
      metadata: {
        payerName: `${firstName} ${lastName}`,
        paymentLinkId: link.id
      }
    });

    if (!intent.paymentToken) {
      return NextResponse.json(
        { success: false, message: "Failed to generate payment token." },
        { status: 500 }
      );
    }

    // 7. Store intent token in cookies for persistence tracking
    const cookieStore = await cookies();
    cookieStore.set(`last_intent_${link.slug}`, intent.paymentToken, {
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      httpOnly: true,
      sameSite: "lax"
    });

    // 8. Return redirect URL to the checkout page
    return NextResponse.json({
      success: true,
      redirectUrl: `/checkout/${intent.paymentToken}`
    });
  } catch (error: any) {
    console.error("API Payment Link Intent Creation Failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create payment session." },
      { status: 500 }
    );
  }
}
