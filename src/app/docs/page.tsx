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

        <aside className="w-72 border-r border-slate-200 hidden lg:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar bg-slate-50/50">
          <SidebarContent />
        </aside>

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
              </motion.div>
            )}

            {activeSection === "setup" && (
              <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Quick Setup</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Follow these three steps to activate your settlement nodes and start processing live traffic.
                </p>
                <div className="space-y-12">
                  <SetupStep num={1} title="Global Configuration">
                    Navigate to <span className="font-bold text-slate-900 italic bg-slate-100 px-2 py-0.5 rounded">Quick Setup</span> in your dashboard. Set your <strong>Success Redirect URL</strong> and <strong>Webhook Endpoint</strong>.
                  </SetupStep>
                  <SetupStep num={2} title="IP Infrastructure Whitelisting">
                    Submit your server IPs for auto-detection. Requests from unauthorized infrastructure will be rejected.
                  </SetupStep>
                  <SetupStep num={3} title="Node Deployment">
                    Link at least one GPay Business account. The system routes payment intents based on node availability.
                  </SetupStep>
                </div>
              </motion.div>
            )}

            {activeSection === "checkout" && (
              <motion.div key="checkout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Custom Checkout</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Learn how to leverage our raw protocol data to build a fully white-labeled checkout experience.
                </p>

                <div className="space-y-20">
                  {/* ⚡ Live Previews Section */}
                  <section>
                    <SectionHeading id="previews">Visual Previews</SectionHeading>
                    <p className="text-slate-600 mb-8 text-sm md:text-base font-medium">Compare the hosted vs. custom integration styles across devices.</p>
                    
                    <div className="grid gap-8">
                      {/* Hosted Preview */}
                      <div className="border border-slate-200 rounded-[32px] overflow-hidden bg-slate-50 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hosted Checkout (Desktop View)</span>
                          <Globe size={14} className="text-slate-400" />
                        </div>
                        <div className="p-8 md:p-12">
                          <div className="flex bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-w-4xl mx-auto min-h-[300px]">
                            <div className="flex-1 bg-slate-50 p-8 border-r border-slate-100 hidden md:block">
                              <div className="w-8 h-8 bg-slate-900 rounded-lg mb-6 flex items-center justify-center text-white text-[10px] font-bold">W</div>
                              <h4 className="text-3xl font-black mb-2 text-slate-900">₹500.00</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reference: #ORD_12345</p>
                            </div>
                            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                              <div className="w-24 h-24 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 flex items-center justify-center text-slate-300 font-black text-[10px]">QR CODE</div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan to Pay</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Custom Preview */}
                      <div className="border border-slate-200 rounded-[32px] overflow-hidden bg-slate-50 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Integration (Mobile Card)</span>
                          <Smartphone size={14} className="text-slate-400" />
                        </div>
                        <div className="p-8 flex justify-center">
                          <div className="w-full max-w-[320px] bg-white rounded-[28px] shadow-2xl p-6 border border-slate-100 text-center">
                             <div className="flex items-center gap-3 mb-6 text-left">
                               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">P</div>
                               <div>
                                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Pay Merchant</p>
                                 <p className="text-[10px] text-slate-500 font-bold">₹500.00</p>
                               </div>
                             </div>
                             <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl mx-auto mb-6 flex items-center justify-center text-slate-200 text-[10px] font-bold">QR</div>
                             <div className="space-y-3">
                               <div className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer">Open PhonePe</div>
                               <div className="w-full py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer">Open GPay</div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionHeading id="code-template">Functional Code Template</SectionHeading>
                    <p className="text-slate-600 mb-6 text-sm md:text-base font-medium">
                      Copy this complete React implementation. It includes built-in polling, copy-to-clipboard logic, and a responsive Stripe-style UI.
                    </p>
                    <Callout type="success" title="Copy-Paste Ready">
                      This component requires <code>qrcode.react</code> and <code>lucide-react</code>. Pass the <code>intent</code> object from your backend to initiate.
                    </Callout>
                    <CodeBlock snippets={{
                      REACT: `"use client";
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // npm install qrcode.react
import { Copy, Check, ShieldCheck, Smartphone } from 'lucide-react';

/**
 * PayxMint Custom Checkout Component
 * @param {object} intent - The data from /api/v1/create-intent
 */
export default function Checkout({ intent }) {
  const [status, setStatus] = useState('PENDING');
  const [copied, setCopied] = useState(false);

  // Status Polling (8s interval)
  useEffect(() => {
    if (status !== 'PENDING') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(\`https://api.payxmint.com/api/v1/check-status?token=\${intent.payment_token}\`);
        const data = await res.json();
        if (data.status === 'success' && data.data.payment_status === 'SUCCESS') {
          setStatus('SUCCESS');
          clearInterval(interval);
        }
      } catch (e) { console.error(e); }
    }, 8000);
    return () => clearInterval(interval);
  }, [status, intent.payment_token]);

  const copyUpi = () => {
    navigator.clipboard.writeText(intent.upi_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'SUCCESS') return <SuccessView />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* 📦 Desktop Summary (Left Side) */}
      <div className="flex-1 p-8 md:p-16 border-r border-slate-200 hidden md:flex flex-col items-end">
        <div className="w-full max-w-sm">
          <div className="w-10 h-10 bg-slate-900 rounded-xl mb-8 flex items-center justify-center text-white font-black italic">W</div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Merchant Name</p>
          <h1 className="text-5xl font-black mb-12">₹{intent.amount.toFixed(2)}</h1>
          <div className="space-y-4 border-t border-slate-200 pt-8 text-sm">
             <div className="flex justify-between"><span className="text-slate-400">Order ID</span><span>{intent.order_id}</span></div>
          </div>
        </div>
      </div>

      {/* 💳 Payment Section (PC + Mobile) */}
      <div className="flex-1 bg-white p-6 md:p-16 flex flex-col items-start justify-center">
        <div className="w-full max-w-sm mx-auto md:mx-0">
          <h2 className="text-2xl font-black mb-8">Pay with UPI</h2>
          
          <div className="p-4 border border-slate-100 rounded-[32px] shadow-2xl mb-8 inline-block bg-white">
            <QRCodeSVG value={intent.upi_link} size={200} />
          </div>

          <div className="w-full space-y-4">
            <button onClick={copyUpi} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">UPI Link</span>
               <span className="text-xs font-bold text-blue-600">{copied ? <Check size={14}/> : 'COPY LINK'}</span>
            </button>
            <a href={intent.upi_link} className="block w-full py-5 bg-blue-600 text-white rounded-2xl text-center font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
              Open UPI Apps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const SuccessView = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">✓</div>
    <h2 className="text-3xl font-black mb-2">Payment Received</h2>
    <p className="text-slate-500 font-medium">Your transaction has been verified successfully.</p>
  </div>
);`
                    }} />
                  </section>

                  <section>
                    <SectionHeading id="design-logic">Hybrid Design Philosophy</SectionHeading>
                    <p className="text-slate-600 mb-8 leading-7 text-sm md:text-base">
                      PayxMint checkouts automatically switch between two distinct UI behaviors based on the device detected.
                    </p>
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="p-8 border border-slate-200 rounded-3xl bg-white shadow-sm">
                          <Smartphone className="text-blue-600 mb-4" />
                          <h4 className="font-black mb-2">The Mobile Card</h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                            On Android and iOS, the UI collapses into a centralized card. This is optimized for thumb-reach and triggers the OS Intent Picker.
                          </p>
                          <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">Best for Conversion</span>
                       </div>
                       <div className="p-8 border border-slate-200 rounded-3xl bg-white shadow-sm">
                          <Globe className="text-emerald-600 mb-4" />
                          <h4 className="font-black mb-2">The Desktop Split</h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                            On browsers, the UI splits into a dual-column "Stripe-style" layout. This uses the extra space to display rich order details.
                          </p>
                          <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">Premium Aesthetic</span>
                       </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {activeSection === "webhooks" && (
              <motion.div key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Webhooks</h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  Receive real-time settlement notifications confirmed by our GPay bot engine.
                </p>
                <SectionHeading id="payload">Success Payload</SectionHeading>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-sm text-emerald-400 overflow-x-auto shadow-xl">
                  {`{
  "event": "payment.success",
  "order_id": "ORD_12345",
  "amount": 500.00,
  "utr": "412239102931",
  "timestamp": "2026-05-16T12:00:00Z"
}`}
                </div>
                <SectionHeading id="signature">Verifying Signatures</SectionHeading>
                <p className="text-slate-600 mb-6 text-sm md:text-base">
                  We sign all payloads using HMAC-SHA256. The signature is in the <code>X-PayxMint-Signature</code> header.
                </p>
                <CodeBlock snippets={snippets.webhookVerify} />
              </motion.div>
            )}

            {activeSection === "errors" && (
              <motion.div key="errors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Error Codes</h1>
                <Table 
                  headers={["Status", "Meaning", "Action"]}
                  rows={[
                    [<span className="font-bold text-rose-600">401</span>, "Invalid API Key", "Check Dashboard"],
                    [<span className="font-bold text-amber-600">403</span>, "IP Restricted", "Whitelist your IP"],
                    [<span className="font-bold text-rose-600">503</span>, "No Active Node", "Check GPay Bot Status"]
                  ]}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-24 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
             <p className="text-[11px] font-bold uppercase tracking-widest">© 2026 PayxMint Developers</p>
             <div className="flex gap-6">
                <Link href="/dashboard" className="text-[11px] font-black hover:text-blue-600 transition-colors uppercase tracking-widest">Dashboard</Link>
                <a href="mailto:support@payxmint.com" className="text-[11px] font-black hover:text-blue-600 transition-colors uppercase tracking-widest">Support</a>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

const SetupStep = ({ num, title, children }: any) => (
  <div className="flex gap-6">
    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-blue-600/20">{num}</div>
    <div className="space-y-2 pt-2">
      <h4 className="text-xl font-bold text-slate-900">{title}</h4>
      <div className="text-sm text-slate-500 font-medium leading-relaxed">{children}</div>
    </div>
  </div>
);

const PhaseCard = ({ num, title, desc }: any) => (
  <div className="p-6 border border-slate-200 rounded-3xl bg-white space-y-4 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">{num}</div>
    <div className="space-y-2">
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);
