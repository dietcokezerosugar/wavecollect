"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Edit3,
  X,
  ShieldCheck,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { exportToCSV } from "@/lib/csv";

export default function MasterTransactionLedger() {
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
      const res = await fetch("/api/admin/transactions");
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
      await fetch("/api/admin/transactions", {
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
      t.merchant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleExport = () => {
    const dataToExport = filtered.map(t => ({
      ID: t.id,
      Reference: t.referenceId,
      Merchant: t.merchant?.name,
      Amount: t.amount,
      Status: t.status,
      UTR: t.transaction?.utr,
      Payer: t.payerName || t.transaction?.payerName,
      Date: new Date(t.createdAt).toLocaleString()
    }));
    exportToCSV(`PayxMint_Transactions_${new Date().toISOString().slice(0,10)}.csv`, dataToExport);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Global Transaction Ledger
          </h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">
            Audit-ready platform payment feed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              Live Sync
            </span>
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm flex items-center gap-2"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by UTR, Order ID, or Merchant..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
        >
          <option value="ALL">ALL STATUSES</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="text-xs font-black text-slate-900">{filtered.length}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase">Results</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction / Order</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="p-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-slate-50 border border-slate-200 ${t.status === "SUCCESS" ? "text-emerald-600" : t.status === "PENDING" ? "text-blue-600" : "text-slate-400"}`}>
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">{t.referenceId || "TXN-" + t.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">UTR: {t.transaction?.utr || "NOT_YET_VERIFIED"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 px-6">
                  <p className="text-[12px] font-bold text-slate-700">{t.merchant?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">MID: {t.merchantId?.slice(-8).toUpperCase()}</p>
                </td>
                <td className="p-4 px-6">
                  <p className="text-sm font-black text-slate-900">₹{t.amount?.toLocaleString()}</p>
                </td>
                <td className="p-4 px-6">
                  <StatusBadge status={t.status} />
                </td>
                <td className="p-4 px-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold">{new Date(t.createdAt).toLocaleString()}</span>
                  </div>
                </td>
                <td className="p-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {t.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => { setApprovalModal(t); setApprovalStatus("SUCCESS"); }}
                          className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"
                          title="Approve"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => { setApprovalModal(t); setApprovalStatus("FAILED"); }}
                          className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all shadow-sm"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setApprovalModal(t); setApprovalStatus(t.status); }}
                      className="p-2 bg-white text-blue-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                      title="Override Status"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-16 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse text-[11px]">Syncing Master Ledger...</div>}
        {!loading && filtered.length === 0 && <div className="p-16 text-center font-bold text-slate-400 uppercase tracking-widest text-[11px]">No transactions found</div>}
      </div>

      {/* Approval / Override Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setApprovalModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Manual Status Override</h3>
                  <p className="text-[10px] font-bold text-slate-400">Admin Approval System</p>
                </div>
              </div>
              <button onClick={() => setApprovalModal(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Transaction Info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50 space-y-3 shadow-inner">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</span>
                  <span className="text-xs font-black text-slate-900 font-mono">{approvalModal.referenceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className="text-xs font-black text-slate-900">₹{approvalModal.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</span>
                  <span className="text-xs font-bold text-slate-700">{approvalModal.merchant?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</span>
                  <StatusBadge status={approvalModal.status} />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {["SUCCESS", "FAILED", "EXPIRED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setApprovalStatus(s)}
                      className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                        approvalStatus === s
                          ? s === "SUCCESS" ? "bg-emerald-600 text-white border-emerald-500 shadow-sm" :
                            s === "FAILED" ? "bg-rose-600 text-white border-rose-500 shadow-sm" :
                            "bg-slate-700 text-white border-slate-600 shadow-sm"
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* UTR Input */}
              {approvalStatus === "SUCCESS" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UTR Number</label>
                  <input
                    value={approvalUtr}
                    onChange={(e) => setApprovalUtr(e.target.value)}
                    placeholder="Enter UTR / Transaction Reference"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm transition-all placeholder:text-slate-300"
                  />
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note (Optional)</label>
                <input
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Reason for override..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button onClick={() => setApprovalModal(null)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleApproval}
                disabled={submitting || (approvalStatus === "SUCCESS" && !approvalUtr)}
                className={`px-8 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalStatus === "SUCCESS"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/10"
                    : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/10"
                }`}
              >
                {submitting ? "Processing..." : `Confirm ${approvalStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SUCCESS: "bg-emerald-50 text-emerald-600 border-emerald-100",
    PENDING: "bg-blue-50 text-blue-600 border-blue-100",
    FAILED: "bg-rose-50 text-rose-600 border-rose-100",
    EXPIRED: "bg-slate-50 text-slate-400 border-slate-200",
  };

  return (
    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border inline-block ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}
