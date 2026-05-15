"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Smartphone, 
  CreditCard, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  Clock,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>({
    totalVolume: 0,
    totalTxns: 0,
    successRate: 0,
    activeMerchants: 0,
    activeBots: 0,
    merchantStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.data) {
          setStats(data.data);
        }
      } catch (e) {
        console.error("Stats Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Live update every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Mission Control...</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Mission Control</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
             <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Global System Overview</p>
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-3">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase tracking-widest">LIVE: {new Date().toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-100 transition-all shadow-sm group active:scale-95"
            title="Sign Out"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          label="Total Global Volume" 
          value={`₹${(stats.totalVolume || 0).toLocaleString()}`} 
          sub={`Processed across ${stats.activeMerchants} merchants`} 
          icon={<TrendingUp className="text-emerald-500" />} 
          color="emerald"
        />
        <StatCard 
          label="Verification Success" 
          value={`${stats.successRate}%`} 
          sub={`From ${stats.totalTxns} total intents`} 
          icon={<Zap className="text-blue-500" />} 
          color="blue"
        />
        <StatCard 
          label="Bot Fleet Status" 
          value={stats.activeBots} 
          sub="Operational automation engines" 
          icon={<Smartphone className="text-purple-500" />} 
          color="purple"
        />
      </div>

      {/* Secondary Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Merchant Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-blue-600" /> Top Merchants
            </h3>
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Full List</button>
          </div>
          <div className="space-y-3">
             {stats.merchantStats?.map((m: any) => (
                <MerchantRow key={m.id} name={m.name} volume={`₹${m.volume.toLocaleString()}`} txns={m.txns} status={m.status} />
             ))}
             {stats.merchantStats?.length === 0 && <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No active merchants found</p>}
          </div>
        </div>

        {/* System Health & Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500" /> System Alerts
            </h3>
          </div>
          <div className="space-y-3">
             <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                <ShieldCheck size={32} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All systems operational</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    purple: "bg-indigo-50 border-indigo-100 text-indigo-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-8 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className={`p-2 md:p-2.5 rounded-xl border ${colorMap[color]}`}>
          {React.cloneElement(icon, { className: "w-4 h-4 md:w-5 md:h-5" })}
        </div>
      </div>
      <div>
        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
        <p className="text-[10px] md:text-[11px] font-medium text-slate-500 mt-1 md:mt-2">{sub}</p>
      </div>
    </div>
  );
}

function MerchantRow({ name, volume, txns, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer group shadow-sm active:scale-[0.98]">
       <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-[10px] bg-slate-50 flex items-center justify-center font-black text-slate-600 border border-slate-200 group-hover:bg-white transition-colors shrink-0 text-sm">{name[0]}</div>
          <div className="min-w-0">
            <p className="text-[12px] md:text-[13px] font-bold text-slate-900 leading-tight mb-0.5 truncate">{name}</p>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">{txns} Txns</p>
          </div>
       </div>
       <div className="text-right shrink-0 ml-2">
          <p className="text-xs md:text-sm font-black text-slate-900">{volume}</p>
          <span className="text-[8px] md:text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 md:px-2 py-0.5 rounded-md inline-block mt-1">{status}</span>
       </div>
    </div>
  );
}

function AlertItem({ type, msg, time }: any) {
  const color = type === 'DANGER' ? 'bg-rose-500' : type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
       <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${color}`} />
       <div className="flex-1">
          <p className="text-xs font-semibold text-slate-700 leading-snug">{msg}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{time}</p>
       </div>
    </div>
  );
}
