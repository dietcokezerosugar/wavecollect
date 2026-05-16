"use client";

import React, { useState, useEffect } from "react";
import { Download, CheckCircle2, Clock, XCircle, AlertTriangle, Search, X } from "lucide-react";
import { exportToCSV } from "@/lib/csv";
import { MobileTransactionsList } from "@/components/mobile/MobileTransactionsList";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [approvalModal, setApprovalModal] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState("SUCCESS");
  const [approvalUtr, setApprovalUtr] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/dashboard/transactions");
      const data = await res.json();
      setTransactions(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!approvalModal) return;
    setSubmitting(true);
    try {
      await fetch("/api/dashboard/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approvalModal.id,
          status: approvalStatus,
          utr: approvalUtr || undefined,
          note: approvalNote || undefined,
        }),
      });
      setApprovalModal(null);
      setApprovalUtr("");
      setApprovalNote("");
      fetchTransactions();
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      t.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transaction?.utr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.payerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleExport = () => {
    const dataToExport = filtered.map(t => ({
      Reference: t.referenceId,
      Amount: t.amount,
      Status: t.status,
      Payer: t.payerName || t.transaction?.payerName,
      UTR: t.transaction?.utr,
      Date: new Date(t.createdAt).toLocaleString()
    }));
    exportToCSV(`PayxMint_Activity_${new Date().toISOString().slice(0,10)}.csv`, dataToExport);
  };

  function statusIcon(status: string) {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "EXPIRED":
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
      default:
        return <XCircle className="w-4 h-4 text-rose-500" />;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "SUCCESS": return "text-emerald-600";
      case "PENDING": return "text-blue-600";
      case "EXPIRED": return "text-slate-400";
      default: return "text-rose-600";
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Activity Ledger</h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Real-time settlement & transaction audit</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shadow-sm">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Network Live</span>
          </div>
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-md text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md shadow-slate-900/10 active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Ledger
          </button>
        </div>
      </div>

      <MobileTransactionsList 
        transactions={filtered}
        onApprove={(intent) => { setApprovalModal(intent); setApprovalStatus("SUCCESS"); }}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Desktop Filters */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Reference, UTR or Name..."
            className="w-full bg-white border border-slate-200 rounded-md py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-6 py-3.5 text-[11px] font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 shadow-sm cursor-pointer"
        >
          <option value="ALL">ALL STATUSES</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-md px-6 py-3.5 shadow-inner">
          <span className="text-sm font-black text-slate-900 leading-none">{filtered.length}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Records</span>
        </div>
      </div>

      {/* Desktop View Table */}
      <div className="hidden md:block bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counterparty</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Network ID (UTR)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Processed At</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                    Synchronizing ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    No matching activity found
                  </td>
                </tr>
              ) : (
                filtered.map((intent) => (
                  <tr key={intent.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                        {statusIcon(intent.status)}
                        <span className={statusColor(intent.status)}>{intent.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-[11px]">{intent.referenceId}</td>
                    <td className="px-6 py-4 font-black text-slate-900 text-sm">₹{intent.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-600">
                      {intent.payerName || intent.transaction?.payerName || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-slate-500 font-mono font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                        {intent.transaction?.utr || intent.transaction?.externalId || "PENDING"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[11px] font-bold whitespace-nowrap">
                      {new Date(intent.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {intent.status === "PENDING" && (
                          <button 
                            onClick={() => { setApprovalModal(intent); setApprovalStatus("SUCCESS"); }}
                            className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-blue-100 shadow-sm"
                          >
                             Approve
                          </button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Approval Modal */}
      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setApprovalModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Manual Audit Settlement</h3>
              <button onClick={() => setApprovalModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 rounded-md p-5 border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Reference</span>
                  <span className="text-[11px] font-black text-slate-900 font-mono">{approvalModal.referenceId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Value</span>
                  <span className="text-sm font-black text-blue-600">₹{approvalModal.amount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Audit Resolution</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setApprovalStatus("SUCCESS")}
                    className={`py-3 rounded-md text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                      approvalStatus === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-500 shadow-md shadow-emerald-500/10"
                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    Set Success
                  </button>
                  <button
                    onClick={() => setApprovalStatus("FAILED")}
                    className={`py-3 rounded-md text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                      approvalStatus === "FAILED"
                        ? "bg-rose-50 text-rose-600 border-rose-500 shadow-md shadow-rose-500/10"
                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    Set Failed
                  </button>
                </div>
              </div>

              {approvalStatus === "SUCCESS" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Network Identifier (UTR)</label>
                  <input
                    type="text"
                    value={approvalUtr}
                    onChange={(e) => setApprovalUtr(e.target.value)}
                    placeholder="Enter 12-digit UTR Number..."
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300"
                  />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight px-1">This ID will be used for final cryptographic settlement.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/30">
              <button onClick={() => setApprovalModal(null)} className="flex-1 py-3 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-slate-600 rounded-md transition-all border border-transparent hover:border-slate-200">
                Cancel
              </button>
              <button
                onClick={handleApproval}
                disabled={submitting || (approvalStatus === "SUCCESS" && !approvalUtr.trim())}
                className={`flex-1 py-3 rounded-md text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalStatus === "SUCCESS" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
              >
                {submitting ? "Settling..." : "Commit Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
