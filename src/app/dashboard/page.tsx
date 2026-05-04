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

  const merchantId = session.user.merchantId;

  if (!merchantId) {
    return <div className="p-20 text-center font-black text-slate-500 uppercase tracking-widest">No Merchant Account Linked</div>;
  }

  // SaaS Optimization: Fetch the merchant linked to the current user
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      _count: { select: { paymentIntents: true, gpayAccounts: true } }
    }
  });

  if (!merchant) return <div className="p-20 text-center font-black text-slate-500 uppercase tracking-widest">Merchant Account Not Found</div>;

  // Fetch initial ledger entries for this merchant
  const ledgerEntries = await prisma.walletLedger.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <DashboardClient 
      initialMerchant={merchant} 
      initialLedgerEntries={ledgerEntries} 
    />
  );
}
