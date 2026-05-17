import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  let merchant: any = null;
  let ledgerEntries: any[] = [];

  try {
    merchant = await prisma.merchant.findUnique({
      //@ts-ignore
      where: { id: session.user.merchantId },
      include: {
        _count: { select: { paymentIntents: true, gpayAccounts: true } }
      }
    });

    if (!merchant) {
      merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId }, include: { agent: true } });
    }

    if (merchant) {
      try {
        ledgerEntries = await prisma.walletLedger.findMany({
          where: { merchantId: merchant.id },
          orderBy: { createdAt: "desc" },
          take: 5
        });
      } catch (ledgerErr) {
        console.warn("Ledger table missing, skipping DB ledger");
      }
    }
  } catch (dbError) {
    console.error("Dashboard DB Critical Error:", dbError);
  }

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700">Merchant Account Not Found</h2>
          <p className="text-slate-500 mt-2">Please contact support to activate your merchant profile.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient 
      initialMerchant={merchant} 
      initialLedgerEntries={ledgerEntries} 
    />
  );
}
