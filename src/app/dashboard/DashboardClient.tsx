"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Wallet, 
  ArrowDownRight, 
  TrendingUp,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { MobileDashboard } from "@/components/mobile/MobileDashboard";

export default function DashboardClient({ initialMerchant, initialLedgerEntries }: any) {
  const { data: session } = useSession();
  const [merchant, setMerchant] = useState(initialMerchant);
  const [ledgerEntries, setLedgerEntries] = useState(initialLedgerEntries);
  const [recentIntents, setRecentIntents] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);

  const fetchLiveActivity = async () => {
    try {
      const res = await fetch("/api/dashboard/activity");
      const data = await res.json();
      if (data.data) {
        setRecentIntents(data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveActivity();
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(fetchLiveActivity, 5000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const successfulTxns = recentIntents.filter(i => i.status === 'SUCCESS').length;
  const totalVolume = recentIntents.filter(i => i.status === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0);

  const trialEndsAt = merchant.trialEndsAt ? new Date(merchant.trialEndsAt) : null;
  const isTrialActive = trialEndsAt && trialEndsAt > new Date();
  const trialDaysRemaining = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Trial Status Banner */}
      {isTrialActive ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                 <Zap size={20} />
              </div>
              <div>
                 <p className="text-sm font-black text-emerald-900 leading-tight">Free Trial Active</p>
                 <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                    Settlement fees waived for the next {trialDaysRemaining} days
                 </p>
              </div>
           </div>
           <Link href="/docs" className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-white/50 px-4 py-2 rounded-lg hover:bg-white transition-all">
              Learn Integration
           </Link>
        </div>
      ) : trialEndsAt && trialEndsAt < new Date() && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                 <ShieldAlert size={20} />
              </div>
              <div>
                 <p className="text-sm font-black text-amber-900 leading-tight">Trial Period Expired</p>
                 <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                    Please recharge your wallet to continue using the settlement engine
                 </p>
              </div>
           </div>
           <Link href="/dashboard/recharge" className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-white/50 px-4 py-2 rounded-lg hover:bg-white transition-all">
              Recharge Now
           </Link>
        </div>
      )}

      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <LayoutDashboard className="text-blue-600" /> Command Center
          </h1>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest leading-none">Merchant: {merchant.name}</p>
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Live Monitoring</span>
             <div className="h-4 w-[1px] bg-slate-200 mx-2" />
             <button 
               onClick={() => signOut({ callbackUrl: "/" })}
               className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-widest"
             >
               <LogOut size={12} />
               Log Out
             </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsLive(!isLive)}
             className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 shadow-sm ${isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
           >
              {isLive ? <RefreshCw className="animate-spin" size={12} /> : <Clock size={12} />}
              {isLive ? 'Real-time On' : 'Paused'}
           </button>
           <Link href="/dashboard/recharge" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md shadow-blue-600/20 active:scale-95 transition-all">
              + Recharge Wallet
           </Link>
        </div>
      </div>

      {/* Financial Health Grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          label="Wallet Balance" 
          value={`₹${merchant.walletBalance.toLocaleString()}`} 
          sub="Available for fees" 
          icon={<Wallet />} 
          color="emerald" 
        />
        <DashboardCard 
          label="Recent Success" 
          value={`₹${totalVolume.toLocaleString()}`} 
          sub={`${successfulTxns} Verified Today`} 
          icon={<TrendingUp />} 
          color="blue" 
        />
        <DashboardCard 
          label="Gateway Nodes" 
          value={merchant._count.gpayAccounts} 
          sub="Active bot fleet" 
          icon={<Zap />} 
          color="amber" 
        />
        <DashboardCard 
          label="Commission" 
          value={`${merchant.commissionRate}%`} 
          sub="Platform processing fee" 
          icon={<ShieldCheck />} 
          color="purple" 
        />
      </div>

      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-Time Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <History className="text-blue-600" size={14} /> Real-Time Activity
            </h3>
            <Link href="/dashboard/transactions" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
              Full Ledger View
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto divide-y divide-slate-100 shadow-sm min-h-[400px]">
             <div className="min-w-[600px]">
            {recentIntents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                   <Clock size={32} />
                </div>
                <p className="text-slate-400 italic text-[11px] font-bold uppercase tracking-widest">
                  Listening for incoming transactions...
                </p>
              </div>
            ) : (
              recentIntents.map((intent) => (
                <div key={intent.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${
                      intent.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      intent.status === "DETECTED_UNMATCHED" ? "bg-amber-50 text-amber-600 border-amber-100" :
                      intent.status === "PENDING" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}>
                      {intent.status === "SUCCESS" ? <CheckCircle2 size={18} /> : intent.status === "DETECTED_UNMATCHED" ? <ShieldAlert size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">{intent.referenceId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(intent.createdAt).toLocaleTimeString()}
                        </p>
                        {(intent.transaction || intent.utr) && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${intent.status === 'DETECTED_UNMATCHED' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                             UTR: {intent.transaction?.utr || intent.utr || 'DETECTED'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{intent.amount.toLocaleString()}</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border mt-1 inline-block ${
                       intent.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                       intent.status === "DETECTED_UNMATCHED" ? "bg-amber-50 text-amber-600 border-amber-100" :
                       intent.status === "PENDING" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}>
                      {intent.status === "DETECTED_UNMATCHED" ? "ORPHAN DETECTED" : intent.status}
                    </span>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>

        {/* Mini Ledger Widget (Static Sidebar) */}
        <div className="space-y-4">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Wallet Ledger</h3>
           <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="space-y-4">
                 {ledgerEntries.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                       <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg border ${entry.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                             {entry.type === 'CREDIT' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          </div>
                          <div>
                             <p className="text-[11px] font-bold text-slate-900 leading-tight">{entry.description}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <p className={`text-xs font-black ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {entry.type === 'CREDIT' ? '+' : '-'}₹{entry.amount}
                       </p>
                    </div>
                 ))}
                 {ledgerEntries.length === 0 && <p className="text-center text-[10px] font-black text-slate-400 uppercase py-8">No fees recorded</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ label, value, sub, icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    purple: "text-blue-600 bg-blue-50 border-blue-100",
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all group relative overflow-hidden`}>
      <div className="flex flex-col gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${colors[color]}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-tight leading-none">{sub}</p>
        </div>
      </div>
    </div>
  );
}
