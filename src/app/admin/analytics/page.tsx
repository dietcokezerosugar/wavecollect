"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Smartphone,
  CreditCard,
  Clock,
  Zap,
  ShieldCheck,
  AlertCircle,
  Activity,
  Wifi,
  Globe,
  CheckCircle2,
  XCircle,
  Wallet,
  Calendar,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-4">
        <Activity className="text-blue-600 animate-spin" size={48} />
        <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</p>
      </div>
    );
  }

  const { stats, charts, topMerchants, riskDistribution, vpaHealth, settlements } = data;
  const maxVolume = Math.max(...charts.dailyVolume.map((d: any) => d.amount), 1);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Layers className="text-blue-600" size={28} /> Platform Intelligence
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Global SaaS Performance Monitoring</p>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-md border border-slate-200 shadow-sm w-fit">
          <Wifi className="w-4 h-4 text-emerald-500" />
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
            {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Processed Volume"
          value={`₹${(stats.totalVolume || 0).toLocaleString()}`}
          icon={<TrendingUp size={20} />}
          color="emerald"
          subtitle="All-time processed"
        />
        <StatCard
          label="Wallet Float"
          value={`₹${(stats.totalWalletFloat || 0).toLocaleString()}`}
          icon={<Wallet size={20} />}
          color="blue"
          subtitle="Held in merchant wallets"
        />
        <StatCard
          label="Total Merchants"
          value={stats.totalMerchants}
          icon={<Users size={20} />}
          color="purple"
          subtitle="Active SaaS partners"
        />
        <StatCard
          label="Success Count"
          value={stats.totalSuccessfulTxns}
          icon={<CheckCircle2 size={20} />}
          color="amber"
          subtitle="Verified transactions"
        />
      </div>

      {/* Phase 5: Risk & Settlement & VPA Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Settlement Flow */}
        <div className="bg-slate-900 rounded-lg p-6 text-white shadow-lg relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[50px] -mr-10 -mt-10 transition-all group-hover:bg-blue-500/30" />
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="text-blue-400" size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Settlement Custody</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unsettled (T+1)</span>
                  <span className="text-sm font-black text-amber-400">₹{settlements?.UNSETTLED?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Holds</span>
                  <span className="text-sm font-black text-rose-400">₹{settlements?.HELD?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Released</span>
                  <span className="text-sm font-black text-emerald-400">₹{settlements?.SETTLED?.toLocaleString() || 0}</span>
                </div>
              </div>
           </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm group hover:border-slate-300 transition-all">
           <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-slate-600" size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Customer Risk Profile</h3>
           </div>
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(riskDistribution?.LOW / (stats.totalSuccessfulTxns || 1)) * 100}%` }} />
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="text-[10px] font-black uppercase text-emerald-600">Low</p>
                  <p className="text-xs font-black text-slate-900">{riskDistribution?.LOW || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${(riskDistribution?.MID / (stats.totalSuccessfulTxns || 1)) * 100}%` }} />
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="text-[10px] font-black uppercase text-amber-600">Mid</p>
                  <p className="text-xs font-black text-slate-900">{riskDistribution?.MID || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${(riskDistribution?.HIGH / (stats.totalSuccessfulTxns || 1)) * 100}%` }} />
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="text-[10px] font-black uppercase text-rose-600">High</p>
                  <p className="text-xs font-black text-slate-900">{riskDistribution?.HIGH || 0}</p>
                </div>
              </div>
           </div>
        </div>

        {/* VPA Health */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm group hover:border-slate-300 transition-all flex flex-col justify-between">
           <div className="flex items-center gap-2 mb-4">
              <Activity className="text-emerald-500" size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Global VPA Health</h3>
           </div>
           <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Active Accounts</p>
                <p className="text-2xl font-black text-slate-900">{vpaHealth?.activeAccounts || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avg Fleet Score</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-black ${vpaHealth?.averageScore < 70 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {vpaHealth?.averageScore || 100}
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold">/ 100</span>
                </div>
              </div>
           </div>
           <div className="mt-4 pt-4 border-t border-slate-100">
             <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
               Risk Engine dynamically rotates VPAs dropping below 70 health score.
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-12">
               <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Volume Velocity</h3>
                 <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Last 14 Days Activity</p>
               </div>
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-blue-600 rounded-full" />
                   <span className="text-[10px] font-black uppercase text-slate-500">Volume (₹)</span>
                 </div>
               </div>
             </div>

             <div className="h-64 flex items-end justify-between gap-3 group px-4">
               {charts.dailyVolume.map((d: any, i: number) => {
                 const pct = (d.amount / maxVolume) * 100;
                 return (
                   <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-3 group/bar">
                     <div className="w-full relative h-full flex flex-col justify-end">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(pct, 4)}%` }}
                          className={`w-full max-w-[40px] mx-auto rounded-t-xl transition-all relative ${
                            i === charts.dailyVolume.length - 1 ? "bg-blue-600" : "bg-blue-50 group-hover/bar:bg-blue-200"
                          }`}
                        >
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[9px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                              ₹{d.amount.toLocaleString()}
                           </div>
                        </motion.div>
                     </div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">{d.date}</p>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Top Merchants Leaderboard */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className="p-2.5 bg-emerald-50 rounded-md text-emerald-600">
                 <ArrowUpRight size={20} />
               </div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Merchant Growth Leaderboard</h3>
             </div>

             <div className="space-y-4">
               {topMerchants.map((m: any, i: number) => (
                 <div key={m.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-md border border-slate-100 hover:border-blue-200 transition-all group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 shadow-sm">
                        {i + 1}
                     </div>
                     <div>
                       <p className="text-[13px] font-bold text-slate-900 leading-tight">{m.name}</p>
                       <p className="text-[10px] font-bold text-slate-500">{m.email}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Success Txns</p>
                        <p className="text-xs font-black text-slate-900">{m._count.paymentIntents}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Wallet</p>
                        <p className="text-xs font-black text-emerald-600">₹{m.walletBalance.toLocaleString()}</p>
                      </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Action Center & Critical Alerts */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-lg p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/30 blur-[80px] -mr-20 -mt-20" />
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-blue-400" size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Platform Pulse</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-md border border-white/10">
                     <span className="text-[10px] font-black text-white/50 uppercase">Active Bots</span>
                     <span className="text-sm font-black">Online</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-md border border-white/10">
                     <span className="text-[10px] font-black text-white/50 uppercase">Gateway Health</span>
                     <span className="text-xs font-black text-emerald-400">Stable</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-md border border-white/10">
                     <span className="text-[10px] font-black text-white/50 uppercase">Response Time</span>
                     <span className="text-xs font-black">240ms</span>
                  </div>
                </div>
             </div>
           </div>

           {stats.pendingIpRequests > 0 && (
             <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 space-y-4 shadow-sm animate-bounce-subtle">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                   <Globe size={18} />
                 </div>
                 <h4 className="text-[12px] font-black text-amber-900 uppercase tracking-widest">Security Action</h4>
               </div>
               <p className="text-xs text-amber-800 font-bold leading-relaxed">
                 You have <span className="underline">{stats.pendingIpRequests}</span> merchant IP whitelist requests pending review.
               </p>
               <a href="/admin/merchants" className="block w-full py-3 bg-amber-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest text-center hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20">
                 Review All Requests
               </a>
             </div>
           )}

           <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                <button className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-md border border-slate-100 hover:border-blue-200 transition-all group">
                   <span className="text-xs font-black text-slate-700 group-hover:text-blue-600 transition-colors">Export Ledger</span>
                   <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-500" />
                </button>
                <button className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-md border border-slate-100 hover:border-blue-200 transition-all group">
                   <span className="text-xs font-black text-slate-700 group-hover:text-blue-600 transition-colors">Audit Logs</span>
                   <ShieldCheck size={14} className="text-slate-400 group-hover:text-blue-500" />
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, subtitle }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm group hover:border-blue-200 transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-md border ${colorMap[color]}`}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{value}</p>
        <p className="text-[9px] font-bold text-slate-500 uppercase">{subtitle}</p>
      </div>
    </div>
  );
}
