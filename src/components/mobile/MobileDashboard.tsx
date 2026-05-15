"use client";

import React from "react";
import { 
  History, 
  Wallet, 
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Zap,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface MobileDashboardProps {
  merchant: any;
  recentIntents: any[];
  totalVolume: number;
  successfulTxns: number;
}

export function MobileDashboard({ merchant, recentIntents, totalVolume, successfulTxns }: MobileDashboardProps) {
  return (
    <div className="md:hidden space-y-6 pb-24">
      {/* Wallet / Main Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[28px] p-6 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                   <Zap className="w-4 h-4 text-emerald-400 fill-current" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Live Balance</span>
             </div>
             <button className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full backdrop-blur-sm active:bg-white/10 transition-colors">
                <MoreHorizontal className="w-5 h-5 text-white/70" />
             </button>
          </div>
          
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white/50">₹</span>
              <span className="text-5xl font-black tracking-tight">{merchant.walletBalance.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Available for fees & settlement</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
             <Link href="/dashboard/recharge" className="bg-blue-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-600/30 active:scale-95 transition-transform">
                <PlusCircle className="w-4 h-4" /> Add Funds
             </Link>
             <Link href="/dashboard/transactions" className="bg-white/10 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest backdrop-blur-md active:bg-white/20 transition-colors">
                <ArrowUpRight className="w-4 h-4" /> Withdraw
             </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
               <TrendingUp className="w-4 h-4" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Volume</p>
               <p className="text-lg font-black text-slate-900 leading-none mt-1">₹{totalVolume.toLocaleString('en-IN')}</p>
            </div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
               <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Successful</p>
               <p className="text-lg font-black text-slate-900 leading-none mt-1">{successfulTxns} Txns</p>
            </div>
         </div>
      </div>

      {/* Live Activity Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13px] font-black text-slate-900 tracking-tight">Recent Activity</h3>
          <Link href="/dashboard/transactions" className="text-[11px] font-bold text-blue-600">See All</Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {recentIntents.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <History className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No recent transactions</p>
            </div>
          ) : (
            recentIntents.slice(0, 5).map((intent) => (
              <Link key={intent.id} href={`/dashboard/transactions`} className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                    intent.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    intent.status === "DETECTED_UNMATCHED" ? "bg-amber-50 text-amber-600 border-amber-100" :
                    intent.status === "PENDING" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}>
                    {intent.status === "SUCCESS" ? <CheckCircle2 size={18} /> : intent.status === "DETECTED_UNMATCHED" ? <ShieldAlert size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 leading-none">{intent.payerName || "Payment"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1.5">
                      {new Date(intent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[13px] font-black text-slate-900 leading-none">₹{intent.amount.toLocaleString('en-IN')}</p>
                   <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 inline-block ${
                     intent.status === "SUCCESS" ? "text-emerald-600" : 
                     intent.status === "PENDING" ? "text-blue-600" : "text-slate-400"
                   }`}>
                     {intent.status}
                   </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
