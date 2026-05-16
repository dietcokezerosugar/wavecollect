"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  X,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminStaffHub() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalModal, setApprovalModal] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState("SUCCESS");
  const [approvalUtr, setApprovalUtr] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchInitialData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [txRes, statRes] = await Promise.all([
        fetch("/api/admin/transactions"),
        fetch("/api/admin/analytics")
      ]);
      const txData = await txRes.json();
      const statData = await statRes.json();
      setTransactions(txData.data || []);
      setStats(statData.data?.stats || null);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualOverride = async () => {
    if (!approvalModal) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approvalModal.id,
          status: approvalStatus,
          utr: approvalUtr || undefined,
          note: approvalNote || "Manual Staff Intervention"
        }),
      });
      
      if (res.ok) {
        setApprovalModal(null);
        setApprovalUtr("");
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || "Override failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = transactions.filter(t => 
    t.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.transaction?.utr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.merchant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Staff Intervention Hub</h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Manual Collection & UTR Management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black border border-blue-100 flex items-center gap-2">
            <TrendingUp size={12} /> Live Collection: ₹{stats?.totalVolume?.toLocaleString() || "0"}
          </div>
        </div>
      </div>

      {/* KPI Cards for Staff */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
            <p className="text-xl font-black text-slate-900">₹{stats?.totalVolume?.toLocaleString() || "0"}</p>
         </div>
         <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified Orders</p>
            <p className="text-xl font-black text-emerald-600">{stats?.totalSuccessfulTxns || "0"}</p>
         </div>
         <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Float</p>
            <p className="text-xl font-black text-blue-600">₹{stats?.totalWalletFloat?.toLocaleString() || "0"}</p>
         </div>
         <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Sync</p>
            <p className="text-xl font-black text-amber-600">{transactions.filter(t => t.status === 'PENDING').length}</p>
         </div>
      </div>

      {/* Search & Actions */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by UTR, Order ID, or Merchant Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-md py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm"
        />
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction / Order</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse h-16 border-b border-slate-50"><td colSpan={5} className="px-6"><div className="w-full h-8 bg-slate-50 rounded-lg"></div></td></tr>)
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="p-4 px-6">
                  <div>
                    <p className="text-[13px] font-black text-slate-900 leading-tight mb-0.5">{t.referenceId || "TXN-" + t.id.slice(-6).toUpperCase()}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">UTR: {t.transaction?.utr || "Missing"}</span>
                       {t.transaction?.utr && <CheckCircle2 size={10} className="text-emerald-500" />}
                    </div>
                  </div>
                </td>
                <td className="p-4 px-6">
                   <p className="text-[12px] font-black text-slate-700">{t.merchant?.name}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(t.createdAt).toLocaleString()}</p>
                </td>
                <td className="p-4 px-6">
                   <p className="text-sm font-black text-slate-900">₹{t.amount.toLocaleString()}</p>
                </td>
                <td className="p-4 px-6">
                   <StatusBadge status={t.status} />
                </td>
                <td className="p-4 px-6 text-right">
                   <button 
                     onClick={() => { setApprovalModal(t); setApprovalStatus(t.status); setApprovalUtr(t.transaction?.utr || ""); }}
                     className="p-2.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                   >
                     <Edit3 size={16} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Override Modal */}
      <AnimatePresence>
        {approvalModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setApprovalModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Staff Status Override</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Manual UTR Entry & Billing</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-md border border-slate-200 shadow-inner space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                      <span>Order Reference</span>
                      <span className="text-slate-900">{approvalModal.referenceId}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                      <span>Amount Collected</span>
                      <span className="text-slate-900">₹{approvalModal.amount.toLocaleString()}</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">New Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['SUCCESS', 'FAILED'].map(s => (
                          <button 
                            key={s} 
                            onClick={() => setApprovalStatus(s)}
                            className={`py-3 rounded-md text-[11px] font-black uppercase tracking-widest transition-all border ${approvalStatus === s ? (s === 'SUCCESS' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-rose-600 text-white border-rose-500 shadow-md') : 'bg-white text-slate-400 border-slate-200'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                   </div>

                   {approvalStatus === 'SUCCESS' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">UTR Number / Transaction ID</label>
                        <div className="relative">
                           <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                           <input 
                             type="text" 
                             placeholder="Enter 12-digit UTR"
                             value={approvalUtr}
                             onChange={(e) => setApprovalUtr(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-md py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                           />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter ml-1">⚠️ Entering a UTR will manually credit the merchant and deduct SaaS fees.</p>
                     </div>
                   )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleManualOverride}
                    disabled={submitting || (approvalStatus === 'SUCCESS' && !approvalUtr)}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-md font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <RefreshCw className="animate-spin" size={16} /> : "Update Status"}
                  </button>
                  <button onClick={() => setApprovalModal(null)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-md font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
  return <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border inline-block ${styles[status] || styles.PENDING}`}>{status}</span>;
}
