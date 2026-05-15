import React from "react";
import { Zap, Key, Code, CheckCircle2 } from "lucide-react";

export default function QuickStart() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quick Start Guide</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          Get your first UPI payment up and running in less than 5 minutes.
        </p>
      </section>

      <div className="space-y-12">
        <Step 
          number="1"
          title="Get your API Key"
          description="Log in to your Merchant Dashboard, navigate to 'Developers', and generate a new production API Key."
        >
          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Key className="text-blue-600" size={20} />
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Your API Key</span>
            </div>
            <div className="bg-white px-4 py-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-500 flex justify-between items-center">
              wv_live_51P2z...xxxxxxxx
              <button className="text-blue-600 font-black hover:underline uppercase text-[10px]">Copy</button>
            </div>
          </div>
        </Step>

        <Step 
          number="2"
          title="Whitelist your IP"
          description="For security, PayxMint only accepts requests from whitelisted IP addresses. Add your server's public IP in the dashboard."
        >
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium italic">
            <CheckCircle2 size={18} />
            "Requests from un-whitelisted IPs will return a 403 Forbidden error."
          </div>
        </Step>

        <Step 
          number="3"
          title="Trigger an Intent"
          description="Call the create-intent endpoint from your backend. Never call this from the frontend (to keep your API key secret)."
        >
          <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-blue-400 shadow-xl overflow-x-auto">
            <pre>
{`# Using cURL
curl -X POST https://api.payxmint.com/v1/create-intent \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"amount": 10.00, "order_id": "TEST_001"}'`}
            </pre>
          </div>
        </Step>
      </div>

      <section className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] space-y-4">
        <h3 className="text-xl font-black text-blue-900">Next Steps</h3>
        <p className="text-sm text-blue-700 font-medium">
          Once you've made your first test payment, proceed to the **Webhooks** guide to learn how to handle automated payment notifications.
        </p>
      </section>
    </div>
  );
}

function Step({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg shadow-blue-600/20">{number}</div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <p className="text-sm text-slate-600 font-medium leading-relaxed">{description}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}
