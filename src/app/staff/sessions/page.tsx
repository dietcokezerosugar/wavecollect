"use client";

import { useState, useEffect } from "react";
import { 
  Monitor, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCcw,
  ShieldCheck,
  Building,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function StaffSessionMonitor() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/staff/accounts");
      const json = await res.json();
      if (json.status === "success") {
        // Only show approved accounts in the session monitor
        setAccounts(json.data.filter((a: any) => a.reviewStatus === "APPROVED"));
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
       <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Live Sessions</h1>
          <p className="text-slate-500 font-medium text-sm">Real-time health monitoring of all active browser contexts.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
           <RefreshCcw className="w-3.5 h-3.5 text-slate-400 animate-spin-slow" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {accounts.length === 0 ? (
           <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <Monitor className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Active Sessions</p>
           </div>
         ) : (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account / Merchant</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Status</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Heartbeat</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Vol</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {accounts.map((account) => {
                      const isStale = account.lastHeartbeat && (Date.now() - new Date(account.lastHeartbeat).getTime() > 120000);
                      return (
                        <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-900">{account.name}</span>
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Building className="w-3 h-3" /> {account.merchant?.name}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${
                                   account.sessionStatus === 'ONLINE' && !isStale ? 'bg-emerald-500 animate-pulse' :
                                   account.sessionStatus === 'STARTING' ? 'bg-blue-500 animate-pulse' :
                                   'bg-rose-500'
                                 }`} />
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${
                                   account.sessionStatus === 'ONLINE' && !isStale ? 'text-emerald-600' :
                                   account.sessionStatus === 'STARTING' ? 'text-blue-600' :
                                   'text-rose-600'
                                 }`}>
                                    {isStale ? 'STALE / DISCONNECTED' : account.sessionStatus}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-500">
                                 <Clock className="w-3.5 h-3.5" />
                                 <span className="text-xs font-medium">
                                    {account.lastHeartbeat ? formatDistanceToNow(new Date(account.lastHeartbeat), { addSuffix: true }) : 'Never'}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-slate-700">₹{account.currentDaily.toLocaleString()}</span>
                                 <div className="w-24 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full" 
                                      style={{ width: `${Math.min((account.currentDaily / (account.dailyLimit || 100000)) * 100, 100)}%` }} 
                                    />
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                account.accountType === 'PLATFORM_POOL' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                 {account.accountType.replace('_', ' ')}
                              </span>
                           </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
}
