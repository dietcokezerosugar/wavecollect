"use client";

import React, { useState, useEffect } from "react";
import { 
  Webhook, 
  RefreshCcw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  ExternalLink,
  History,
  Activity,
  ArrowRight
} from "lucide-react";

export default function WebhookManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/webhooks");
      const data = await res.json();
      setEvents(data.events || []);
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async (eventId: string) => {
    setProcessingId(eventId);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY", eventId })
      });
      if (res.ok) fetchData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetryAll = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY_ALL_FAILED" })
      });
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Webhook className="text-blue-600" size={32} /> Webhook Control
          </h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Merchant Notification Engine</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRetryAll}
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Retry All Failed
          </button>
          <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 transition-all shadow-sm">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Pending & Failed Events */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-blue-600" /> Active Delivery Queue
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase">{events.length} Events</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-900">{event.merchant?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5 truncate max-w-[150px]">{event.url}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-tight border border-blue-100">
                          {event.event}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <StatusBadge status={event.status} />
                            {event.retryCount > 0 && (
                              <span className="text-[9px] font-black text-slate-400 uppercase">Attempt {event.retryCount + 1}</span>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleRetry(event.id)}
                          disabled={processingId === event.id || event.status === "SUCCESS"}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <RefreshCcw size={16} className={processingId === event.id ? "animate-spin" : ""} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Queue is currently empty</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Execution History */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-lg p-8 text-white shadow-xl relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] -mr-10 -mt-10" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History size={14} className="text-blue-400" /> Recent Execution Logs
              </h3>
              
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 bg-white/5 rounded-md border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-black text-white">{log.merchant?.name}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${log.isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        HTTP {log.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Details <ArrowRight size={10} className="inline" /></p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-[10px] text-slate-500 font-bold uppercase text-center py-10">No execution history</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" /> Backoff Strategy
            </h4>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
              Events are retried using exponential backoff: <br/>
              <span className="text-slate-900">1m, 5m, 1h, 6h, 24h</span>. <br/>
              After 5 failures, events are moved to <span className="text-rose-600 font-black italic underline">DEAD_LETTER</span> status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SUCCESS: "bg-emerald-50 text-emerald-600 border-emerald-100",
    FAILED: "bg-amber-50 text-amber-600 border-amber-100",
    PENDING: "bg-blue-50 text-blue-600 border-blue-100",
    DEAD_LETTER: "bg-rose-50 text-rose-600 border-rose-100",
  };
  
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${styles[status] || styles.PENDING}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
