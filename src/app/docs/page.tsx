"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Terminal, Copy, Check, ChevronRight, Search, Code, Globe, Zap, 
  Activity, Menu, X, Shield, FileText, Key, Database, Webhook as WebhookIcon, 
  Server, Lock, ArrowRight, Layers, RefreshCw, AlertTriangle, ShieldCheck, 
  Cpu, Workflow, BarChart3, Clock, Scale, UserCheck, HardDrive, Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Language = 'CURL' | 'NODE' | 'PYTHON' | 'GO';

// --- UI Components ---

const SidebarLink = ({ id, label, active, onClick, group = false }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full text-left px-3 py-1.5 rounded-md transition-all ${
      group ? "font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-6 mb-2 cursor-default" : "text-[13px]"
    } ${
      !group && active 
        ? "bg-blue-600/10 text-blue-600 font-bold" 
        : !group ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium" : ""
    }`}
  >
    {label}
  </button>
);

const CodeBlock = ({ snippets, activeLang, onLangChange }: { snippets: any, activeLang: Language, onLangChange: (l: Language) => void }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden bg-[#0D1117] border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex gap-4">
          {(Object.keys(snippets) as Language[]).map(l => (
            <button 
              key={l}
              onClick={() => onLangChange(l)}
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
      <div className="p-5 overflow-x-auto min-h-[160px]">
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
        <div className="w-48 shrink-0">
          <code className="text-blue-600 font-bold text-[13px]">{p.name}</code>
          <div className="flex gap-2 mt-1">
             <span className="text-[10px] text-slate-400 font-bold uppercase">{p.type}</span>
             {p.required && <span className="text-[10px] text-rose-500 font-bold uppercase">Required</span>}
          </div>
        </div>
        <div className="text-[13px] text-slate-600 leading-relaxed max-w-lg">
          {p.desc}
        </div>
      </div>
    ))}
  </div>
);

// --- Sections Data ---

const SECTIONS = [
  { id: "overview", label: "Platform Overview", group: "Foundation" },
  { id: "architecture", label: "System Architecture", group: "Foundation" },
  { id: "lifecycle", label: "Payment Lifecycle", group: "Foundation" },
  { id: "state-machines", label: "State Machines", group: "Foundation" },

  { id: "merchant-apis", label: "Merchant Integration", group: "Integration" },
  { id: "webhook-system", label: "Webhook Guarantees", group: "Integration" },
  { id: "retry-logic", label: "Failure & Retries", group: "Integration" },

  { id: "routing-engine", label: "Routing & Allocation", group: "Infrastructure" },
  { id: "account-management", label: "Account Management", group: "Infrastructure" },
  { id: "allocation-logic", label: "Allocation Logic", group: "Infrastructure" },

  { id: "staff-ops", label: "Staff Operations", group: "Operations" },
  { id: "admin-controls", label: "Admin Controls", group: "Operations" },
  { id: "settlements", label: "Settlement System", group: "Operations" },

  { id: "security-model", label: "Security Model", group: "Compliance" },
  { id: "fraud-prevention", label: "Fraud Prevention", group: "Compliance" },
  { id: "error-codes", label: "Standard Error Codes", group: "Compliance" },
  { id: "observability", label: "Observability", group: "Compliance" },
];

export default function DocsPage() {
  const [activeLang, setActiveLang] = useState<Language>('CURL');
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: "-80px 0px -50% 0px" }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
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
      {/* --- Sticky Navigation --- */}
      <nav className="h-14 bg-white border-b border-slate-100 sticky top-0 z-[100] px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-all">W</div>
             <span className="font-bold text-slate-900 tracking-tight text-sm">WaveCollect <span className="text-slate-400 font-medium">Core</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-4 ml-4">
             <button className="text-[11px] font-bold text-blue-600 border-b-2 border-blue-600 py-4 h-14">Infrastructure</button>
             <button className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-all py-4 h-14">API Specs</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-100 text-slate-400 group cursor-pointer">
              <Search size={14} />
              <span className="text-xs font-medium group-hover:text-slate-600">Search Infrastructure Docs...</span>
              <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 rounded ml-4 font-sans font-bold">⌘K</kbd>
           </div>
           <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
           </button>
        </div>
      </nav>

      <div className="flex-1 flex relative">
        {/* --- Sidebar Navigation --- */}
        <aside className={`
          fixed lg:sticky top-14 left-0 bottom-0 w-64 bg-slate-50 border-r border-slate-100 z-[90] p-6 overflow-y-auto transition-transform
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="space-y-1">
            {Array.from(new Set(SECTIONS.map(s => s.group))).map(group => (
               <React.Fragment key={group}>
                  <SidebarLink id="" label={group} group active={false} onClick={() => {}} />
                  {SECTIONS.filter(s => s.group === group).map(s => (
                     <SidebarLink key={s.id} id={s.id} label={s.label} active={activeSection === s.id} onClick={scrollTo} />
                  ))}
               </React.Fragment>
            ))}
          </div>
        </aside>

        {/* --- Main Technical Content --- */}
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="flex-1 max-w-3xl lg:max-w-none lg:w-1/2 p-6 md:p-12 lg:p-16 border-r border-slate-50 bg-white">
            <div className="max-w-2xl mx-auto lg:mx-0">
              
              {/* --- 1. OVERVIEW --- */}
              <section id="overview" className="mb-32 scroll-mt-24">
                <div className="flex items-center gap-2 mb-6">
                   <div className="w-8 h-8 bg-blue-600/10 text-blue-600 rounded-lg flex items-center justify-center"><Layers size={18}/></div>
                   <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Foundation</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Platform Overview</h1>
                <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8">
                   WaveCollect is an enterprise-grade UPI-native settlement protocol designed for real-time liquidity orchestration and high-concurrency payment collection.
                </p>
                <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-7">
                   <p>
                      The platform serves as an abstraction layer over the UPI network, providing merchants with programmatic control over disparate bank accounts (VPA Pools). Unlike legacy aggregators, WaveCollect enables <strong>Direct-to-Bank</strong> settlement by synchronizing transaction discovery at the bot-fleet layer.
                   </p>
                   <p className="mt-4 font-bold text-slate-900">Core Capabilities:</p>
                   <ul className="mt-2 space-y-2 list-disc pl-5">
                      <li>Real-time UTR (Unique Transaction Reference) matching.</li>
                      <li>Elastic VPA pool allocation with risk-based routing.</li>
                      <li>Signed webhook guarantees for synchronous reconciliation.</li>
                      <li>Staff-led manual reconciliation for edge-case recovery.</li>
                   </ul>
                </div>
              </section>

              {/* --- 2. ARCHITECTURE --- */}
              <section id="architecture" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                   <Cpu size={24} className="text-slate-400" />
                   System Architecture
                </h2>
                <div className="space-y-8">
                   <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">The Hub-Node Framework</h4>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                         The system is architected as a centralized <strong>Hub</strong> orchestrating a distributed fleet of <strong>Discovery Nodes</strong>.
                      </p>
                      <ul className="mt-6 space-y-6">
                         <li className="flex gap-4">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0 shadow-sm"><Server size={14}/></div>
                            <div>
                               <span className="text-sm font-bold text-slate-900">The Hub (Intents Engine):</span>
                               <p className="text-xs text-slate-500 mt-1 leading-relaxed">Maintains the state of all Payment Intents. It handles API requests, validates metadata, and executes routing logic to assign a VPA to a session.</p>
                            </div>
                         </li>
                         <li className="flex gap-4">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0 shadow-sm"><RefreshCw size={14}/></div>
                            <div>
                               <span className="text-sm font-bold text-slate-900">Discovery Nodes (Bot Fleet):</span>
                               <p className="text-xs text-slate-500 mt-1 leading-relaxed">Stateless worker instances that intercept XHR/Push notifications from GPay/Bank apps. They broadcast transaction payloads to the Hub via signed telemetry.</p>
                            </div>
                         </li>
                      </ul>
                   </div>
                </div>
              </section>

              {/* --- 3. LIFECYCLE --- */}
              <section id="lifecycle" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment Lifecycle</h2>
                <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                   <div className="space-y-8 relative">
                      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-slate-200" />
                      <div className="relative pl-10">
                         <div className="absolute left-0 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-sm" />
                         <h5 className="text-xs font-black uppercase tracking-widest text-slate-900">1. Intention</h5>
                         <p className="text-xs text-slate-500 mt-1">Merchant calls <code>/create-intent</code>. The Hub reserves a VPA and amount combination for 15 minutes.</p>
                      </div>
                      <div className="relative pl-10">
                         <div className="absolute left-0 w-5 h-5 bg-white border-2 border-slate-300 rounded-full shadow-sm" />
                         <h5 className="text-xs font-black uppercase tracking-widest text-slate-900">2. Presentation</h5>
                         <p className="text-xs text-slate-500 mt-1">Checkout UI presents QR or Deep Link. The customer executes the transfer via their UPI app.</p>
                      </div>
                      <div className="relative pl-10">
                         <div className="absolute left-0 w-5 h-5 bg-white border-2 border-slate-300 rounded-full shadow-sm" />
                         <h5 className="text-xs font-black uppercase tracking-widest text-slate-900">3. Discovery</h5>
                         <div className="p-3 bg-white border border-slate-200 rounded mt-2 text-[10px] font-mono text-slate-400 italic">
                            EVENT: transaction_captured<br/>UTR: 412239102931<br/>AMOUNT: 500.00
                         </div>
                      </div>
                      <div className="relative pl-10">
                         <div className="absolute left-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
                         <h5 className="text-xs font-black uppercase tracking-widest text-slate-900">4. Reconciliation</h5>
                         <p className="text-xs text-slate-500 mt-1">Hub matches UTR+Amount. Intent state transitions to <code>SUCCESS</code>. Webhook triggered.</p>
                      </div>
                   </div>
                </div>
              </section>

              {/* --- 4. STATE MACHINES --- */}
              <section id="state-machines" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">State Machines</h2>
                <ParameterTable params={[
                   { name: "PENDING", type: "State", desc: "Awaiting incoming bank notification. Intent is active for matching." },
                   { name: "SUCCESS", type: "Terminal", desc: "Reconciliation successful. Payload locked for auditing." },
                   { name: "EXPIRED", type: "Terminal", desc: "TTL exceeded. Any incoming UTRs for this intent will remain 'floating'." },
                   { name: "FLAGGED", type: "Suspended", desc: "Conflict detected (e.g., UTR used twice). Requires staff intervention." },
                ]} />
              </section>

              {/* --- 5. MERCHANT APIS --- */}
              <section id="merchant-apis" className="mb-32 scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-mono text-[10px] font-black uppercase tracking-widest border border-blue-100">Post</div>
                  <code className="text-slate-500 text-sm font-bold">/v1/create-intent</code>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Create Intent</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-8">
                   Initializes a payment intent. The request must include an <code>Idempotency-Key</code> to ensure safe retries in case of network timeouts.
                </p>
                <ParameterTable params={[
                  { name: "amount", type: "decimal", required: true, desc: "Amount in INR. Max ticket size defined by merchant tier." },
                  { name: "order_id", type: "string", required: true, desc: "Your internal reference." },
                  { name: "metadata", type: "object", required: false, desc: "Key-value pairs for tracking (e.g. dept: 'sales')." },
                ]} />
              </section>

              {/* --- 6. WEBHOOK SYSTEM --- */}
              <section id="webhook-system" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                   <WebhookIcon size={24} className="text-slate-400" />
                   Webhook Guarantees
                </h2>
                <div className="prose prose-slate prose-sm text-slate-600 leading-7">
                   <p>
                      WaveCollect provides <strong>At-Least-Once Delivery</strong>. Our webhook engine uses an exponential backoff retry cycle (1m, 5m, 1h, 6h, 24h) for any endpoint that does not return a <code>2xx</code> status.
                   </p>
                   <p className="mt-4">
                      <strong>Security:</strong> All payloads are signed using HMAC-SHA256 with the merchant's secret key. The signature is transmitted in the <code>X-PayxMint-Signature</code> header.
                   </p>
                </div>
              </section>

              {/* --- 7. ROUTING ENGINE --- */}
              <section id="routing-engine" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                   <Workflow size={24} className="text-slate-400" />
                   Routing Engine Behavior
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-8">
                   The Routing Engine (RE) determines the destination VPA for every intent. It evaluates three primary weights:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-4 border border-slate-100 rounded-lg">
                      <h5 className="text-xs font-bold text-slate-900">1. Health</h5>
                      <p className="text-[10px] text-slate-500 mt-2">Prioritizes VPAs with the lowest discovery latency heartbeat.</p>
                   </div>
                   <div className="p-4 border border-slate-100 rounded-lg">
                      <h5 className="text-xs font-bold text-slate-900">2. Load</h5>
                      <p className="text-[10px] text-slate-500 mt-2">Spreads volume across the pool to avoid bank-imposed daily limits.</p>
                   </div>
                   <div className="p-4 border border-slate-100 rounded-lg">
                      <h5 className="text-xs font-bold text-slate-900">3. Risk</h5>
                      <p className="text-[10px] text-slate-500 mt-2">Routes high-ticket intents to trusted, established VPAs.</p>
                   </div>
                </div>
              </section>

              {/* --- 8. STAFF OPS --- */}
              <section id="staff-ops" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                   <UserCheck size={24} className="text-slate-400" />
                   Staff Operations
                </h2>
                <div className="space-y-6">
                   <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Manual Reconciliation</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                         In cases where a customer pays after intent expiration or with a modified amount, the transaction enters the <strong>Floating Queue</strong>. Staff can manually bind these transactions to an intent, triggering a reconciliation event.
                      </p>
                   </div>
                </div>
              </section>

              {/* --- 9. SECURITY MODEL --- */}
              <section id="security-model" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                   <Shield size={24} className="text-slate-400" />
                   Security Model
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                   <div>
                      <h5 className="text-sm font-bold text-slate-900 mb-2">Infrastructure Security</h5>
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                         Nodes communicate with the Hub via mTLS. Merchant requests are enforced through strict IP Whitelisting and API Key scoping.
                      </p>
                   </div>
                   <div>
                      <h5 className="text-sm font-bold text-slate-900 mb-2">Fraud Prevention</h5>
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                         Real-time velocity checks monitor for VPA cycling, UTR double-spending, and anomalous ticket size patterns.
                      </p>
                   </div>
                </div>
              </section>

              {/* --- 10. ERROR CODES --- */}
              <section id="error-codes" className="mb-32 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Error Codes</h2>
                <ParameterTable params={[
                   { name: "insufficient_pool", type: "503", desc: "No available VPA nodes match the routing criteria." },
                   { name: "invalid_signature", type: "401", desc: "HMAC verification failed for the provided API key." },
                   { name: "rate_limit_exceeded", type: "429", desc: "Request volume exceeds the merchant's configured TPM tier." },
                   { name: "duplicate_order_id", type: "409", desc: "The provided order_id has already been settled." },
                ]} />
              </section>

            </div>
          </div>

          {/* --- Code Examples Panel --- */}
          <div className="lg:w-1/2 bg-[#0C1017] p-4 md:p-8 lg:p-12 lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] overflow-y-auto">
             <div className="max-w-xl mx-auto lg:mx-0 sticky top-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-12">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Sample Request</p>
                       <CodeBlock 
                          snippets={SNIPPETS[activeSection] || SNIPPETS.default} 
                          activeLang={activeLang} 
                          onLangChange={setActiveLang} 
                       />
                    </div>

                    <div className="mt-12">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">JSON Response</p>
                       <div className="rounded-xl bg-[#161B22] border border-white/5 p-6 shadow-2xl">
                          <pre className="text-[12px] font-mono leading-relaxed text-blue-300 overflow-x-auto">
                             {JSON.stringify(RESPONSES[activeSection] || RESPONSES.default, null, 2)}
                          </pre>
                       </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="h-14 border-t border-slate-100 flex items-center justify-between px-12 bg-slate-50/50">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 WaveCollect Core Infrastructure</p>
         <div className="flex gap-6">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> All Systems Operational
            </span>
         </div>
      </footer>
    </div>
  );
}

// --- Data Constants ---

const SNIPPETS: any = {
  "merchant-apis": {
    CURL: `curl https://api.wavecollect.com/v1/create-intent \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Idempotency-Key: id_8899" \\
  -d amount=500.00 \\
  -d order_id="INV-900"`,
    NODE: `const intent = await wavecollect.paymentIntents.create({\n  amount: 500.00,\n  order_id: 'INV-900'\n}, { idempotencyKey: 'id_8899' });`,
    PYTHON: `intent = wavecollect.PaymentIntent.create(\n  amount=500.00,\n  order_id="INV-900"\n)`,
    GO: `params := &wavecollect.PaymentIntentParams{\n  Amount: 500.00,\n  OrderID: "INV-900",\n}\nintent, _ := paymentintent.New(params)`
  },
  default: {
    CURL: `curl https://api.wavecollect.com/v1/me \\
  -H "Authorization: Bearer sk_live_xxx"`,
    NODE: `const me = await wavecollect.accounts.retrieve();`,
    PYTHON: `me = wavecollect.Account.retrieve()`,
    GO: `account, _ := account.Get()`
  }
};

const RESPONSES: any = {
  "merchant-apis": {
    id: "pi_123456789",
    object: "payment_intent",
    amount: 500.00,
    status: "pending",
    order_id: "INV-900",
    checkout_url: "https://wavecollect.com/pay/tok_65c3b...",
    payment_token: "tok_65c3b...",
    metadata: { dept: "sales" },
    created: 1684245600
  },
  default: {
    id: "acct_887766",
    object: "account",
    status: "active",
    type: "merchant_owned"
  }
};
