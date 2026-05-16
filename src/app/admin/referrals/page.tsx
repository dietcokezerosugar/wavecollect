"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  TrendingUp,
  Gift,
  Copy,
  Mail,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Wallet,
  Activity,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminReferralHub() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Agent Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [rate, setRate] = useState("10"); // Default 10% of merchant fee
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/referrals");
      const data = await res.json();
      setAgents(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, referralCode: code, commissionRate: rate }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setName(""); setEmail(""); setCode(""); setRate("10");
        fetchAgents();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Referral Intelligence</h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Manage platform agents & commission network</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-4 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10"
        >
          <UserPlus size={18} /> Provision Agent
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Agents</p>
            <p className="text-2xl font-black text-slate-900">{agents.length}</p>
         </div>
         <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Referred Merchants</p>
            <p className="text-2xl font-black text-blue-600">{agents.reduce((s, a) => s + (a._count?.merchants || 0), 0)}</p>
         </div>
         <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agent Payouts (Total)</p>
            <p className="text-2xl font-black text-emerald-600">₹{agents.reduce((s, a) => s + (a.walletBalance || 0), 0).toLocaleString()}</p>
         </div>
         <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Network Health</p>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-xs font-black text-emerald-600 uppercase">Stable</span>
            </div>
         </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm group hover:border-blue-300 transition-all">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center text-slate-900 font-black border border-slate-200 text-lg shadow-sm">
                     {agent.name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{agent.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{agent.email}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agent Fee</p>
                  <p className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{agent.commissionRate}% <span className="text-[9px] text-blue-400">of M-Fee</span></p>
               </div>
             </div>

             <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-md border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Merchants</p>
                   <p className="text-lg font-black text-slate-900">{agent._count?.merchants || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-md border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Code</p>
                   <p className="text-xs font-black text-blue-600 font-mono tracking-tighter">{agent.referralCode}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-md border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Earnings</p>
                   <p className="text-lg font-black text-emerald-600">₹{agent.walletBalance.toLocaleString()}</p>
                </div>
             </div>

             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Payouts</h4>
                {agent.commissionLogs?.length === 0 ? (
                  <p className="text-[10px] italic text-slate-300 px-1">No earnings logged yet</p>
                ) : (
                  agent.commissionLogs.slice(0, 3).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-md">
                       <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">{log.description}</span>
                       <span className="text-[10px] font-black text-emerald-600">+₹{log.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
             </div>
          </div>
        ))}
      </div>

      {/* Add Agent Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 p-8 space-y-6">
               <div>
                  <h3 className="text-xl font-black text-slate-900">Provision Agent</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Create referral partner credentials</p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@wave.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Referral Code</label>
                      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="WAVE-PARTNER" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Comm. Rate (% of Fee)</label>
                      <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="10" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" />
                    </div>
                  </div>
               </div>

               <div className="flex gap-3 pt-4">
                  <button onClick={handleAddAgent} disabled={submitting || !name || !email || !code} className="flex-1 py-4 bg-slate-900 text-white rounded-md font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all disabled:opacity-50">
                     {submitting ? "Provisioning..." : "Activate Agent"}
                  </button>
                  <button onClick={() => setShowAddModal(false)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-md font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                     Cancel
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
