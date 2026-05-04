import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Minimum recharge amount is ₹1" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let merchantId = session?.user?.merchantId;

    if (!merchantId) {
      try {
        const firstMerchant = await prisma.merchant.findFirst({ select: { id: true } });
        merchantId = firstMerchant?.id;
      } catch (e) {
        console.warn("Merchant table missing during recharge init");
      }
    }

    if (!merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const intent = await PaymentEngine.createRechargeIntent(merchantId, amount);

    return NextResponse.json({ 
      success: true, 
      paymentToken: intent.paymentToken 
    });

  } catch (error: any) {
    console.error("[RECHARGE_API_ERR]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
