"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Book, 
  Terminal, 
  Settings, 
  CreditCard, 
  Webhook as WebhookIcon, 
  Copy, 
  Check, 
  Info, 
  AlertCircle, 
  ChevronRight, 
  Search,
  Code,
  Smartphone,
  Globe,
  Database,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Activity,
  Menu,
  X,
  Shield,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---

const SidebarLink = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
      active 
        ? "bg-blue-50 text-blue-600 font-bold" 
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    {label}
  </button>
);

const SectionHeading = ({ children, id }: any) => (
  <h2 id={id} className="text-2xl font-bold text-slate-900 mt-12 mb-6 group flex items-center gap-2">
    {children}
    <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">#</a>
  </h2>
);

const SubHeading = ({ children, id }: any) => (
  <h3 id={id} className="text-lg font-bold text-slate-800 mt-8 mb-4 group flex items-center gap-2">
    {children}
    <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">#</a>
  </h3>
);

const Callout = ({ type = "info", title, children }: any) => {
  const styles: any = {
    info: { bg: "bg-blue-50/50", border: "border-blue-100", text: "text-blue-900", icon: <Info className="text-blue-500" size={18} /> },
    warning: { bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-900", icon: <AlertCircle className="text-amber-500" size={18} /> },
    success: { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-900", icon: <Check className="text-emerald-500" size={18} /> }
  };
  const s = styles[type];
  return (
    <div className={`${s.bg} border ${s.border} rounded-2xl p-4 my-6 flex gap-3 shadow-sm`}>
      <div className="mt-0.5">{s.icon}</div>
      <div>
        {title && <div className={`text-sm font-bold ${s.text} mb-1`}>{title}</div>}
        <div className="text-sm leading-relaxed text-slate-600 font-medium">{children}</div>
      </div>
    </div>
  );
};

const CodeBlock = ({ snippets }: any) => {
  const [lang, setLang] = useState(Object.keys(snippets)[0] || "NODE");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden my-6 bg-slate-950 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/10 backdrop-blur-md">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {Object.keys(snippets).map(l => (
            <button 
              key={l}
              onClick={() => setLang(l)}
              className={`text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap py-1 ${
                lang === l ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={copy} className="text-slate-400 hover:text-white transition-colors p-1.5 bg-white/5 rounded-md active:scale-95">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-5 overflow-x-auto">
        <pre className="text-[13px] font-mono leading-relaxed text-slate-300">
          {snippets[lang]}
        </pre>
      </div>
    </div>
  );
};

const Table = ({ headers, rows }: any) => (
  <div className="my-6 border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
    <table className="w-full text-left border-collapse bg-white whitespace-nowrap md:whitespace-normal">
      <thead className="bg-slate-50">
        <tr>
          {headers.map((h: any, i: number) => (
            <th key={i} className="px-4 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row: any, i: number) => (
          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
            {row.map((cell: any, j: number) => (
              <td key={j} className="px-4 py-4 text-sm text-slate-600 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

// --- Main Page ---

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when section changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  // Navigation Data
  const navigation = [
    { 
      group: "Foundation", 
      items: [
        { id: "overview", label: "Introduction", icon: Globe },
        { id: "setup", label: "Quick Setup", icon: Zap },
        { id: "auth", label: "Authentication", icon: Shield },
      ]
    },
    { 
      group: "API Reference", 
      items: [
        { id: "intent", label: "Create Intent", icon: Code },
        { id: "checkout", label: "Custom Checkout", icon: Terminal },
        { id: "webhooks", label: "Webhooks", icon: FileText },
      ]
    },
    { 
      group: "Resources", 
      items: [
        { id: "testing", label: "Testing & Sandbox", icon: Activity },
        { id: "errors", label: "Error Codes", icon: AlertCircle },
      ]
    }
  ];

  // Code Snippets
  const snippets: any = {
    intent: {
      NODE: `const axios = require('axios');

const response = await axios.post('https://payxmint.com/api/v1/create-intent', {
  amount: 500.00,
  order_id: "ORD_12345",
  customer_mobile: "9988776655",
  redirect_url: "https://yoursite.com/done"
}, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});`,
      PHP: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://payxmint.com/api/v1/create-intent",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode([
    "amount" => 500.00,
    "order_id" => "ORD_12345"
  ]),
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_API_KEY",
    "Content-Type: application/json"
  ],
]);`,
      PYTHON: `import requests

url = "https://payxmint.com/api/v1/create-intent"
payload = {
    "amount": 500.00,
    "order_id": "ORD_12345"
}
response = requests.post(url, json=payload, headers={
    "Authorization": "Bearer YOUR_API_KEY"
})`
    },
    webhookVerify: {
      NODE: `const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return hash === signature;
}`,
      PHP: `<?php
function verifyWebhook($payload, $signature, $secret) {
  $hash = hash_hmac('sha256', json_encode($payload), $secret);
  return hash_equals($hash, $signature);
}`,
      PYTHON: `import hmac
import hashlib
import json

def verify_webhook(payload, signature, secret):
    payload_str = json.dumps(payload, separators=(',', ':'))
    expected_hash = hmac.new(
        secret.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_hash, signature)`
    }
  };

  const SidebarContent = () => (
    <div className="p-6 space-y-8">
      <div className="relative group">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input 
          placeholder="Search docs... (⌘K)" 
          className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 focus:bg-blue-50 focus:ring-2 focus:ring-blue-600/20 transition-all outline-none placeholder:font-medium placeholder:text-slate-500"
        />
      </div>

      <nav className="space-y-8">
        {navigation.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">{group.group}</p>
            <div className="space-y-1">
              {group.items.map(item => (
                <SidebarLink 
                  key={item.id}
                  {...item}
                  active={activeSection === item.id}
                  onClick={setActiveSection}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Hamburger */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
          
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-slate-900 group-hover:bg-blue-600 transition-colors rounded-lg flex items-center justify-center text-white font-black shadow-md">W</div>
            <span className="font-black text-slate-900 tracking-tight hidden md:block text-lg">PayxMint <span className="text-blue-600">Docs</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 ml-4">
            <Link href="/" className="text-[11px] font-black text-slate-500 hover:text-blue-600 transition-all uppercase tracking-widest">Home</Link>
            <Link href="/login" className="text-[11px] font-black text-slate-500 hover:text-blue-600 transition-all uppercase tracking-widest">Dashboard</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
            Log In
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex w-full relative">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/60 z-[60] lg:hidden backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] lg:hidden border-r border-slate-200 overflow-y-auto flex flex-col shadow-2xl"
              >
                <div className="p-4 flex items-center justify-between border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                      <Code size={18} />
                    </div>
                    <span className="font-black tracking-tight">Documentation</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <SidebarContent />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="w-72 border-r border-slate-200 hidden lg:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar bg-slate-50/50">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl px-4 py-8 md:px-12 md:py-16 mx-auto min-w-0 w-full">
          <AnimatePresence mode="wait">
            
            {activeSection === "overview" && (
              <motion.div 
                key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="prose prose-slate max-w-none"
              >
                <div className="mb-12">
                   <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full w-fit border border-blue-100 mb-6">
                     <Zap size={14} className="fill-blue-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Version 2.4 Live</span>
                   </div>
                   <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">API Overview</h1>
                   <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium">
                     Build real-time UPI settlement into your applications with our high-fidelity dual-engine gateway.
                   </p>
                </div>

                <SectionHeading id="architecture">Gateway Architecture</SectionHeading>
                <p className="text-slate-600 leading-7 text-sm md:text-base">
                  PayxMint operates as a layer-2 settlement protocol over GPay. Unlike traditional gateways that rely on slow bank reconciliations, our bot nodes match UTRs (Unique Transaction References) in real-time, providing immediate settlement feedback via signed webhooks.
                </p>

                <div className="grid md:grid-cols-2 gap-6 my-10">
                  <div className="p-6 md:p-8 border border-slate-200 rounded-3xl bg-slate-50 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 mb-6 shadow-sm">
                      <Globe className="text-blue-600" size={24} />
                    </div>
                    <h4 className="font-black text-slate-900 mb-2 flex items-center gap-2 text-lg">Hosted Checkout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-blue-600"/></h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Zero-code UI for merchants. Perfect for web stores and SaaS billing.</p>
                  </div>
                  <div className="p-6 md:p-8 border border-slate-200 rounded-3xl bg-slate-50 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 mb-6 shadow-sm">
                      <Smartphone className="text-emerald-600" size={24} />
                    </div>
                    <h4 className="font-black text-slate-900 mb-2 flex items-center gap-2 text-lg">Native Integration <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-emerald-600"/></h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Use raw UPI deep-links natively inside your iOS, Android, or React Native app.</p>
                  </div>
                </div>

                <Callout type="info" title="3-Day Free Trial">
                  New accounts automatically receive a 3-day free period with no wallet recharge required. Settlement fees will be waived during this time.
                </Callout>
              </motion.div>
            )}

            {activeSection === "setup" && (
              <motion.div 
                key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Quick Setup</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Follow these three steps to activate your settlement nodes and start processing live traffic.
                </p>

                <div className="space-y-12">
                  <SetupStep num={1} title="Global Configuration">
                    Navigate to <span className="font-bold text-slate-900 italic bg-slate-100 px-2 py-0.5 rounded">Quick Setup</span> in your dashboard. Set your <strong>Success Redirect URL</strong> and <strong>Webhook Endpoint</strong>. These are the backbones of your integration.
                  </SetupStep>
                  <SetupStep num={2} title="IP Infrastructure Whitelisting">
                    Submit your server IPs for auto-detection. Our engine uses a <strong>Strict Firewall Policy</strong>—requests from unauthorized infrastructure will be rejected with a 403 response.
                  </SetupStep>
                  <SetupStep num={3} title="Node Deployment">
                    Link at least one GPay Business account. The system routes payment intents based on node availability and remaining account limits.
                  </SetupStep>
                </div>

                <Callout type="warning" title="Security Requirement">
                  Do not attempt to add Google Pay accounts before whitelisting your server IPs. The bot nodes require verified network handshakes to initialize correctly.
                </Callout>
              </motion.div>
            )}

            {activeSection === "auth" && (
              <motion.div 
                key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Authentication</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Secure your API requests using high-entropy Bearer tokens.
                </p>

                <SectionHeading id="api-keys">API Keys</SectionHeading>
                <p className="text-slate-600 leading-7 text-sm md:text-base mb-6">
                  You authenticate to the PayxMint API by providing your secret API key in the request header. You can manage your API keys from the Dashboard under <strong>API Access Control</strong>.
                </p>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-sm text-slate-300 overflow-x-auto shadow-xl">
                  Authorization: Bearer <span className="text-blue-400">YOUR_API_KEY</span>
                </div>

                <Callout type="warning" title="Keep it secret">
                  Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
                </Callout>

                <SectionHeading id="postman">Postman Collection</SectionHeading>
                <p className="text-slate-600 leading-7 text-sm md:text-base mb-6">
                  To test our API instantly, you can import our Postman Collection.
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black text-xl shadow-inner border border-orange-200">P</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">PayxMint API v2.4</h4>
                      <p className="text-sm text-slate-500 font-medium mt-1">Includes Create Intent, Check Status, and Environment Variables.</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20">Download Collection</button>
                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Environment File</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "intent" && (
              <motion.div 
                key="intent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Create Intent</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-10">
                  Create a payment intent to initiate a transaction. This returns a hosted checkout URL and raw UPI deep-links.
                </p>

                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-xl w-fit mb-8 border border-blue-100 shadow-sm">
                  <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest bg-white px-2 py-1 rounded shadow-sm">POST</span>
                  <code className="text-sm font-bold text-slate-700">/api/v1/create-intent</code>
                </div>

                <CodeBlock snippets={snippets.intent} />

                <SectionHeading id="params">Request Body Parameters</SectionHeading>
                <Table 
                  headers={["Field", "Type", "Required", "Description"]}
                  rows={[
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">amount</code>, "float", "YES", "Transaction value (e.g. 10.00)"],
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">order_id</code>, "string", "YES", "Unique ID from your system (3-64 chars)"],
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">customer_mobile</code>, "string", "NO", "10-digit mobile for SMS tracking"],
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">redirect_url</code>, "string", "NO", "Optional success override"]
                  ]}
                />

                <SectionHeading id="response">Response Schema</SectionHeading>
                <Table 
                  headers={["Field", "Type", "Description"]}
                  rows={[
                    [<code className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">checkout_url</code>, "string", "URL for the hosted payment page"],
                    [<code className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">upi_link</code>, "string", "Raw deep-link for Mobile Intent Picker"],
                    [<code className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">qr_data</code>, "string", "String for custom QR generation"]
                  ]}
                />
              </motion.div>
            )}

            {activeSection === "checkout" && (
              <motion.div 
                key="checkout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Custom Checkout</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Learn how to leverage our raw protocol data to build a fully white-labeled checkout experience within your own platform.
                </p>

                <div className="space-y-16">
                  <section>
                    <SectionHeading id="integration-phases">Integration Workflow</SectionHeading>
                    <p className="text-slate-600 mb-8 leading-7 text-sm md:text-base">
                      A custom checkout implementation follows a three-phase lifecycle. This ensures that sensitive logic remains server-side while providing a low-latency UI for the customer.
                    </p>

                    <div className="grid gap-6 md:grid-cols-3">
                      <PhaseCard 
                        num="1" 
                        title="Server Handshake" 
                        desc="Your backend calls /create-intent using your API Key to secure a payment token." 
                      />
                      <PhaseCard 
                        num="2" 
                        title="Dynamic Rendering" 
                        desc="Pass the upi_link and qr_data to your frontend to render the payment UI." 
                      />
                      <PhaseCard 
                        num="3" 
                        title="Status Sync" 
                        desc="Your frontend polls our status API while your backend listens for webhooks." 
                      />
                    </div>
                  </section>

                  <section>
                    <SectionHeading id="code-template">Stripe-style Code Template</SectionHeading>
                    <p className="text-slate-600 mb-6 text-sm md:text-base">
                      Use this production-ready React component as a base for your checkout page. It is optimized for mobile screens and features a minimal, premium aesthetic.
                    </p>
                    <CodeBlock snippets={{
                      REACT: `"use client";
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

export default function CustomCheckout({ intent }) {
  const [status, setStatus] = useState('PENDING');

  // 🔄 Poll for payment status
  useEffect(() => {
    if (status !== 'PENDING') return;
    const interval = setInterval(async () => {
      const res = await fetch(\`/api/v1/check-status?token=\${intent.payment_token}\`);
      const data = await res.json();
      if (data.status === 'SUCCESS') setStatus('SUCCESS');
    }, 8000); // 8s polling
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'SUCCESS') return <SuccessView />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* 📦 Order Summary (Left/Top) */}
      <div className="flex-1 p-8 md:p-16 border-r border-slate-200">
        <h3 className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4">Merchant Name</h3>
        <h1 className="text-4xl font-black text-slate-900 mb-8">₹{intent.amount}</h1>
        <div className="space-y-4 border-t border-slate-200 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Order ID</span>
            <span className="font-bold text-slate-900">{intent.order_id}</span>
          </div>
        </div>
      </div>

      {/* 💳 Payment Section (Right/Bottom) */}
      <div className="flex-1 bg-white p-8 md:p-16 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-8 self-start">Pay with UPI</h2>
        <div className="p-4 border border-slate-100 rounded-3xl shadow-xl mb-8">
          <QRCode value={intent.upi_link} size={200} />
        </div>
        <p className="text-sm text-slate-500 font-medium mb-8">Scan QR or use a UPI app below</p>
        
        {/* Mobile Intent Buttons */}
        <div className="w-full flex gap-3">
          <a href={intent.upi_link} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-center font-black text-xs uppercase tracking-widest">
            Open UPI Apps
          </a>
        </div>
      </div>
    </div>
  );
}`,
                      HTML: `<!-- Native Mobile Script -->
<script>
  function openUPI() {
    window.location.href = intent.upi_link;
  }
  
  // High-performance status polling
  setInterval(async () => {
    const r = await fetch('/api/v1/check-status?token=' + intent.token);
    const d = await r.json();
    if(d.status === 'SUCCESS') window.location.href = '/success';
  }, 8000);
</script>`
                    }} />
                  </section>

                  <section>
                    <SubHeading id="response-data">Intent Response Data</SubHeading>
                    <p className="text-slate-600 mb-6 text-sm md:text-base">When you create an intent, our engine returns a payload rich with metadata for your custom UI.</p>
                    <Table 
                      headers={["Key", "Description", "Usage"]}
                      rows={[
                        [<code className="text-blue-600 font-bold">payment_token</code>, "Unique session token", "Poll transaction status"],
                        [<code className="text-blue-600 font-bold">upi_link</code>, "Raw RFC-compliant URI", "Intent trigger for apps"],
                        [<code className="text-blue-600 font-bold">qr_data</code>, "QR generation string", "Input for QR libraries"],
                        [<code className="text-blue-600 font-bold">checkout_url</code>, "Hosted page URL", "Fallback for non-technical users"]
                      ]}
                    />
                  </section>

                  <section>
                    <SubHeading id="native">Mobile App Implementation</SubHeading>
                    <p className="text-slate-600 mb-4 text-sm md:text-base">For the best conversion rates on mobile, trigger the system Intent Picker. This allows users to pay via their preferred UPI app (GPay, PhonePe, etc.) without leaving your environment.</p>
                    <div className="p-5 md:p-6 bg-slate-950 rounded-2xl font-mono text-[13px] text-blue-300 shadow-xl border border-slate-800 overflow-x-auto">
                      {`// Example for React Native / Expo
import { Linking } from 'react-native';

const handlePay = async (upiLink) => {
  const supported = await Linking.canOpenURL(upiLink);
  if (supported) {
    await Linking.openURL(upiLink);
  }
};`}
                    </div>
                  </section>

                  <section>
                    <SectionHeading id="limits">API Limits & Routing</SectionHeading>
                    <p className="text-slate-600 mb-6 text-sm md:text-base">
                      Each Google Pay account has individual limits enforced by our Gateway Router. If an account hits its daily or monthly limit, it is automatically rotated out of the active pool.
                    </p>
                    <Table 
                      headers={["Limit Type", "Behavior", "Recovery"]}
                      rows={[
                        ["Daily Limit", "Max volume per 24 hours per VPA", "Resets at 12:00 AM IST"],
                        ["Monthly Limit", "Max aggregate volume per month", "Resets on the 1st of every month"],
                        ["Ticket Range", "Min/Max allowed transaction size", "Adjustable in Account Settings"]
                      ]}
                    />
                    <Callout type="info" title="Routing Logic">
                      Our engine automatically selects the healthiest node with the lowest current daily usage to ensure high success rates and balance the load across your VPAs.
                    </Callout>
                  </section>

                  <Callout type="warning" title="Protocol Safety">
                    Always ensure your server-side API Key is <strong>NEVER</strong> exposed to the frontend. Custom checkouts must only interact with the public <code>check-status</code> API using the session token.
                  </Callout>
                </div>
              </motion.div>
            )}

            {activeSection === "webhooks" && (
              <motion.div 
                key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Webhooks</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Receive real-time settlement notifications as soon as UTR matching is confirmed.
                </p>

                <SectionHeading id="payload">Success Payload</SectionHeading>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-sm text-emerald-400 overflow-x-auto shadow-xl">
                  {'{'}<br/>
                  &nbsp;&nbsp;"event": "payment.success",<br/>
                  &nbsp;&nbsp;"order_id": "YOUR_REF_123",<br/>
                  &nbsp;&nbsp;"amount": 500.00,<br/>
                  &nbsp;&nbsp;"utr": "412239102931",<br/>
                  &nbsp;&nbsp;"timestamp": "2024-05-04T12:00:00Z"<br/>
                  {'}'}
                </div>

                <SectionHeading id="retries">Retry Strategy</SectionHeading>
                <p className="text-slate-600 mb-6 text-sm md:text-base">
                  If your endpoint does not return a <code>200 OK</code> status, we will retry the notification 5 times over 1 hour with exponential backoff.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <ShieldCheck className="text-blue-500" size={20} />
                     <span className="font-bold text-sm">Secure Signed Traffic</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <Activity className="text-emerald-500" size={20} />
                     <span className="font-bold text-sm">99.9% Delivery Guarantee</span>
                  </div>
                </div>

                <SectionHeading id="signature">Verifying Signatures</SectionHeading>
                <p className="text-slate-600 leading-7 text-sm md:text-base mb-6">
                  We use HMAC-SHA256 to sign all webhook payloads. The signature is sent in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">X-PayxMint-Signature</code> header.
                  You should compute the HMAC hash of the raw request body using your <strong>Webhook Secret</strong> and compare it to the signature.
                </p>

                <CodeBlock snippets={snippets.webhookVerify} />
              </motion.div>
            )}
            {activeSection === "testing" && (
              <motion.div 
                key="testing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Testing & Sandbox</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Learn how to safely test your integration without moving real money.
                </p>

                <SectionHeading id="test-mode">Sandbox Mode</SectionHeading>
                <p className="text-slate-600 leading-7 text-sm md:text-base mb-6">
                  Every PayxMint account includes a Sandbox mode. While in Sandbox mode, you can use our test UPI numbers to simulate successful payments, failed payments, and webhooks.
                </p>

                <Table 
                  headers={["Scenario", "Test UTR Number", "Expected Outcome"]}
                  rows={[
                    [<code className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">SUCCESS_123</code>, "Simulate successful payment", "Fires SUCCESS webhook"],
                    [<code className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">FAIL_456</code>, "Simulate failed payment", "Fires FAILED webhook"],
                    [<code className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">DELAY_789</code>, "Simulate delayed bank network", "Fires SUCCESS after 60 seconds"]
                  ]}
                />

                <Callout type="warning" title="Test Environment Restrictions">
                  Sandbox intents cannot be accessed from the live network. Only API keys generated in the Sandbox environment can trigger these test UTRs.
                </Callout>
              </motion.div>
            )}

            {activeSection === "errors" && (
              <motion.div 
                key="errors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Error Codes</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  A comprehensive list of HTTP status codes and PayxMint custom error codes.
                </p>

                <SectionHeading id="http-status">HTTP Status Codes</SectionHeading>
                <Table 
                  headers={["Status Code", "Description"]}
                  rows={[
                    [<span className="font-bold text-emerald-600">200 - OK</span>, "Everything worked as expected."],
                    [<span className="font-bold text-amber-600">400 - Bad Request</span>, "The request was unacceptable, often due to missing a required parameter."],
                    [<span className="font-bold text-rose-600">401 - Unauthorized</span>, "No valid API key provided."],
                    [<span className="font-bold text-rose-600">403 - Forbidden</span>, "The API key doesn't have permissions to perform the request (e.g., IP not whitelisted)."],
                    [<span className="font-bold text-amber-600">429 - Too Many Requests</span>, "Too many requests hit the API too quickly. We recommend an exponential backoff of your requests."],
                    [<span className="font-bold text-rose-600">500, 502, 503, 504 - Server Errors</span>, "Something went wrong on PayxMint's end."]
                  ]}
                />

                <SectionHeading id="custom-errors">Custom Error Codes</SectionHeading>
                <Table 
                  headers={["Error Code", "Meaning"]}
                  rows={[
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">invalid_api_key</code>, "The API key provided is invalid or disabled."],
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">ip_not_whitelisted</code>, "Your server's IP address is not whitelisted in the dashboard."],
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">insufficient_wallet_balance</code>, "Your wallet balance is too low to cover the settlement fee for this transaction."],
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">duplicate_order_id</code>, "An intent with this order_id has already been created."],
                    [<code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">node_unavailable</code>, "No verified GPay nodes are currently active for your account."]
                  ]}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer inside content area */}
          <div className="mt-24 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
             <p className="text-[11px] font-bold uppercase tracking-widest">© 2026 PayxMint Developers</p>
             <div className="flex gap-6">
                <Link href="/dashboard" className="text-[11px] font-black hover:text-blue-600 transition-colors uppercase tracking-widest">Dashboard</Link>
                <a href="mailto:support@payxmint.com" className="text-[11px] font-black hover:text-blue-600 transition-colors uppercase tracking-widest">Support</a>
             </div>
          </div>
        </main>

        {/* Right TOC Sidebar (Desktop Only) */}
        <aside className="w-64 p-8 hidden xl:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">On this page</h4>
          <ul className="space-y-4 border-l-2 border-slate-100 pl-4">
            {activeSection === "overview" && (
               <>
                 <li><a href="#architecture" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Architecture</a></li>
               </>
             )}
             {activeSection === "setup" && (
               <>
                 <li><a href="#setup" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">3-Step Setup</a></li>
               </>
             )}
             {activeSection === "auth" && (
               <>
                 <li><a href="#api-keys" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">API Keys</a></li>
                 <li><a href="#postman" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Postman Collection</a></li>
               </>
             )}
             {activeSection === "intent" && (
               <>
                 <li><a href="#params" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Request Params</a></li>
                 <li><a href="#response" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Response Schema</a></li>
               </>
             )}
             {activeSection === "checkout" && (
               <>
                 <li><a href="#integration-phases" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Workflow</a></li>
                 <li><a href="#native" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Mobile Integration</a></li>
               </>
             )}
             {activeSection === "webhooks" && (
               <>
                 <li><a href="#payload" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Payload Structure</a></li>
                 <li><a href="#retries" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Retry Strategy</a></li>
                 <li><a href="#signature" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Verifying Signatures</a></li>
               </>
             )}
             {activeSection === "testing" && (
               <>
                 <li><a href="#test-mode" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Sandbox Mode</a></li>
               </>
             )}
             {activeSection === "errors" && (
               <>
                 <li><a href="#http-status" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">HTTP Status Codes</a></li>
                 <li><a href="#custom-errors" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Custom Errors</a></li>
               </>
             )}
          </ul>
        </aside>
      </div>
    </div>
  );
}

const SetupStep = ({ num, title, children }: any) => (
  <div className="flex gap-4 md:gap-6">
    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-base shrink-0 shadow-lg shadow-blue-600/20">
      {num}
    </div>
    <div className="space-y-2 pt-1 md:pt-2">
      <h4 className="text-lg md:text-xl font-bold text-slate-900">{title}</h4>
      <div className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">
        {children}
      </div>
    </div>
  </div>
);

const PhaseCard = ({ num, title, desc }: any) => (
  <div className="p-6 border border-slate-200 rounded-3xl bg-white space-y-4 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">{num}</div>
    <div className="space-y-2">
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);
