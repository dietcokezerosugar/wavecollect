import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PaymentEngine } from "@/services/payment-engine/PaymentEngine";
import { Zap } from "lucide-react";
import Image from "next/image";

export default async function PaymentLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const link = await prisma.paymentLink.findUnique({
    where: { slug },
  });

  if (!link || !link.isActive) {
    notFound();
  }

  // Create a payment intent for this link
  const orderId = `PL-${link.slug}-${Date.now().toString(36)}`;

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: link.apiKeyId },
  });

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 font-bold">Configuration error: API key not found.</p>
      </div>
    );
  }

  let intent;
  try {
    intent = await PaymentEngine.createIntent({
      amount: Number(link.amount),
      orderId,
      apiKey: apiKey.key,
    });
  } catch (error: any) {
    console.error("DEBUG: Payment Link Failed:", error.message || error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] px-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 mb-8 border border-rose-100">
           <Zap className="w-10 h-10 fill-current" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Service Unavailable</h1>
        <p className="text-slate-500 max-w-xs leading-relaxed text-sm">
          The merchant is currently unable to accept payments. Please contact support or try again later.
        </p>
        <div className="mt-12 pt-8 border-t border-slate-100 w-full max-w-xs flex items-center justify-between">
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Error Code: 503_NO_ROUTE</span>
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PayxMint</span>
        </div>
      </div>
    );
  }

  // Redirect MUST be outside the try/catch in Next.js
  redirect(`/pay/${intent.paymentToken}`);
}
