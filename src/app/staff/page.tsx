"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Monitor, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function StaffOverview() {
  const [stats, setStats] = useState({
    pendingReviews: 0,
    onlineSessions: 0,
    errorSessions: 0,
    totalAccounts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/staff/accounts");
        const json = await res.json();
        if (json.status === "success") {
          const accounts = json.data;
          setStats({
            pendingReviews: accounts.filter((a: any) => a.reviewStatus === "PENDING_REVIEW").length,
            onlineSessions: accounts.filter((a: any) => a.sessionStatus === "ONLINE").length,
            errorSessions: accounts.filter((a: any) => a.sessionStatus === "ERROR" || a.sessionStatus === "EXPIRED").length,
            totalAccounts: accounts.length
          });
        }
      } catch (e) {
        console.error("Failed to fetch staff stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Operations Hub</h1>
        <p className="text-slate-500 font-medium text-sm">Real-time oversight of merchant onboarding and session integrity.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Pending Reviews" 
          value={stats.pendingReviews} 
          icon={ShieldCheck} 
          color="text-amber-600" 
          bg="bg-amber-50" 
          border="border-amber-100"
          href="/staff/accounts"
        />
        <StatCard 
          label="Online Sessions" 
          value={stats.onlineSessions} 
          icon={CheckCircle2} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
          border="border-emerald-100"
          href="/staff/accounts"
        />
        <StatCard 
          label="Critical Errors" 
          value={stats.errorSessions} 
          icon={AlertCircle} 
          color="text-rose-600" 
          bg="bg-rose-50" 
          border="border-rose-100"
          href="/staff/accounts"
        />
        <StatCard 
          label="Total Managed" 
          value={stats.totalAccounts} 
          icon={Monitor} 
          color="text-blue-600" 
          bg="bg-blue-50" 
          border="border-blue-100"
          href="/staff/accounts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Operational Alerts */}
         <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">High Priority Tasks</h3>
               <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-widest">Live Updates</span>
            </div>
            <div className="p-6 space-y-4">
               {stats.pendingReviews > 0 ? (
                 <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                       <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                       <p className="text-sm font-bold text-slate-900">{stats.pendingReviews} Merchants awaiting activation</p>
                       <p className="text-xs text-slate-500">Security credentials submitted. Manual browser handshake required.</p>
                       <Link href="/staff/accounts" className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2 hover:gap-3 transition-all">
                          Start Review Flow <ArrowRight className="w-3.5 h-3.5" />
                       </Link>
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                    <p className="text-sm text-slate-400 font-medium">All clear. No pending reviews.</p>
                 </div>
               )}
            </div>
         </div>

         {/* Maintenance Status */}
         <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
               <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight">VPS Performance</h3>
                  <p className="text-slate-400 text-sm font-medium">Monitoring active browser contexts across all nodes.</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Nodes</p>
                     <p className="text-2xl font-black">1</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Browsers</p>
                     <p className="text-2xl font-black">{stats.onlineSessions}</p>
                  </div>
               </div>
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border, href }: any) {
  return (
    <Link href={href} className={`block p-6 rounded-2xl border ${bg} ${border} hover:shadow-xl hover:shadow-slate-200/50 transition-all group`}>
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={`w-12 h-12 rounded-xl ${bg} ${border} flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
      </div>
    </Link>
  );
}
