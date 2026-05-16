"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Terminal, 
  Copy, 
  Check, 
  ChevronRight, 
  Search,
  Code,
  Globe,
  Zap,
  Activity,
  Menu,
  X,
  Shield,
  FileText,
  Key,
  Database,
  Webhook as WebhookIcon,
  Server,
  Lock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Language = 'CURL' | 'NODE' | 'PYTHON' | 'PHP';

// --- UI Components ---

const SidebarLink = ({ id, label, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full text-left px-3 py-1.5 rounded-md text-[13px] transition-all ${
      active 
        ? "bg-blue-600/10 text-blue-600 font-bold" 
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium"
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
    <div className="rounded-xl overflow-hidden bg-[#0A0D14] border border-white/10 shadow-2xl">
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
      <div className="p-5 overflow-x-auto min-h-[200px]">
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
      <div key={i} className="py-4 border-b border-slate-100 flex flex-col md:flex-row gap-2 md:gap-24">
        <div className="w-48 shrink-0">
          <code className="text-blue-600 font-bold text-[13px]">{p.name}</code>
          <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">{p.type} {p.required && <span className="text-rose-500">Required</span>}</p>
        </div>
        <div className="text-[13px] text-slate-600 leading-relaxed">
          {p.desc}
        </div>
      </div>
    ))}
  </div>
);

// --- Content Data ---

const API_DOCS = {
  authentication: {
    title: "Authentication",
    desc: "Authenticate your requests by including your secret API key in the Authorization header.",
    text: "The WaveCollect API uses API keys to authenticate requests. You can view and manage your API keys in the dashboard. Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.",
    params: [
      { name: "Authorization", type: "header", required: true, desc: "Bearer <your_api_key>" }
    ],
    snippets: {
      CURL: `curl https://api.wavecollect.com/v1/create-intent \\
  -H "Authorization: Bearer sk_live_xxx"`,
      NODE: `const axios = require('axios');\n\nconst response = await axios.get('https://api.wavecollect.com/v1/me', {\n  headers: { 'Authorization': 'Bearer sk_live_xxx' }\n});`,
      PYTHON: `import requests\n\nresponse = requests.get(\n  "https://api.wavecollect.com/v1/me",\n  headers={"Authorization": "Bearer sk_live_xxx"}\n)`,
      PHP: `<?php\n$curl = curl_init();\ncurl_setopt($curl, CURLOPT_HTTPHEADER, [\n  'Authorization: Bearer sk_live_xxx'\n]);`
    }
  },
  createIntent: {
    title: "Create a Payment Intent",
    desc: "Create a PaymentIntent object to initiate a new UPI collection.",
    text: "This is the primary endpoint for starting a payment. It will return a checkout URL, a UPI deep link, and a raw QR data string. If you provide an order_id that has already been used, the API will return the existing intent (idempotency by order_id).",
    params: [
      { name: "amount", type: "number", required: true, desc: "The amount to collect in INR (e.g. 500.00)." },
      { name: "order_id", type: "string", required: true, desc: "Your unique reference for this order." },
      { name: "metadata", type: "object", required: false, desc: "Set of key-value pairs that you can attach to an object." },
      { name: "Idempotency-Key", type: "header", required: false, desc: "Optional header to safely retry requests." }
    ],
    snippets: {
      CURL: `curl https://api.wavecollect.com/v1/create-intent \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -d amount=500.00 \\
  -d order_id="ORD-12345" \\
  -d metadata[dept]="sales"`,
      NODE: `const intent = await wavecollect.paymentIntents.create({\n  amount: 50000,\n  order_id: 'ORD-12345',\n  metadata: { dept: 'sales' }\n});`,
      PYTHON: `intent = wavecollect.PaymentIntent.create(\n  amount=50000,\n  order_id="ORD-12345",\n  metadata={"dept": "sales"}\n)`,
      PHP: `<?php\n$intent = $wavecollect->paymentIntents->create([\n  'amount' => 50000,\n  'order_id' => 'ORD-12345'\n]);`
    }
  },
  webhooks: {
    title: "Webhooks",
    desc: "Handle real-time payment notifications.",
    text: "Webhooks are used by WaveCollect to notify your application when an event occurs in your account. Webhooks are particularly useful for asynchronous events like successful UPI settlements. We sign every payload to ensure security.",
    params: [
      { name: "X-PayxMint-Signature", type: "header", required: true, desc: "HMAC-SHA256 signature of the payload." }
    ],
    snippets: {
      CURL: `# WaveCollect POSTs this to your server:\n{\n  "id": "evt_123",\n  "type": "payment.success",\n  "data": { "status": "SUCCESS", "utr": "41234..." }\n}`,
      NODE: `// Verify signature in Node.js\nconst signature = req.headers['x-payxmint-signature'];\nconst isValid = WaveCollect.webhooks.constructEvent(payload, signature, endpointSecret);`,
      PYTHON: `event = wavecollect.Webhook.construct_event(\n    payload, sig_header, endpoint_secret\n)`,
      PHP: `<?php\n$event = \\WaveCollect\\Webhook::constructEvent(\n    $payload, $sigHeader, $endpointSecret\n);`
    }
  }
};

export default function DocsPage() {
  const [activeLang, setActiveLang] = useState<Language>('CURL');
  const [activeSection, setActiveSection] = useState('authentication');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = Object.keys(API_DOCS);
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* --- Sticky Header --- */}
      <header className="h-14 bg-white border-b border-slate-100 sticky top-0 z-[100] px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-all">W</div>
             <span className="font-bold text-slate-900 tracking-tight text-sm">WaveCollect <span className="text-slate-400 font-medium">API</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-md p-1">
             <button className="px-3 py-1 text-[11px] font-bold text-slate-900 bg-white shadow-sm rounded-md">Reference</button>
             <button className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-all">Guides</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-100 text-slate-400 group cursor-pointer">
              <Search size={14} />
              <span className="text-xs font-medium group-hover:text-slate-600">Search...</span>
              <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 rounded ml-4 font-sans font-bold">⌘K</kbd>
           </div>
           <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900">Sign In</Link>
           <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
           </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* --- Sidebar --- */}
        <aside className={`
          fixed lg:sticky top-14 left-0 bottom-0 w-64 bg-slate-50 border-r border-slate-100 z-[90] p-6 overflow-y-auto transition-transform
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Introduction</p>
              <div className="space-y-1">
                <SidebarLink id="authentication" label="Authentication" active={activeSection === "authentication"} onClick={scrollTo} />
                <SidebarLink id="errors" label="Errors" active={activeSection === "errors"} onClick={scrollTo} />
                <SidebarLink id="idempotency" label="Idempotency" active={activeSection === "idempotency"} onClick={scrollTo} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Intents</p>
              <div className="space-y-1">
                <SidebarLink id="createIntent" label="Create an Intent" active={activeSection === "createIntent"} onClick={scrollTo} />
                <SidebarLink id="retrieveIntent" label="Retrieve an Intent" active={activeSection === "retrieveIntent"} onClick={scrollTo} />
                <SidebarLink id="listIntents" label="List all Intents" active={activeSection === "listIntents"} onClick={scrollTo} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Webhooks</p>
              <div className="space-y-1">
                <SidebarLink id="webhooks" label="The Webhook Object" active={activeSection === "webhooks"} onClick={scrollTo} />
                <SidebarLink id="signatures" label="Verify Signatures" active={activeSection === "signatures"} onClick={scrollTo} />
              </div>
            </div>
          </div>
        </aside>

        {/* --- Content Area (Main + Code) --- */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Guide Section */}
          <div className="flex-1 max-w-3xl lg:max-w-none lg:w-1/2 p-6 md:p-12 lg:p-16 border-r border-slate-50">
             <div className="max-w-2xl mx-auto lg:mx-0">
                {/* --- Authentication --- */}
                <section id="authentication" className="mb-24 scroll-mt-24">
                  <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">{API_DOCS.authentication.title}</h1>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-8">{API_DOCS.authentication.text}</p>
                  <Callout text="Keep your secret keys safe! Never commit them to version control." />
                  <ParameterTable params={API_DOCS.authentication.params} />
                </section>

                {/* --- Create Intent --- */}
                <section id="createIntent" className="mb-24 scroll-mt-24">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded font-mono text-xs font-bold uppercase">Post</div>
                    <code className="text-slate-500 text-sm font-medium">/v1/create-intent</code>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{API_DOCS.createIntent.title}</h2>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-8">{API_DOCS.createIntent.text}</p>
                  <ParameterTable params={API_DOCS.createIntent.params} />
                  
                  <div className="mt-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
                     <h4 className="text-sm font-bold text-slate-900 mb-2">Returns</h4>
                     <p className="text-[13px] text-slate-500 leading-relaxed">Returns a <code className="text-blue-600 font-bold">payment_intent</code> object if successful. If an intent for the given <code>order_id</code> already exists, that existing intent is returned.</p>
                  </div>
                </section>

                {/* --- Webhooks --- */}
                <section id="webhooks" className="mb-24 scroll-mt-24">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{API_DOCS.webhooks.title}</h2>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-8">{API_DOCS.webhooks.text}</p>
                  <Callout text="Webhook endpoints must be accessible via HTTPS and respond with a 200 OK." />
                  <ParameterTable params={API_DOCS.webhooks.params} />
                </section>
             </div>
          </div>

          {/* Code Section (Fixed or Scrollable) */}
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
                    <div className="mb-8">
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sample Request</p>
                       {(API_DOCS as any)[activeSection]?.snippets && (
                         <CodeBlock 
                           snippets={(API_DOCS as any)[activeSection].snippets} 
                           activeLang={activeLang} 
                           onLangChange={setActiveLang} 
                         />
                       )}
                    </div>

                    <div className="mt-12">
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Sample Response</p>
                       <div className="rounded-xl bg-[#161B22] border border-white/5 p-5">
                          <pre className="text-[12px] font-mono leading-relaxed text-blue-300">
                             {JSON.stringify(RESPONSE_SAMPLES[activeSection] || { status: "success" }, null, 2)}
                          </pre>
                       </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

const Callout = ({ text }: { text: string }) => (
  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-8 rounded-r-md">
    <div className="flex gap-3">
      <Zap size={18} className="text-amber-500 shrink-0" />
      <p className="text-[13px] text-amber-900 font-medium leading-relaxed">{text}</p>
    </div>
  </div>
);

const RESPONSE_SAMPLES: any = {
  authentication: {
    id: "acct_12345",
    object: "account",
    name: "Onyx Merchants",
    email: "admin@onyx.com",
    status: "active"
  },
  createIntent: {
    id: "pi_123456789",
    object: "payment_intent",
    amount: 500.00,
    currency: "INR",
    status: "pending",
    order_id: "ORD-12345",
    checkout_url: "https://wavecollect.com/pay/tok_...",
    payment_token: "tok_65c3b...",
    metadata: { dept: "sales" },
    created: 1684245600
  },
  webhooks: {
    id: "evt_123456789",
    object: "event",
    type: "payment.success",
    data: {
      id: "pi_123456789",
      amount: 500.00,
      status: "SUCCESS",
      utr: "412345678901",
      metadata: { dept: "sales" }
    },
    created: 1684245605
  }
};
