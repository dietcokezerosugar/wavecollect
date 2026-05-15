import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";

export async function GET() {
  try {
    const link = await prisma.paymentLink.findFirst();
    if (!link) return NextResponse.json({ error: "No link" });

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: link.apiKeyId },
    });

    const orderId = `TEST-${Date.now()}`;
    const intent = await PaymentEngine.createIntent({
      amount: Number(link.amount),
      orderId,
      apiKey: apiKey!.key,
    });

    return NextResponse.json({ success: true, intent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}
