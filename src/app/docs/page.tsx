"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Terminal, Copy, Check, ChevronRight, Search, Code, Globe, Zap, 
  Activity, Menu, X, Shield, FileText, Key, Database, Webhook as WebhookIcon, 
  Server, Lock, ArrowRight, Layers, RefreshCw, AlertTriangle, ShieldCheck, 
  Cpu, Workflow, BarChart3, Clock, Scale, UserCheck, HardDrive, Inbox,
  Smartphone, CreditCard, ExternalLink, Settings, BookOpen, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Language = 'CURL' | 'NODE' | 'PYTHON' | 'GO';

// --- UI Components ---

const SidebarLink = ({ id, label, active, onClick, isGroup = false }: any) => (
  <button
    onClick={() => !isGroup && onClick(id)}
    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
      isGroup 
        ? "font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-10 mb-2 cursor-default" 
        : "text-[13px] group relative"
    } ${
      !isGroup && active 
        ? "bg-indigo-50 text-indigo-700 font-bold" 
        : !isGroup ? "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium" : ""
    }`}
  >
    {label}
    {!isGroup && active && (
       <motion.div layoutId="activeNav" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-r-full" />
    )}
  </button>
);

const CodeBlock = ({ snippets, title }: { snippets: any, title?: string }) => {
  const [activeLang, setActiveLang] = useState<Language>('CURL');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-10 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xl shadow-indigo-900/10">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800/50 border-b border-white/5">
        <div className="flex items-center gap-6">
           {title && <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</span>}
           <div className="flex gap-4">
              {(Object.keys(snippets) as Language[]).map(l => (
                <button 
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-all py-1 relative ${
                    activeLang === l ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {l}
                  {activeLang === l && <motion.div layoutId="codeTab" className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-indigo-500" />}
                </button>
              ))}
           </div>
        </div>
        <button onClick={copy} className="text-slate-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-6 overflow-x-auto bg-[#0F172A]">
        <pre className="text-[13px] font-mono leading-relaxed text-slate-300">
           {snippets[activeLang].split('\n').map((line: string, i: number) => (
             <div key={i} className="table-row">
               <span className="table-cell text-slate-600 pr-6 text-right select-none w-8">{i + 1}</span>
               <span className="table-cell">{line}</span>
             </div>
           ))}
        </pre>
      </div>
    </div>
  );
};

const PropertyTable = ({ properties, title }: { properties: any[], title: string }) => (
  <div className="my-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Hash size={14} className="text-indigo-600" />
          {title}
       </h4>
       <span className="text-[10px] font-bold text-slate-400 uppercase">{properties.length} Fields</span>
    </div>
    <div className="divide-y divide-slate-100">
      {properties.map((p, i) => (
        <div key={i} className="px-6 py-6 hover:bg-slate-50/50 transition-colors group">
          <div className="flex flex-col md:flex-row gap-2 md:gap-12">
            <div className="w-56 shrink-0">
              <code className="text-indigo-600 font-bold text-[13px] bg-indigo-50/50 px-1.5 py-0.5 rounded-md">{p.name}</code>
              <div className="flex gap-2 mt-2">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.type}</span>
                 {p.required && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Required</span>}
              </div>
            </div>
            <div className="text-[13px] text-slate-600 leading-relaxed max-w-2xl">
              {p.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Callout = ({ type, title, children }: any) => {
  const styles: any = {
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: <AlertTriangle size={18} className="text-amber-500" /> },
    info: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-900", icon: <Shield size={18} className="text-indigo-500" /> },
    tip: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: <Zap size={18} className="text-emerald-500" /> }
  };
  const s = styles[type];
  return (
    <div className={`my-8 p-6 rounded-2xl border ${s.border} ${s.bg} flex gap-4 shadow-sm`}>
       <div className="mt-0.5 shrink-0">{s.icon}</div>
       <div>
          <h5 className={`text-[13px] font-bold ${s.text} mb-1 uppercase tracking-widest`}>{title}</h5>
          <div className={`text-[14px] leading-relaxed opacity-80 ${s.text} font-medium`}>{children}</div>
       </div>
    </div>
  );
};

// --- Navigation Definition ---

const NAVIGATION = [
  { group: "Foundation", items: [
    { id: "overview", label: "Protocol Overview" },
    { id: "authentication", label: "Authentication" },
    { id: "quickstart", label: "Quickstart" },
  ]},
  { group: "Core APIs", items: [
    { id: "payment-intents", label: "Payment Intents" },
    { id: "checkout", label: "Checkout Experience" },
    { id: "webhooks", label: "Webhooks" },
  ]},
  { group: "Security & Reliability", items: [
    { id: "idempotency", label: "Idempotency" },
    { id: "signatures", label: "Signed Payloads" },
    { id: "errors", label: "Error Protocols" },
  ]}
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -50% 0px" }
    );

    NAVIGATION.flatMap(n => n.items.map(i => i.id)).forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 text-slate-900">
      {/* --- Premium Header --- */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[100] px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-all duration-300">W</div>
             <span className="font-bold text-slate-900 tracking-tight text-base">WaveCollect <span className="text-slate-400 font-medium ml-1">Developers</span></span>
          </Link>
          <div className="hidden md:flex h-6 w-px bg-slate-200 mx-2" />
          <div className="hidden md:flex items-center gap-6">
             <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Dashboard</Link>
             <Link href="/docs" className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600 py-5 translate-y-[2px]">Documentation</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-full border border-slate-200 text-slate-400 group cursor-pointer hover:bg-slate-200/50 transition-all">
              <Search size={14} className="group-hover:text-slate-600" />
              <span className="text-xs font-medium group-hover:text-slate-600">Search documentation...</span>
              <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 rounded-md ml-4 font-sans font-black text-slate-400">⌘K</kbd>
           </div>
           <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
           </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* --- Navigation Sidebar --- */}
        <aside className={`
          fixed lg:sticky top-16 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-[90] p-8 overflow-y-auto transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="space-y-2">
            {NAVIGATION.map((nav) => (
               <React.Fragment key={nav.group}>
                  <SidebarLink label={nav.group} isGroup />
                  {nav.items.map(item => (
                     <SidebarLink key={item.id} id={item.id} label={item.label} active={activeSection === item.id} onClick={scrollTo} />
                  ))}
               </React.Fragment>
            ))}
          </div>

          <div className="mt-16 p-6 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-600/20 group overflow-hidden relative">
             <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
             <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={18} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Live Status</span>
             </div>
             <p className="text-[12px] leading-relaxed font-bold">
                Nodes are at 99.98% efficiency. Average settlement: 4.2s.
             </p>
             <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-200 group-hover:text-white transition-colors cursor-pointer">
                View Status <ArrowRight size={12} />
             </div>
          </div>
        </aside>

        {/* --- Documentation Main Content --- */}
        <main className="flex-1 bg-white">
          <div className="max-w-4xl px-8 py-16 md:px-16 md:py-24 lg:px-24 mx-auto min-w-0">
             
             {/* --- OVERVIEW --- */}
             <section id="overview" className="mb-40 scroll-mt-24">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 mb-8 shadow-sm">
                   <Layers size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Protocol v2.4</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-8 leading-tight">Protocol Overview</h1>
                <p className="text-xl text-slate-600 leading-relaxed font-medium mb-10 max-w-3xl">
                   WaveCollect is a high-concurrency UPI settlement protocol designed for zero-latency reconciliation and elastic account distribution.
                </p>
                <div className="prose prose-slate max-w-none text-slate-600 leading-8 text-[16px]">
                   <p>
                      Our infrastructure serves as a programmatic bridge between traditional banking networks and modern application stacks. By leveraging a distributed fleet of <strong>Sync Nodes</strong>, we intercept and reconcile UPI transactions in real-time, providing immediate settlement confirmation through a robust API and signed webhook ecosystem.
                   </p>
                   <div className="grid md:grid-cols-2 gap-8 mt-12 not-prose">
                      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all duration-300">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 mb-6 shadow-sm"><Workflow size={24} className="text-indigo-600"/></div>
                         <h4 className="text-lg font-black mb-3">Sync Node Mesh</h4>
                         <p className="text-[14px] text-slate-500 leading-relaxed font-medium">Stateless workers that monitor UPI telemetry with &lt;200ms latency from bank heartbeat.</p>
                      </div>
                      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all duration-300">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 mb-6 shadow-sm"><RefreshCw size={24} className="text-indigo-600"/></div>
                         <h4 className="text-lg font-black mb-3">Real-time UTR Matching</h4>
                         <p className="text-[14px] text-slate-500 leading-relaxed font-medium">Automatic binding of incoming bank references to payment intents with 99.99% accuracy.</p>
                      </div>
                   </div>
                </div>
             </section>

             {/* --- AUTHENTICATION --- */}
             <section id="authentication" className="mb-40 scroll-mt-24">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Lock size={20}/></div>
                   Authentication
                </h2>
                <p className="text-[16px] text-slate-600 leading-relaxed mb-8 font-medium">
                   All API requests must be authenticated using your Secret Key. This key carries high privileges and should never be exposed in public repositories or client-side code.
                </p>
                <Callout type="warning" title="Security Requirement">
                   We enforce strict mTLS and IP whitelisting for production environments. Ensure your server IPs are registered in the dashboard.
                </Callout>
                <CodeBlock 
                   title="Authorization Header"
                   snippets={{
                     CURL: `curl https://api.wavecollect.com/v1/me \\
  -H "Authorization: Bearer sk_live_your_secret_key"`,
                     NODE: `const response = await fetch('https://api.wavecollect.com/v1/me', {\n  headers: { 'Authorization': 'Bearer sk_live_xxx' }\n});`
                   }} 
                />
             </section>

             {/* --- QUICKSTART --- */}
             <section id="quickstart" className="mb-40 scroll-mt-24">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Zap size={20}/></div>
                   5-Minute Quickstart
                </h2>
                <div className="space-y-16">
                   <div className="flex gap-8 group">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500">1</div>
                      <div className="pt-2">
                         <h3 className="text-xl font-black mb-3">Initialize a Payment Intent</h3>
                         <p className="text-slate-600 leading-relaxed font-medium mb-8">Create an intent to start a payment session. This reserves a VPA from your pool and returns a unique checkout URL.</p>
                         <CodeBlock snippets={{
                           CURL: `curl https://api.wavecollect.com/v1/create-intent \\
  -d amount=500.00 \\
  -d order_id="INV_001"`,
                           NODE: `const intent = await wavecollect.paymentIntents.create({\n  amount: 500,\n  order_id: 'INV_001'\n});`
                         }} />
                      </div>
                   </div>

                   <div className="flex gap-8 group">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500">2</div>
                      <div className="pt-2">
                         <h3 className="text-xl font-black mb-3">Handle the Response</h3>
                         <p className="text-slate-600 leading-relaxed font-medium">Redirect your user to the <code>checkout_url</code> or use the <code>upi_link</code> to trigger native app intents on mobile devices.</p>
                      </div>
                   </div>
                </div>
             </section>

             {/* --- PAYMENT INTENTS --- */}
             <section id="payment-intents" className="mb-40 scroll-mt-24">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Payment Intents</h2>
                <p className="text-[16px] text-slate-600 leading-relaxed mb-8 font-medium">
                   A PaymentIntent tracks the lifecycle of a collection attempt. It is the single source of truth for payment status, UTR matching, and merchant reconciliation.
                </p>
                <PropertyTable 
                   title="Intent Schema"
                   properties={[
                      { name: "id", type: "string", desc: "Unique identifier for the intent (pi_...)." },
                      { name: "amount", type: "decimal", required: true, desc: "The exact amount to collect in INR." },
                      { name: "order_id", type: "string", required: true, desc: "Your system's unique reference for the order." },
                      { name: "status", type: "enum", desc: "One of: pending, success, expired, flagged." },
                      { name: "metadata", type: "json", desc: "Arbitrary key-value pairs associated with the intent." },
                      { name: "checkout_url", type: "url", desc: "URL to the hosted checkout page." }
                   ]} 
                />
             </section>

             {/* --- WEBHOOKS --- */}
             <section id="webhooks" className="mb-40 scroll-mt-24">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20"><WebhookIcon size={20}/></div>
                   Webhooks
                </h2>
                <p className="text-[16px] text-slate-600 leading-relaxed mb-8 font-medium">
                   Webhooks provide real-time notification of payment success. We guarantee at-least-once delivery with exponential backoff retries for 24 hours.
                </p>
                <Callout type="tip" title="Best Practice">
                   Always return a <code>200 OK</code> response within 5 seconds to avoid timeout retries.
                </Callout>
                <CodeBlock 
                   title="Success Payload"
                   snippets={{
                     CURL: `{
  "id": "evt_12345",
  "type": "payment.success",
  "data": {
    "order_id": "ORD-12345",
    "amount": 500.00,
    "utr": "412239102931",
    "metadata": { "dept": "sales" }
  },
  "created": 1684245600
}`
                   }} 
                />
             </section>

             {/* --- ERRORS --- */}
             <section id="errors" className="mb-40 scroll-mt-24">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white"><AlertTriangle size={20}/></div>
                   Error Protocols
                </h2>
                <p className="text-[16px] text-slate-600 leading-relaxed mb-8 font-medium">
                   We use standard HTTP response codes to indicate the success or failure of an API request. Codes in the <code>4xx</code> range indicate an error that failed given the information provided.
                </p>
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-rose-400 font-mono text-[13px] shadow-2xl">
                   {`{
  "error": {
    "type": "invalid_request_error",
    "code": "parameter_missing",
    "message": "The 'amount' parameter is required to create a payment intent."
  }
}`}
                </div>
             </section>

             <footer className="mt-32 pt-16 border-t border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-[10px] font-black">W</div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">© 2026 WaveCollect Core Infrastructure</span>
                   </div>
                   <div className="flex gap-10">
                      <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">API Status</Link>
                      <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Privacy Policy</Link>
                      <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Terms</Link>
                   </div>
                </div>
             </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
