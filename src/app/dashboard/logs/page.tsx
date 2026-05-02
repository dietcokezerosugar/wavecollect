"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, Trash2, Search, X, ChevronRight, Info, AlertTriangle, AlertCircle } from "lucide-react";
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
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 3000);
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

  function getLevelIcon(level: string) {
    switch (level) {
      case "INFO": return <Info className="w-4 h-4 text-blue-500" />;
      case "WARN": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "ERROR": return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  }

  function getLevelStyles(level: string) {
    switch (level) {
      case "INFO": return "bg-blue-50 text-blue-600 border-blue-100";
      case "WARN": return "bg-amber-50 text-amber-600 border-amber-100";
      case "ERROR": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  }

  return (
    <div className="space-y-6 pb-20 font-sans max-w-5xl mx-auto px-2 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">System Logs</h1>
          <p className="text-muted-foreground text-xs md:text-base mt-1">Real-time verification engine output.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex-1 md:flex-none px-6 py-3 rounded-2xl md:rounded-full text-xs font-black flex items-center justify-center gap-2 transition-all border-2 ${
              autoRefresh
                ? "bg-primary/5 text-primary border-primary/10 shadow-sm"
                : "bg-slate-50 text-slate-400 border-slate-100"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
            {autoRefresh ? "Live Sync" : "Sync Paused"}
          </button>
          <button
            onClick={fetchLogs}
            className="p-3 bg-white border border-slate-200 rounded-2xl md:rounded-full text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${autoRefresh ? "opacity-30" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-[24px] text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[null, 'INFO', 'WARN', 'ERROR'].map((f) => (
            <button
              key={String(f)}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                filter === f 
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f || 'All Logs'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Feed */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-16 text-center">
            <Terminal className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No logs to display</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log) => (
              <motion.div
                layout
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[24px] md:rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="p-4 md:p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${getLevelStyles(log.level)}`}>
                    {getLevelIcon(log.level)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                         log.level === 'ERROR' ? 'text-rose-500' : 
                         log.level === 'WARN' ? 'text-amber-500' : 
                         'text-blue-500'
                       }`}>
                         {log.level}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400">
                         {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                  
                  <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform mt-1 ${expandedLog === log.id ? "rotate-90" : ""}`} />
                </div>
                
                <AnimatePresence>
                  {expandedLog === log.id && log.metadata && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-50 bg-slate-50/50"
                    >
                      <div className="p-4 md:p-5">
                         <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto">
                            <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap break-all leading-relaxed">
                              {log.metadata}
                            </pre>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={logsEndRef} className="h-4" />
      </div>
    </div>
  );
}
