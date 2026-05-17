"use client";

import { useState, useEffect } from "react";
import { Webhook, CheckCircle2, Save, Activity, Clock, XCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.webhookUrl) setWebhookUrl(d.data.webhookUrl);
      });
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const res = await fetch("/api/dashboard/webhooks");
    const d = await res.json();
    setLogs(d.data || []);
  }

  async function saveWebhook() {
    setLoading(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function testWebhook() {
    if (!webhookUrl) return;
    setTesting(true);
    try {
      const res = await fetch("/api/dashboard/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TEST" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Test packet dispatched securely. Check logs below.");
        fetchLogs();
      } else {
        alert("Webhook delivery failed. Check your endpoint connectivity.");
      }
    } catch (e: any) {
      alert("Error triggering test: " + e.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 font-sans px-2 md:px-0 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-700">Event Dispatch</h1>
        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Configure real-time POST delivery infrastructure</p>
      </div>

      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
              <Webhook className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight leading-none mb-1.5">Destination Endpoint</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">System will dispatch high-integrity event objects to this URI.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Integrity URI</label>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/webhooks/wave"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-mono font-black text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <button
              onClick={saveWebhook}
              disabled={loading}
              className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-md text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Endpoint Synced</> : <><Save className="w-4 h-4" /> {loading ? "Syncing..." : "Commit Endpoint"}</>}
            </button>
            <button
              onClick={testWebhook}
              disabled={!webhookUrl || testing}
              className="w-full md:w-auto px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Dispatch Test Packet
            </button>
          </div>
        </div>
      </div>

      {/* Delivery History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery History (Recent 50)</h3>
          <button onClick={fetchLogs} className="text-blue-600 font-black text-[9px] uppercase tracking-widest hover:underline">Refresh</button>
        </div>
        
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
             <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                   <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                   <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Result</th>
                   <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency / Code</th>
                   <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">No dispatch history recorded</td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 px-6">
                       <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{log.event}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{(() => { try { return JSON.parse(log.payload)?.reference_id || log.id.slice(0, 8); } catch { return log.id.slice(0, 8); } })()}</p>
                    </td>
                    <td className="p-4 px-6">
                       <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                         log.isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                       }`}>
                          {log.isSuccess ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {log.isSuccess ? "Delivered" : "Failed"}
                       </div>
                    </td>
                    <td className="p-4 px-6">
                       <span className="text-[11px] font-mono font-bold text-slate-500">HTTP {log.status || '???' }</span>
                    </td>
                    <td className="p-4 px-6 text-right">
                       <div className="flex items-center justify-end gap-2 text-slate-400">
                          <Clock size={10} />
                          <span className="text-[10px] font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                       </div>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Payload Example */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Packet Schema (POST JSON)</h3>
        <div className="bg-slate-50 rounded-md overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-100/50 px-6 py-3 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-3">
               <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-350" />
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
               </div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">application/json</span>
            </div>
          </div>
          <div className="p-6 md:p-8 overflow-x-auto">
            <pre className="text-[11px] md:text-[13px] text-blue-900 font-mono leading-relaxed">
{`{
  "event": "payment.success",
  "status": "SUCCESS",
  "amount": 499.00,
  "txn_id": "8162837377597833216",
  "reference_id": "ORDER-12345",
  "utr": "050701155108",
  "payer_name": "John Doe",
  "payer_upi": "john@okaxis",
  "timestamp": "2024-05-02T16:30:28.423Z"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
