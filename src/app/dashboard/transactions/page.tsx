import { prisma } from "@/lib/prisma";
import { Download, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function TransactionsPage() {
  const merchantId = "local-dev";
  const intents = await prisma.paymentIntent.findMany({
    where: { merchantId },
    include: { transaction: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  function statusIcon(status: string) {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "EXPIRED":
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "SUCCESS": return "text-green-600";
      case "PENDING": return "text-yellow-600";
      case "EXPIRED": return "text-gray-400";
      default: return "text-red-600";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Monitor and export your payment intents.</p>
        </div>
        <a
          href="/api/export"
          className="px-4 py-2 bg-secondary text-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all border border-gray-200"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {/* Desktop View Table */}
      <div className="hidden md:block apple-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payer</th>
                <th className="px-6 py-4">UTR / ID</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {intents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                    No transactions found yet. Create a payment intent via the API.
                  </td>
                </tr>
              ) : (
                intents.map((intent) => (
                  <tr key={intent.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold">
                        {statusIcon(intent.status)}
                        <span className={statusColor(intent.status)}>{intent.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-900 text-xs">{intent.referenceId}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{intent.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {intent.payerName || intent.transaction?.payerName || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-muted-foreground truncate max-w-[150px] font-mono">
                        {intent.transaction?.utr || intent.transaction?.externalId || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {intent.createdAt.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View Cards */}
      <div className="md:hidden space-y-3">
        {intents.length === 0 ? (
          <div className="apple-card p-12 text-center text-muted-foreground italic text-sm">
            No transactions found yet.
          </div>
        ) : (
          intents.map((intent) => (
            <div key={intent.id} className="apple-card p-4 flex items-center justify-between gap-4 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  intent.status === "SUCCESS" ? "bg-green-50 text-green-600" : 
                  intent.status === "PENDING" ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-400"
                }`}>
                  {statusIcon(intent.status)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{intent.payerName || intent.transaction?.payerName || "Anonymous Payer"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{intent.referenceId}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {intent.createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-gray-900">₹{intent.amount.toLocaleString()}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                   <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                     intent.status === "SUCCESS" ? "bg-green-100 text-green-700" : 
                     intent.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                   }`}>
                    {intent.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
