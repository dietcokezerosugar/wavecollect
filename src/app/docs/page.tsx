"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Terminal, Copy, Check, ChevronRight, Search, Code, Globe, Zap, 
  Activity, Menu, X, Shield, FileText, Key, Database, Webhook as WebhookIcon, 
  Server, Lock, ArrowRight, Layers, RefreshCw, AlertTriangle, ShieldCheck, 
  Cpu, Workflow, BarChart3, Clock, Scale, UserCheck, HardDrive, Inbox,
  Smartphone, CreditCard, ExternalLink, Settings, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Language = 'CURL' | 'NODE' | 'PYTHON' | 'GO';

// --- UI Components ---

const SidebarLink = ({ id, label, active, onClick, isGroup = false }: any) => (
  <button
    onClick={() => !isGroup && onClick(id)}
    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
      isGroup 
        ? "font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-8 mb-2 cursor-default" 
        : "text-[13px] hover:bg-slate-100"
    } ${
      !isGroup && active 
        ? "bg-blue-600/10 text-blue-600 font-bold" 
        : !isGroup ? "text-slate-500 hover:text-slate-900 font-medium" : ""
    }`}
  >
    {label}
  </button>
);

const InlineCode = ({ snippets }: { snippets: any }) => {
  const [activeLang, setActiveLang] = useState<Language>('CURL');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden bg-[#0D1117] border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex gap-4">
          {(Object.keys(snippets) as Language[]).map(l => (
            <button 
              key={l}
              onClick={() => setActiveLang(l)}
              className={`text-[10px] font-bold uppercase tracking-widest transition-all py-1 ${
                activeLang === l ? "text-blue-400 border-b border-blue-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={copy} className="text-slate-500 hover:text-white transition-colors">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-6 overflow-x-auto">
        <pre className="text-[12px] font-mono leading-relaxed text-slate-300">
          {snippets[activeLang]}
        </pre>
      </div>
    </div>
  );
};

const ParameterTable = ({ params }: { params: any[] }) => (
  <div className="my-8 border-t border-slate-100">
    {params.map((p, i) => (
      <div key={i} className="py-4 border-b border-slate-100 flex flex-col md:flex-row gap-2 md:gap-12">
        <div className="w-56 shrink-0">
          <code className="text-blue-600 font-bold text-[13px]">{p.name}</code>
          <div className="flex gap-2 mt-1">
             <span className="text-[10px] text-slate-400 font-bold uppercase">{p.type}</span>
             {p.required && <span className="text-[10px] text-rose-500 font-bold uppercase">Required</span>}
          </div>
        </div>
        <div className="text-[13px] text-slate-600 leading-relaxed max-w-2xl">
          {p.desc}
        </div>
      </div>
    ))}
  </div>
);

// --- Sections Data ---

const NAVIGATION = [
  { group: "Getting Started", items: [
    { id: "quickstart", label: "Quickstart Guide" },
    { id: "authentication", label: "Authentication" },
  ]},
  { group: "Core Integration", items: [
    { id: "create-intent", label: "Create Intent" },
    { id: "check-status", label: "Check Status" },
    { id: "webhooks", label: "Webhooks" },
  ]},
  { group: "Advanced", items: [
    { id: "idempotency", label: "Idempotency" },
    { id: "metadata", label: "Custom Metadata" },
    { id: "error-handling", label: "Error Handling" },
  ]}
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');
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

    const sections = NAVIGATION.flatMap(n => n.items.map(i => i.id));
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 text-slate-900">
      {/* --- Global Header --- */}
      <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-[100] px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-all">W</div>
             <span className="font-bold text-slate-900 tracking-tight text-base">WaveCollect <span className="text-slate-400 font-medium ml-1">Docs</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400 group cursor-pointer hover:bg-slate-100 transition-all">
              <Search size={14} />
              <span className="text-xs font-medium group-hover:text-slate-600">Search documentation...</span>
              <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 rounded ml-4 font-sans font-bold">⌘K</kbd>
           </div>
           <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all mr-4">Dashboard</Link>
           <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
           </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* --- Sidebar (Fixed Scroll) --- */}
        <aside className={`
          fixed lg:sticky top-16 left-0 bottom-0 w-72 bg-slate-50 border-r border-slate-100 z-[90] p-8 overflow-y-auto custom-scrollbar transition-transform
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="space-y-1">
            {NAVIGATION.map((nav) => (
               <React.Fragment key={nav.group}>
                  <SidebarLink label={nav.group} isGroup />
                  {nav.items.map(item => (
                     <SidebarLink key={item.id} id={item.id} label={item.label} active={activeSection === item.id} onClick={scrollTo} />
                  ))}
               </React.Fragment>
            ))}
          </div>

          <div className="mt-12 p-4 bg-blue-600 rounded-xl text-white shadow-xl shadow-blue-600/20">
             <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} />
                <span className="text-[11px] font-black uppercase tracking-widest">Enterprise Ready</span>
             </div>
             <p className="text-[12px] leading-relaxed opacity-90 font-medium">
                Running in production? Enable signed webhooks and idempotency for maximum reliability.
             </p>
          </div>
        </aside>

        {/* --- Main Content (Independent Scroll) --- */}
        <main className="flex-1 max-w-4xl px-8 py-12 md:px-20 md:py-20 lg:px-32 mx-auto min-w-0">
          
          {/* --- QUICKSTART --- */}
          <section id="quickstart" className="mb-32 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
               <Zap size={18} className="text-blue-600" />
               <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Getting Started</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Quickstart Guide</h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-12">
               Integrate WaveCollect and start accepting UPI payments in less than 5 minutes.
            </p>

            <div className="space-y-16">
               <div className="flex gap-6">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black shrink-0">1</div>
                  <div>
                     <h3 className="text-xl font-bold mb-2">Get your API Key</h3>
                     <p className="text-slate-600 text-[15px] leading-relaxed">
                        Login to your dashboard and navigate to <Link href="/dashboard/api-keys" className="text-blue-600 font-bold hover:underline">API Keys</Link>. You'll need your <strong>Secret Key</strong> to authenticate requests.
                     </p>
                  </div>
               </div>

               <div className="flex gap-6">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black shrink-0">2</div>
                  <div>
                     <h3 className="text-xl font-bold mb-2">Create a Payment Intent</h3>
                     <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                        An intent tracks the lifecycle of a payment. Create one whenever you're ready to charge a customer.
                     </p>
                     <InlineCode snippets={{
                        CURL: `curl https://api.wavecollect.com/v1/create-intent \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d amount=500.00 \\
  -d order_id="INV-001"`,
                        NODE: `const response = await fetch('https://api.wavecollect.com/v1/create-intent', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },\n  body: JSON.stringify({ amount: 500, order_id: 'INV-001' })\n});`
                     }} />
                  </div>
               </div>

               <div className="flex gap-6">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black shrink-0">3</div>
                  <div>
                     <h3 className="text-xl font-bold mb-2">Redirect to Checkout</h3>
                     <p className="text-slate-600 text-[15px] leading-relaxed">
                        Our API returns a <code>checkout_url</code>. Redirect your customer to this URL to complete the payment via our secure, high-conversion UPI interface.
                     </p>
                  </div>
               </div>
            </div>
          </section>

          {/* --- AUTHENTICATION --- */}
          <section id="authentication" className="mb-32 scroll-mt-24">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Authentication</h2>
            <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
               Authenticate all requests by including your secret API key in the <code>Authorization</code> header as a Bearer token.
            </p>
            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg mb-8">
               <p className="text-[13px] text-amber-900 font-medium">
                  <strong>Warning:</strong> Never share your secret keys in client-side code (JS/Mobile). Use them only on your backend.
               </p>
            </div>
            <InlineCode snippets={{
               CURL: `curl https://api.wavecollect.com/v1/me -H "Authorization: Bearer YOUR_API_KEY"`
            }} />
          </section>

          {/* --- CREATE INTENT --- */}
          <section id="create-intent" className="mb-32 scroll-mt-24">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Create Intent</h2>
            <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
               Primary endpoint for initiating a collection. It reserves a VPA from your pool and monitors it for incoming transactions.
            </p>
            <ParameterTable params={[
               { name: "amount", type: "decimal", required: true, desc: "Exact amount to collect in INR." },
               { name: "order_id", type: "string", required: true, desc: "Unique reference for the order on your system." },
               { name: "metadata", type: "json", required: false, desc: "Custom key-value pairs (e.g. { customer_id: 123 })." },
            ]} />
            <InlineCode snippets={{
               CURL: `curl https://api.wavecollect.com/v1/create-intent \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -d amount=500.00 \\
  -d order_id="ORD-12345"`,
               NODE: `const intent = await wavecollect.paymentIntents.create({\n  amount: 500.00,\n  order_id: 'ORD-12345'\n});`
            }} />
          </section>

          {/* --- CHECK STATUS --- */}
          <section id="check-status" className="mb-32 scroll-mt-24">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Check Status</h2>
            <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
               Retrieve the current status of a payment intent using the <code>payment_token</code> returned during creation.
            </p>
            <InlineCode snippets={{
               CURL: `curl https://api.wavecollect.com/v1/check-status?token=tok_65c3b... \\
  -H "Authorization: Bearer sk_live_xxx"`
            }} />
          </section>

          {/* --- WEBHOOKS --- */}
          <section id="webhooks" className="mb-32 scroll-mt-24">
             <div className="flex items-center gap-2 mb-4">
               <WebhookIcon size={18} className="text-slate-400" />
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Automation</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Webhooks</h2>
            <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
               We send a <code>POST</code> notification to your configured URL when a payment is successful. Webhooks ensure your system stays in sync without manual polling.
            </p>
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[13px] mb-8 overflow-x-auto shadow-2xl">
               {`{
  "event": "payment.success",
  "order_id": "ORD-12345",
  "amount": 500.00,
  "utr": "412239102931",
  "metadata": { "dept": "sales" }
}`}
            </div>
          </section>

          {/* --- IDEMPOTENCY --- */}
          <section id="idempotency" className="mb-32 scroll-mt-24">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Idempotency</h2>
            <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
               Use the <code>Idempotency-Key</code> header to safely retry requests without creating duplicate intents. If an intent for the given key already exists, we return the existing object.
            </p>
            <InlineCode snippets={{
               CURL: `curl https://api.wavecollect.com/v1/create-intent \\
  -H "Idempotency-Key: unique_req_123" \\
  -d amount=500.00 ...`
            }} />
          </section>

          {/* --- METADATA --- */}
          <section id="metadata" className="mb-32 scroll-mt-24">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Custom Metadata</h2>
            <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
               Attach up to 20 key-value pairs to your intents. This data is returned in all status responses and webhook payloads, making reconciliation seamless.
            </p>
            <InlineCode snippets={{
               CURL: `curl ... -d metadata[internal_id]="ABC" -d metadata[customer_tier]="gold"`
            }} />
          </section>

          {/* --- ERROR HANDLING --- */}
          <section id="error-handling" className="mb-32 scroll-mt-24">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Error Handling</h2>
            <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
               Our API uses standard HTTP status codes. Every error response follows a structured format for machine-readable debugging.
            </p>
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
               <pre className="text-xs font-mono text-rose-600">
                  {`{
  "error": {
    "type": "invalid_request_error",
    "code": "parameter_missing",
    "message": "The 'amount' parameter is required."
  }
}`}
               </pre>
            </div>
          </section>

          <footer className="mt-24 pt-12 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">© 2026 WaveCollect Infrastructure</p>
             <div className="flex justify-center gap-8">
                <Link href="/dashboard" className="text-xs font-black text-slate-900 hover:text-blue-600 transition-all uppercase tracking-widest">Support</Link>
                <Link href="/dashboard" className="text-xs font-black text-slate-900 hover:text-blue-600 transition-all uppercase tracking-widest">Status</Link>
                <Link href="/dashboard" className="text-xs font-black text-slate-900 hover:text-blue-600 transition-all uppercase tracking-widest">API Health</Link>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
