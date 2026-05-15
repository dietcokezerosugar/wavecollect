import React from "react";
import { ArrowRight, Terminal, Shield, Zap, Globe, Cpu } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <section id="overview" className="space-y-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit border border-blue-100">
          <Zap size={14} className="fill-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-widest">Version 2.4 Live</span>
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
          The Next Generation <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">UPI Payment Gateway</span>
        </h1>
        
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          Integrate PayxMint to accept real-time UPI payments with automated verification, risk-based routing, and institutional-grade settlement custody. Built for developers who demand speed, reliability, and security.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 group">
            Start Integration
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            Browse API Reference
          </button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        <FeatureCard 
          icon={<Cpu className="text-blue-600" />}
          title="Smart Verification"
          description="Our headless bot ecosystem scrapes bank transactions in real-time to match UTRs and approve payments in seconds."
        />
        <FeatureCard 
          icon={<Shield className="text-indigo-600" />}
          title="Risk-Based Routing"
          description="Protect your bank pools with intelligent user fingerprinting and graduated routing tiers (High/Mid/Low Risk)."
        />
        <FeatureCard 
          icon={<Globe className="text-emerald-600" />}
          title="Global Settlements"
          description="Automated T+1 settlement custody with fee deduction, agent commission calculation, and risk-hold management."
        />
        <FeatureCard 
          icon={<Terminal className="text-rose-600" />}
          title="Developer First"
          description="Simple REST API, HMAC-signed webhooks, and a Headless SDK for building your own real-time checkout UI."
        />
      </section>

      {/* Integration Workflow */}
      <section id="workflow" className="pt-12 space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">How it works</h2>
          <div className="h-1 w-20 bg-blue-600 rounded-full" />
        </div>

        <div className="space-y-12">
          <Step 
            number="01"
            title="Create a Payment Intent"
            description="Send your order details to our API to receive a unique payment token and a hosted checkout URL."
          >
            <CodeBlock 
              language="bash"
              code={`curl -X POST https://api.payxmint.com/v1/create-intent \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{ "amount": 500, "order_id": "ORDER_123" }'`}
            />
          </Step>

          <Step 
            number="02"
            title="Redirect your Customer"
            description="Redirect the user to the provided hosted URL. We handle the UPI App deep-linking and QR display for you."
          >
            <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200 flex items-center justify-center">
              <div className="w-48 h-64 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col items-center p-4 space-y-4">
                <div className="w-full h-8 bg-slate-50 rounded-lg" />
                <div className="w-32 h-32 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded flex items-center justify-center font-black">QR</div>
                </div>
                <div className="w-full h-10 bg-blue-600 rounded-lg" />
              </div>
            </div>
          </Step>

          <Step 
            number="03"
            title="Receive Webhook"
            description="Once our bots verify the payment via UTR, we fire an HMAC-signed webhook to your server instantly."
          >
             <CodeBlock 
              language="json"
              code={`{
  "event": "payment.success",
  "order_id": "ORDER_123",
  "utr": "412345678901",
  "status": "SUCCESS"
}`}
            />
          </Step>
        </div>
      </section>

      <section id="security" className="pt-12 p-8 bg-blue-900 rounded-[40px] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] -mr-32 -mt-32" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-black tracking-tight">Institutional-Grade Security</h2>
          <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-2xl">
            We encrypt all VPA credentials at rest using AES-256-GCM. Our network is protected by IP whitelisting, HMAC signatures, and real-time anomaly detection.
          </p>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black">99.9%</span>
              <span className="text-[10px] font-black uppercase text-blue-300 tracking-widest">Uptime SLA</span>
            </div>
            <div className="w-px h-12 bg-blue-700" />
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black">HMAC</span>
              <span className="text-[10px] font-black uppercase text-blue-300 tracking-widest">Signed Webhooks</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="pt-16 pb-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
        <p className="text-[11px] font-bold uppercase tracking-widest">© 2026 PayxMint Ecosystem. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="text-[11px] font-black hover:text-blue-600 transition-all">Support</a>
          <a href="#" className="text-[11px] font-black hover:text-blue-600 transition-all">Status</a>
          <a href="#" className="text-[11px] font-black hover:text-blue-600 transition-all">Privacy</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-3">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <div className="md:w-1/2 space-y-4">
        <div className="text-4xl font-black text-slate-100 leading-none">{number}</div>
        <h3 className="text-xl font-black text-slate-900 leading-tight">{title}</h3>
        <p className="text-sm text-slate-600 font-medium leading-relaxed">{description}</p>
      </div>
      <div className="md:w-1/2 w-full">
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-x-auto shadow-xl border border-white/5">
      <div className="flex gap-1.5 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
      </div>
      <pre className="text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
