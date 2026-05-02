"use client";

import { useState, useEffect } from "react";
import { Webhook, CheckCircle2, Save } from "lucide-react";

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.webhookUrl) setWebhookUrl(d.data.webhookUrl);
      });
  }, []);

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
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "payment.test",
          status: "SUCCESS",
          amount: 100,
          txn_id: "TEST-12345",
          reference_id: "test-order-001",
          timestamp: new Date().toISOString(),
        }),
      });
      alert(res.ok ? "Webhook delivered successfully!" : `Webhook returned ${res.status}`);
    } catch (e: any) {
      alert("Webhook test failed: " + e.message);
    }
  }

  return (
    <div className="space-y-8 pb-12 font-sans px-2 md:px-0 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground text-xs md:text-base mt-1">Real-time POST delivery for payment events.</p>
      </div>

      <div className="bg-white rounded-[32px] md:rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
              <Webhook className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Endpoint URL</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Triggered instantly on transaction verification.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Webhook Target</label>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/webhooks/wave"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm md:text-base font-mono focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <button
              onClick={saveWebhook}
              disabled={loading}
              className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {saved ? <><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Endpoint Saved</> : <><Save className="w-5 h-5" /> {loading ? "Updating..." : "Save Webhook"}</>}
            </button>
            <button
              onClick={testWebhook}
              disabled={!webhookUrl}
              className="w-full md:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Deliver Test Event
            </button>
          </div>
        </div>
      </div>

      {/* Payload Example */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">POST Payload Schema</h3>
        <div className="bg-slate-950 rounded-[32px] md:rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono">application/json</span>
            <div className="flex gap-1.5">
               <div className="w-2 h-2 rounded-full bg-slate-700" />
               <div className="w-2 h-2 rounded-full bg-slate-700" />
               <div className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
          </div>
          <div className="p-6 md:p-8 overflow-x-auto">
            <pre className="text-[11px] md:text-sm text-slate-300 font-mono leading-relaxed">
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
