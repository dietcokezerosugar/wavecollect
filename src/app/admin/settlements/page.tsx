"use client";

import React, { useState, useEffect } from "react";
import { Wallet, ShieldAlert, CheckCircle2, RefreshCcw, Clock, ArrowRight } from "lucide-react";

export default function SettlementsPanel() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/settlements");
      const json = await res.json();
      setSettlements(json.data || []);
      setStats(json.stats || []);
    } finally {
      setLoading(false);
    }
  };

  const processBatch = async () => {
    setProcessing(true);
    try {
      await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PROCESS_BATCH" })
      });
      fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const releaseHold = async (id: string) => {
    await fetch("/api/admin/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "RELEASE_HOLD", settlementId: id })
    });
    fetchData();
  };

  const getStat = (status: string) => {
    const s = stats.find((x: any) => x.status === status);
    return { amount: s?._sum?.totalAmount || 0, count: s?._count?.id || 0 };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Wallet className="text-blue-600" size={32} /> Settlement Custody
          </h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Manage Unsettled Funds & Risk Holds</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={processBatch}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {processing ? <RefreshCcw size={16} className="animate-spin" /> : <Clock size={16} />}
            Process T+1 Batch
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-lg p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[40px] -mr-10 -mt-10" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock size={20} /> <h3 className="text-xs font-black uppercase tracking-widest">Unsettled (T+1)</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-white">₹{getStat("UNSETTLED").amount.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{getStat("UNSETTLED").count} Pending Records</p>
            </div>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert size={20} /> <h3 className="text-xs font-black uppercase tracking-widest">Risk Holds</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-rose-700">₹{getStat("HELD").amount.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{getStat("HELD").count} Frozen Records</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={20} /> <h3 className="text-xs font-black uppercase tracking-widest">Released</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-emerald-700">₹{getStat("SETTLED").amount.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">{getStat("SETTLED").count} Cleared Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Merchant</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {settlements.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-all">
                <td className="p-4 px-6">
                  <p className="text-xs font-bold text-slate-900">{s.merchant.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">{new Date(s.createdAt).toLocaleString()}</p>
                </td>
                <td className="p-4 px-6">
                  <p className="text-sm font-black text-slate-900">₹{s.totalAmount.toLocaleString()}</p>
                  {s.status === "SETTLED" && <p className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">Net: ₹{s.releasedAmount.toLocaleString()}</p>}
                </td>
                <td className="p-4 px-6">
                  <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest
                    ${s.status === 'UNSETTLED' ? 'bg-amber-100 text-amber-700' : 
                      s.status === 'HELD' ? 'bg-rose-100 text-rose-700' : 
                      'bg-emerald-100 text-emerald-700'}
                  `}>
                    {s.status}
                  </span>
                </td>
                <td className="p-4 px-6 text-right">
                  {s.status === "HELD" && (
                    <button 
                      onClick={() => releaseHold(s.id)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-200 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Release Funds
                    </button>
                  )}
                  {s.status === "SETTLED" && (
                    <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />
                  )}
                  {s.status === "UNSETTLED" && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Awaiting T+1</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
