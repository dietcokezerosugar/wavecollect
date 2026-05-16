"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, Trash2, Search, X, ChevronRight, Info, AlertTriangle, AlertCircle, ShieldCheck, Zap, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
  id: string;
  level: string;
  message: string;
  metadata: string | null;
  timestamp: string;
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 4000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  }

  const filteredLogs = logs.filter(l => {
    const matchesFilter = !filter || l.level === filter;
    const matchesSearch = l.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (l.metadata && l.metadata.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 md:space-y-8 pb-32 font-sans max-w-6xl mx-auto px-4 md:px-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Protocol Ledger</h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Low-level execution telemetry & security auditing</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-950/20">
              <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
              Stream: {autoRefresh ? "Active" : "Paused"}
           </div>
           <button
             onClick={() => setAutoRefresh(!autoRefresh)}
             className="p-3 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 transition-all shadow-sm"
           >
             {autoRefresh ? <X size={16} /> : <RefreshCw size={16} />}
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Filter Protocol</h3>
              <div className="flex flex-col gap-1">
                 {[null, 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL'].map((f) => (
                    <button
                       key={String(f)}
                       onClick={() => setFilter(f)}
                       className={`w-full text-left px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                          filter === f ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-500 hover:bg-slate-50"
                       }`}
                    >
                       {f || 'Full Stream'}
                    </button>
                 ))}
              </div>
           </div>

           <div className="bg-blue-600 rounded-lg p-6 text-white space-y-4 shadow-xl shadow-blue-600/20">
              <ShieldCheck className="w-8 h-8 opacity-50" />
              <h4 className="text-sm font-black uppercase tracking-tight">Audit Integrity</h4>
              <p className="text-[11px] font-medium text-blue-100 leading-relaxed">
                 All events in this ledger are cryptographically linked to the core execution engine. Revocation of API keys will be logged here instantly.
              </p>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                 type="text"
                 placeholder="Search by Order ID, IP, or Metadata..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-md text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
              />
           </div>

           <div className="bg-slate-950 rounded-lg border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
              <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono">protocol.v1.ledger</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Real-time</span>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                 <AnimatePresence mode="popLayout">
                    {filteredLogs.length === 0 ? (
                       <div className="h-64 flex flex-col items-center justify-center opacity-20 space-y-4">
                          <Zap className="w-8 h-8 text-white animate-pulse" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-center">Engine is idle. Awaiting transactions...</p>
                       </div>
                    ) : (
                       filteredLogs.map((log) => (
                          <motion.div 
                             key={log.id}
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             className="group border-b border-white/5 pb-4 last:border-0"
                          >
                             <div className="flex items-start gap-4">
                                <div className="text-[10px] font-mono font-black text-slate-700 w-20 shrink-0 pt-0.5">
                                   {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shrink-0 border ${
                                   log.level === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                   log.level === 'CRITICAL' ? 'bg-rose-500 text-white border-rose-500' :
                                   log.level === 'ERROR' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                   log.level === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                   'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                   {log.level}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-[13px] font-bold text-slate-200 leading-snug group-hover:text-white transition-colors">
                                      {log.message}
                                   </p>
                                   {log.metadata && (
                                      <div className="mt-3 p-4 bg-black/40 rounded-md border border-white/5 font-mono text-[10px] text-slate-500 overflow-x-auto">
                                         {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                                      </div>
                                   )}
                                </div>
                             </div>
                          </motion.div>
                       ))
                    )}
                 </AnimatePresence>
              </div>

              <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Buffer Status: Nominal</p>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{filteredLogs.length} Events Logged</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
