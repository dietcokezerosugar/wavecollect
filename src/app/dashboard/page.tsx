import { prisma } from "@/lib/prisma";
import { History, Link as LinkIcon, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const merchantId = "local-dev";

  const [totalIntents, successfulIntents, volumeAgg, activeKey, recentIntents] = await prisma.$transaction([
    prisma.paymentIntent.count({ where: { merchantId } }),
    prisma.paymentIntent.count({ where: { merchantId, status: "SUCCESS" } }),
    prisma.paymentIntent.aggregate({
      where: { merchantId, status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.apiKey.findFirst({ where: { merchantId, isBlocked: false } }),
    prisma.paymentIntent.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { transaction: true },
    }),
  ]);

  const totalVolume = volumeAgg._sum.amount || 0;

  const cards = [
    { label: "Total Volume", value: `₹${totalVolume.toLocaleString()}`, icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Success Rate", value: totalIntents > 0 ? `${((successfulIntents / totalIntents) * 100).toFixed(1)}%` : "—", icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Intents", value: totalIntents.toString(), icon: History, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Monthly Used", value: activeKey ? `₹${activeKey.usedAmount.toLocaleString()}` : "₹0", icon: LinkIcon, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  function statusBadge(status: string) {
    switch (status) {
      case "SUCCESS": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "FAILED": return "bg-red-100 text-red-700";
      case "EXPIRED": return "bg-gray-100 text-gray-500";
      default: return "bg-gray-100 text-gray-500";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome back, Wave Collect Dev.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {cards.map((card) => (
          <div key={card.label} className="apple-card p-4 md:p-6 flex flex-col gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 ${card.bg} rounded-xl md:rounded-2xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <p className="text-xl md:text-3xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold">Recent Intents</h3>
          <Link href="/dashboard/transactions" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid gap-3">
          {recentIntents.length === 0 ? (
            <div className="apple-card p-12 text-center text-muted-foreground italic text-sm">
              No payment intents yet.
            </div>
          ) : (
            recentIntents.map((intent) => (
              <div key={intent.id} className="apple-card p-4 flex items-center justify-between gap-4 active:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    intent.status === "SUCCESS" ? "bg-green-500" : 
                    intent.status === "PENDING" ? "bg-yellow-500" : "bg-gray-300"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-mono truncate">{intent.referenceId}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {intent.createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-900">₹{intent.amount.toLocaleString()}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${statusBadge(intent.status)}`}>
                    {intent.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
