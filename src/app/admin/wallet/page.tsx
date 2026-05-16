"use client";

import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Search, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownLeft,
  History,
  ShieldCheck
} from "lucide-react";

export default function AdminWalletManager() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/admin/wallet/ledger");
      const data = await res.json();
      setLedger(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Financial Oversight</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Wallet management & ledger auditing</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-md">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Platform Volume</p>
              <p className="text-xl font-black text-white">₹8,45,200</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger Feed */}
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                   <History className="text-blue-500" size={16} /> Global Ledger History
                </h3>
                <button className="p-2 bg-slate-950 rounded-md text-slate-500 hover:text-white transition-all">
                   <Search size={16} />
                </button>
             </div>
             <div className="divide-y divide-slate-800/50">
                {ledger.map((entry) => (
                  <div key={entry.id} className="p-6 flex items-center justify-between hover:bg-slate-800/20 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${entry.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                           {entry.type === 'CREDIT' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                           <p className="text-sm font-black text-white">{entry.description}</p>
                           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Merchant: {entry.merchant?.name} • MID: {entry.merchantId.slice(-6).toUpperCase()}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={`text-sm font-black ${entry.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {entry.type === 'CREDIT' ? '+' : '-'} ₹{entry.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-600">Balance: ₹{entry.balanceAfter.toLocaleString()}</p>
                     </div>
                  </div>
                ))}
                {loading && <div className="p-12 text-center text-slate-600 font-black uppercase text-xs tracking-widest animate-pulse">Fetching Ledger Data...</div>}
                {!loading && ledger.length === 0 && <div className="p-12 text-center text-slate-600 font-black uppercase text-xs tracking-widest">No ledger entries found</div>}
             </div>
           </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full" />
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                 <ShieldCheck className="text-blue-500" /> Quick Recharge
              </h3>
              <form className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Select Merchant</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-md px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all">
                       <option>Choose Merchant...</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Amount (INR)</label>
                    <input type="number" placeholder="50000" className="w-full bg-slate-950 border border-slate-800 rounded-md px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all" />
                 </div>
                 <button className="w-full py-4 bg-emerald-600 text-white rounded-md font-black text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all mt-4">
                    Approve & Credit Wallet
                 </button>
              </form>
           </div>

           <div className="bg-blue-600/5 rounded-lg border border-blue-500/20 p-6">
              <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">Security Note</h4>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                 All wallet operations are atomic. Every credit/debit creates an immutable ledger entry. Once approved, funds are instantly available to the merchant for processing.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
