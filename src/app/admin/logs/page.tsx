"use client";

import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  Shield, 
  Search, 
  RefreshCcw, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Bug,
  Filter
} from "lucide-react";

export default function SystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [logType, setLogType] = useState<"api" | "audit">("api");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?type=${logType}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [logType]);

  const filteredLogs = logs.filter(log => 
    (log.message || log.action || "").toLowerCase().includes(search.toLowerCase()) ||
    (log.metadata || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Terminal className="text-blue-600" size={32} /> System Intelligence
          </h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Audit Trails & Runtime Telemetry</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-md border border-slate-200">
           <button 
             onClick={() => setLogType("api")}
             className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${logType === 'api' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             API Logs
           </button>
           <button 
             onClick={() => setLogType("audit")}
             className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${logType === 'audit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Audit Trail
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search logs, metadata, actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <button onClick={fetchData} className="p-3.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 transition-all shadow-sm">
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg p-6 md:p-10 shadow-2xl border border-white/5 relative overflow-hidden min-h-[600px]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
        
        <div className="space-y-4 font-mono text-[13px]">
          {filteredLogs.map((log) => (
            <div key={log.id} className="group border-b border-white/5 pb-4 last:border-0">
               <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5">
                  <span className="text-slate-500 text-[11px] font-bold">[{new Date(log.timestamp).toISOString()}]</span>
                  {logType === 'api' ? (
                    <LogLevelBadge level={log.level} />
                  ) : (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">{log.action}</span>
                  )}
                  <span className="text-slate-300 font-bold">{log.message || log.userId}</span>
               </div>
               {log.metadata && (
                 <pre className="text-[11px] text-slate-500 bg-white/5 p-3 rounded-md overflow-x-auto custom-scrollbar group-hover:bg-white/[0.08] transition-colors">
                   {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                 </pre>
               )}
            </div>
          ))}
          
          {filteredLogs.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-40 text-slate-500">
               <Bug size={48} className="mb-4 opacity-20" />
               <p className="text-[11px] font-black uppercase tracking-widest">No matching telemetry found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogLevelBadge({ level }: { level: string }) {
  const styles: any = {
    INFO: "text-blue-400 bg-blue-400/10",
    SUCCESS: "text-emerald-400 bg-emerald-400/10",
    WARNING: "text-amber-400 bg-amber-400/10",
    ERROR: "text-rose-400 bg-rose-400/10",
    CRITICAL: "text-white bg-rose-600",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${styles[level] || styles.INFO}`}>
      {level}
    </span>
  );
}
