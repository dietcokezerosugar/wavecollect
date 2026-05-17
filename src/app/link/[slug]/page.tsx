import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Zap } from "lucide-react";
import PaymentLinkClient from "./PaymentLinkClient";

export const dynamic = "force-dynamic";

export default async function PaymentLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Fetch the Payment Link details
  const link = await prisma.paymentLink.findUnique({
    where: { slug },
  });

  if (!link || !link.isActive) {
    notFound();
  }

  // 2. Check if this customer has already completed a payment on this link recently (via cookie tracking)
  const cookieStore = await cookies();
  const lastToken = cookieStore.get(`last_intent_${link.slug}`)?.value;
  
  if (lastToken) {
    const lastIntent = await prisma.paymentIntent.findUnique({
      where: { paymentToken: lastToken },
      select: { status: true, paymentToken: true }
    });
    
    // If they have already paid, fast-track them to their success screen
    if (lastIntent?.status === "SUCCESS") {
      redirect(`/checkout/${lastIntent.paymentToken}`);
    }
  }

  // 3. Fetch active API Key & Merchant details to display custom brand names
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: link.apiKeyId },
    include: { merchant: true }
  });

  if (!apiKey || apiKey.isBlocked || apiKey.merchant.status !== "ACTIVE") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] px-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 mb-8 border border-rose-100">
           <Zap className="w-10 h-10 fill-current" />
        </div>
        <h1 className="text-2xl font-black text-slate-705 mb-2">Service Unavailable</h1>
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

  // 4. Resolve Store Display Name (Priority: Brand Name -> Business Name -> Account name)
  const merchantName = apiKey.merchant.brandName || apiKey.merchant.businessName || apiKey.merchant.name || "WaveCollect Merchant";

  return (
    <PaymentLinkClient
      slug={link.slug}
      merchantName={merchantName}
      linkTitle={link.title}
      linkDescription={link.description}
      linkAmount={Number(link.amount)}
    />
  );
}
