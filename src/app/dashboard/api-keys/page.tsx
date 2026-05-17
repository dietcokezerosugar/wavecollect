"use client";

import { useState, useEffect } from "react";
import { 
  Key, 
  Copy, 
  ShieldAlert, 
  Plus, 
  Check, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Activity,
  Lock,
  RotateCcw,
  AlertCircle
} from "lucide-react";

interface ApiKeyData {
  id: string;
  key: string;
  merchantId: string;
  monthlyLimit: number;
  usedAmount: number;
  isBlocked: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiAccessStatus, setApiAccessStatus] = useState<"NOT_REQUESTED" | "PENDING" | "APPROVED">("NOT_REQUESTED");
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [keysRes, settingsRes] = await Promise.all([
        fetch("/api/keys"),
        fetch("/api/settings")
      ]);
      const keysData = await keysRes.json();
      const settingsData = await settingsRes.json();
      
      setKeys(keysData.data || []);
      if (settingsData.data) {
        setApiAccessStatus(settingsData.data.apiAccessStatus || "NOT_REQUESTED");
      }
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  }

  async function fetchKeys() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.data || []);
  }

  async function generateKey() {
    setLoading(true);
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthly_limit: 100000 }),
    });
    await fetchKeys();
    setLoading(false);
  }

  async function toggleBlock(id: string, currentBlocked: boolean) {
    await fetch("/api/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isBlocked: !currentBlocked }),
    });
    await fetchKeys();
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalUsed = keys.reduce((acc, k) => acc + k.usedAmount, 0);
  const totalLimit = keys.reduce((acc, k) => acc + k.monthlyLimit, 0);

  if (!dataLoaded) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Activity className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-12 pb-32 max-w-6xl mx-auto px-4 md:px-6 animate-in fade-in duration-700">
      
      {apiAccessStatus !== "APPROVED" && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-md flex items-center justify-center border border-amber-205">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">API Access Restricted</h3>
              <p className="text-xs font-bold text-amber-700 mt-1">
                {apiAccessStatus === "PENDING" 
                  ? "Your IP Whitelist request is pending admin approval." 
                  : "You must complete the Security & Whitelist setup before generating API keys."}
              </p>
            </div>
          </div>
          <a href="/dashboard/ip-whitelist" className="px-6 py-3 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-amber-700 transition-colors shadow-sm">
            Go to Security Setup
          </a>
        </div>
      )}

      {/* Header Section */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-slate-200 pb-8 md:pb-12 mt-6 md:mt-0 ${apiAccessStatus !== "APPROVED" ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="space-y-4 text-center md:text-left">
           <div className="inline-flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] bg-blue-50 px-3 py-1.5 rounded-full md:bg-transparent md:px-0 md:py-0 md:rounded-none">
              <Lock className="w-4 h-4" /> Credentials Infrastructure
           </div>
           <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-700 leading-none">API Access Control</h1>
           <p className="text-slate-500 text-sm font-medium max-w-xl leading-relaxed mx-auto md:mx-0">
             Provision high-entropy keys for secure machine-to-machine communication. Manage throttling limits and instant revocation from this control center.
           </p>
        </div>
        <button
          onClick={generateKey}
          disabled={loading || apiAccessStatus !== "APPROVED"}
          className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Provision New Key
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Nodes", value: keys.filter(k => !k.isBlocked).length, icon: Globe, color: "bg-blue-600" },
          { label: "Current Volume", value: `₹${totalUsed.toLocaleString()}`, icon: Activity, color: "bg-blue-500" },
          { label: "Aggregate Capacity", value: `₹${totalLimit.toLocaleString()}`, icon: ShieldCheck, color: "bg-emerald-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-blue-500 transition-all">
             <div className={`w-14 h-14 ${stat.color} rounded-md flex items-center justify-center text-white shadow-lg`}>
                <stat.icon className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-705">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Key Management List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Security Ledger
           </h3>
           <span className="text-[10px] font-bold text-slate-300">v1.2 Secure Protocol</span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Identification</th>
                       <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Status</th>
                       <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity Used</th>
                       <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Security Ops</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {keys.length === 0 ? (
                       <tr>
                         <td colSpan={4} className="px-10 py-20 text-center space-y-4">
                            <Key className="w-12 h-12 text-slate-200 mx-auto" />
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No active keys provisioned</p>
                         </td>
                       </tr>
                    ) : keys.map((key) => (
                       <tr key={key.id} className="group hover:bg-slate-50/50 transition-colors">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${key.isBlocked ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                  <Key className="w-4 h-4" />
                               </div>
                               <div>
                                  <div className="flex items-center gap-3">
                                     <code className="text-[13px] font-black text-slate-700 font-mono tracking-tight">{key.key}</code>
                                     <button 
                                       onClick={() => copyToClipboard(key.key, key.id)}
                                       className="text-slate-300 hover:text-blue-600 transition-colors"
                                     >
                                        {copiedId === key.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                     </button>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Issued {new Date(key.createdAt).toLocaleDateString()}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              key.isBlocked ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            }`}>
                               <div className={`w-1 h-1 rounded-full ${key.isBlocked ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                               {key.isBlocked ? "Revoked" : "Authorized"}
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className="space-y-2">
                               <div className="flex justify-between text-[10px] font-black">
                                  <span className="text-slate-700 uppercase">₹{key.usedAmount.toLocaleString()}</span>
                                  <span className="text-slate-400">/ ₹{key.monthlyLimit.toLocaleString()}</span>
                               </div>
                               <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div 
                                     className={`h-full transition-all duration-1000 ${key.isBlocked ? 'bg-slate-200' : 'bg-blue-600'}`}
                                     style={{ width: `${Math.min((key.usedAmount / key.monthlyLimit) * 100, 100)}%` }}
                                  />
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3">
                               <button 
                                 onClick={() => toggleBlock(key.id, key.isBlocked)}
                                 className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                                    key.isBlocked 
                                       ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700" 
                                       : "bg-white text-rose-500 border border-rose-100 hover:bg-rose-50 hover:border-rose-200 shadow-sm"
                                 }`}
                               >
                                  {key.isBlocked ? "Re-Authorize" : "Revoke"}
                               </button>
                            </div>
                         </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
           {keys.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-10 text-center shadow-sm">
                 <Key className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No active keys</p>
              </div>
           ) : keys.map((key) => (
              <div key={key.id} className="bg-white rounded-[24px] border border-slate-200 p-5 shadow-sm space-y-4">
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-md flex items-center justify-center border shrink-0 ${key.isBlocked ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          <Key className="w-4 h-4" />
                       </div>
                       <div>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-1.5 ${
                             key.isBlocked ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          }`}>
                             <div className={`w-1 h-1 rounded-full ${key.isBlocked ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                             {key.isBlocked ? "Revoked" : "Authorized"}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase block">Issued {new Date(key.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 rounded-md p-3 border border-slate-150 flex items-center justify-between">
                    <code className="text-xs font-black text-slate-700 font-mono tracking-tighter truncate max-w-[200px]">{key.key}</code>
                    <button 
                      onClick={() => copyToClipboard(key.key, key.id)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200 text-slate-450 active:scale-95 transition-transform"
                    >
                       {copiedId === key.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                 </div>

                 <div className="space-y-2 pt-2 border-t border-slate-105">
                    <div className="flex justify-between text-[10px] font-black">
                       <span className="text-slate-700 uppercase">₹{key.usedAmount.toLocaleString()}</span>
                       <span className="text-slate-400">/ ₹{key.monthlyLimit.toLocaleString()} Capacity</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                          className={`h-full transition-all duration-1000 ${key.isBlocked ? 'bg-slate-200' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min((key.usedAmount / key.monthlyLimit) * 100, 100)}%` }}
                       />
                    </div>
                 </div>

                 <button 
                   onClick={() => toggleBlock(key.id, key.isBlocked)}
                   className={`w-full py-3.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all mt-2 ${
                      key.isBlocked 
                         ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 active:scale-95" 
                         : "bg-white text-rose-500 border-2 border-rose-100 active:bg-rose-50"
                   }`}
                 >
                    {key.isBlocked ? "Re-Authorize Key" : "Revoke Access"}
                  </button>
              </div>
           ))}
        </div>
      </div>

      {/* Security Advisory */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-12 text-slate-700 relative overflow-hidden shadow-sm">
         <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
               <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                     <path d="M 10 0 L 0 0 0 10" fill="none" stroke="slate-200" strokeWidth="0.5"/>
                  </pattern>
               </defs>
               <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl space-y-6">
               <div className="bg-amber-50 px-4 py-1.5 rounded-lg inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-amber-100 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Security Protocol v2
               </div>
               <h2 className="text-3xl font-black tracking-tight leading-tight text-slate-700">Key Rotation Advisory</h2>
               <p className="text-slate-500 font-medium leading-relaxed">
                  For maximum security, we recommend rotating your production keys every 90 days. If you suspect a key has been compromised, use the <span className="text-blue-600 font-black">Revoke</span> action immediately to terminate all active sessions.
               </p>
            </div>
            <div className="shrink-0 space-y-4 w-full md:w-auto">
               <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-200/60 flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center text-white">
                     <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rotation Interval</p>
                     <p className="text-lg font-black text-slate-700">90 Days (Rec.)</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
