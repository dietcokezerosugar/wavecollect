import React from "react";
import { Terminal, Shield, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function WebhooksDocs() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Webhooks</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          Webhooks are the primary way PayxMint notifies your server about payment events. We send an HTTP POST request to your URL whenever a transaction status changes.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Payload Structure</h2>
        <p className="text-sm text-slate-600">Every webhook contains a JSON payload with the following fields:</p>
        
        <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-white/5">
          <pre className="text-blue-400 font-mono text-sm">
            <code>{`{
  "event": "payment.success",
  "status": "SUCCESS",
  "amount": 500.00,
  "order_id": "ORD-7890",
  "utr": "412345678901",
  "payer_name": "JOHN DOE",
  "timestamp": "2026-05-12T10:35:00Z"
}`}</code>
          </pre>
        </div>
      </section>

      <section className="space-y-8 pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reliability & Retries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 size={24} />
              <h3 className="font-black text-slate-900">Immediate Delivery</h3>
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              We attempt to deliver the webhook the millisecond our bots verify the payment. Most merchants receive confirmation in under 2 seconds.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <Clock size={24} />
              <h3 className="font-black text-slate-900">Exponential Backoff</h3>
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              If your server is down (non-200 response), we retry at 1m, 5m, 1h, 6h, and 24h intervals before marking it as a Dead Letter.
            </p>
          </div>
        </div>
      </section>

      <section className="p-8 bg-slate-100 rounded-[32px] border border-slate-200 space-y-6">
        <div className="flex items-center gap-3 text-slate-900">
          <Shield size={24} className="text-blue-600" />
          <h2 className="text-xl font-black">Security & Verification</h2>
        </div>
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          To ensure webhooks are coming from PayxMint, always verify the <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 text-blue-600">X-Wave-Signature</code> header. This is an HMAC-SHA256 hash of the payload using your Webhook Secret.
        </p>
        
        <div className="space-y-4">
           <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
              <p className="text-blue-400 mb-2">// Node.js Verification</p>
              <code>{`const crypto = require('crypto');
const signature = req.headers['x-wave-signature'];
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
const hash = hmac.update(JSON.stringify(req.body)).digest('hex');

if (hash === signature) { /* Verified */ }`}</code>
           </div>

           <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
              <p className="text-emerald-400 mb-2"># Python Verification</p>
              <code>{`import hmac
import hashlib
import json

signature = request.headers.get('X-Wave-Signature')
hash = hmac.new(WEBHOOK_SECRET.encode(), json.dumps(payload).encode(), hashlib.sha256).hexdigest()

if hmac.compare_digest(hash, signature):
    # Verified`}</code>
           </div>

           <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
              <p className="text-amber-400 mb-2">// PHP Verification</p>
              <code>{`$signature = $_SERVER['HTTP_X_WAVE_SIGNATURE'];
$payload = file_get_contents('php://input');
$hash = hash_hmac('sha256', $payload, $WEBHOOK_SECRET);

if (hash_equals($hash, $signature)) {
    // Verified
}`}</code>
           </div>
        </div>
      </section>
    </div>
  );
}
