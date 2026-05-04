"use client";

import React, { useState, useEffect } from "react";
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
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---

const SidebarLink = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
      active 
        ? "bg-blue-50 text-blue-600 font-semibold" 
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
    }`}
  >
    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
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
    <div className={`${s.bg} border ${s.border} rounded-xl p-4 my-6 flex gap-3`}>
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
    <div className="rounded-xl border border-slate-200 overflow-hidden my-6 bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-white/5">
        <div className="flex gap-4">
          {Object.keys(snippets).map(l => (
            <button 
              key={l}
              onClick={() => setLang(l)}
              className={`text-[11px] font-bold uppercase tracking-wider transition-all ${
                lang === l ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
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
      <div className="p-5 overflow-x-auto">
        <pre className="text-[13px] font-mono leading-relaxed text-slate-300">
          {snippets[lang]}
        </pre>
      </div>
    </div>
  );
};

const Table = ({ headers, rows }: any) => (
  <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
    <table className="w-full text-left border-collapse bg-white">
      <thead className="bg-slate-50">
        <tr>
          {headers.map((h: any, i: number) => (
            <th key={i} className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row: any, i: number) => (
          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
            {row.map((cell: any, j: number) => (
              <td key={j} className="px-4 py-3.5 text-sm text-slate-600 align-top">
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

  // Navigation Data
  const navigation = [
    { 
      group: "Foundation", 
      items: [
        { id: "overview", label: "Introduction", icon: Book },
        { id: "setup", label: "Quick Setup", icon: Settings },
      ]
    },
    { 
      group: "API Reference", 
      items: [
        { id: "intent", label: "Create Intent", icon: Terminal },
        { id: "checkout", label: "Custom Checkout", icon: CreditCard },
        { id: "webhooks", label: "Webhooks", icon: WebhookIcon },
      ]
    }
  ];

  // Code Snippets
  const snippets: any = {
    intent: {
      NODE: `const axios = require('axios');

const response = await axios.post('https://payxmint.com/v1/create-intent', {
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
  CURLOPT_URL => "https://payxmint.com/v1/create-intent",
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

url = "https://payxmint.com/v1/create-intent"
payload = {
    "amount": 500.00,
    "order_id": "ORD_12345"
}
response = requests.post(url, json=payload, headers={
    "Authorization": "Bearer YOUR_API_KEY"
})`
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 hidden lg:block sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
               <Code size={18} />
            </div>
            <span>Developer Portal</span>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              placeholder="Search docs... (⌘K)" 
              className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>

          <nav className="space-y-8">
            {navigation.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">{group.group}</p>
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
      </aside>

      {/* 2. Center Content Area */}
      <main className="flex-1 max-w-4xl mx-auto px-8 md:px-12 py-12 lg:py-16">
        
        <AnimatePresence mode="wait">
          {activeSection === "overview" && (
            <motion.div 
              key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="prose prose-slate max-w-none"
            >
              <div className="mb-12">
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">API Overview</h1>
                 <p className="text-xl text-slate-500 leading-relaxed font-medium">
                   Build real-time UPI settlement into your applications with our high-fidelity dual-engine gateway.
                 </p>
              </div>

              <SectionHeading id="architecture">Gateway Architecture</SectionHeading>
              <p className="text-slate-600 leading-7">
                WaveCollect operates as a layer-2 settlement protocol over GPay. Unlike traditional gateways that rely on slow bank reconciliations, our bot nodes match UTRs (Unique Transaction References) in real-time, providing immediate settlement feedback via signed webhooks.
              </p>

              <div className="grid md:grid-cols-2 gap-6 my-10">
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50 hover:border-blue-200 transition-all cursor-pointer group">
                  <Globe className="text-blue-500 mb-4" size={24} />
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">Hosted Checkout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/></h4>
                  <p className="text-sm text-slate-500 font-medium">Zero-code UI for merchants. Perfect for web stores.</p>
                </div>
                <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50 hover:border-emerald-200 transition-all cursor-pointer group">
                  <Smartphone className="text-emerald-500 mb-4" size={24} />
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">Native Integration <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/></h4>
                  <p className="text-sm text-slate-500 font-medium">Use raw UPI links inside your iOS or Android app.</p>
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
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Quick Setup</h1>
              <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12">
                Follow these three steps to activate your settlement nodes and start processing live traffic.
              </p>

              <div className="space-y-12">
                <SetupStep num={1} title="Global Configuration">
                  Navigate to <span className="font-bold text-slate-900 italic">Quick Setup</span> in your dashboard. Set your <strong>Success Redirect URL</strong> and <strong>Webhook Endpoint</strong>. These are the backbones of your integration.
                </SetupStep>
                <SetupStep num={2} title="IP Infrastructure Whitelisting">
                  Submit your server IPs for auto-detection. Our engine uses a <strong>Strict Firewall Policy</strong>—requests from unauthorized infrastructure will be rejected with a 403 response.
                </SetupStep>
                <SetupStep num={3} title="Node Deployment">
                  Link at least one GPay Business account. The system routes payment intents based on node availability and remaining account limits.
                </SetupStep>
              </div>

              <Callout type="warning" title="Security Requirement">
                Do not attempt to add Google Pay accounts before whitelisting your server IPs. The bot nodes require verified network handshake to initialize correctly.
              </Callout>
            </motion.div>
          )}

          {activeSection === "intent" && (
            <motion.div 
              key="intent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Create Intent</h1>
              <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12">
                Create a payment intent to initiate a transaction. This returns a hosted checkout URL and raw UPI deep-links.
              </p>

              <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg w-fit mb-8 border border-slate-200">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">POST</span>
                <code className="text-sm font-bold text-slate-700">/v1/create-intent</code>
              </div>

              <CodeBlock snippets={snippets.intent} />

              <SectionHeading id="params">Request Body Parameters</SectionHeading>
              <Table 
                headers={["Field", "Type", "Required", "Description"]}
                rows={[
                  [<code className="text-blue-600 font-bold">amount</code>, "float", "YES", "Transaction value (e.g. 10.00)"],
                  [<code className="text-blue-600 font-bold">order_id</code>, "string", "YES", "Unique ID from your system (3-64 chars)"],
                  [<code className="text-blue-600 font-bold">customer_mobile</code>, "string", "NO", "10-digit mobile for SMS tracking"],
                  [<code className="text-blue-600 font-bold">redirect_url</code>, "string", "NO", "Optional success override"]
                ]}
              />

              <SectionHeading id="response">Response Schema</SectionHeading>
              <Table 
                headers={["Field", "Type", "Description"]}
                rows={[
                  [<code className="text-emerald-600 font-bold">checkout_url</code>, "string", "URL for the hosted payment page"],
                  [<code className="text-emerald-600 font-bold">upi_link</code>, "string", "Raw deep-link for Mobile Intent Picker"],
                  [<code className="text-emerald-600 font-bold">qr_data</code>, "string", "String for custom QR generation"]
                ]}
              />
            </motion.div>
          )}

          {activeSection === "checkout" && (
            <motion.div 
              key="checkout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Building a Custom Checkout</h1>
              <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12">
                Learn how to leverage our raw protocol data to build a fully white-labeled checkout experience within your own platform.
              </p>

              <div className="space-y-16">
                <section>
                  <SectionHeading id="integration-phases">Integration Workflow</SectionHeading>
                  <p className="text-slate-600 mb-8 leading-7">
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
                  <SubHeading id="response-data">Intent Response Data</SubHeading>
                  <p className="text-slate-600 mb-6">When you create an intent, our engine returns a payload rich with metadata for your custom UI.</p>
                  <Table 
                    headers={["Key", "Description", "Usage"]}
                    rows={[
                      [<code className="text-blue-600 font-bold">payment_token</code>, "A unique MD5 hash for this session", "Used to poll transaction status"],
                      [<code className="text-blue-600 font-bold">upi_link</code>, "The raw RFC-compliant UPI deep link", "Direct intent trigger for mobile apps"],
                      [<code className="text-blue-600 font-bold">qr_data</code>, "The payload for QR code generation", "Input for any standard QR library"],
                      [<code className="text-blue-600 font-bold">checkout_url</code>, "Our hosted payment page URL", "Fallback for non-technical users"]
                    ]}
                  />
                </section>

                <section>
                  <SubHeading id="native">Mobile App Implementation</SubHeading>
                  <p className="text-slate-600 mb-4">For the best conversion rates on mobile, trigger the system Intent Picker. This allows users to pay via their preferred UPI app (GPay, PhonePe, etc.) without leaving your environment.</p>
                  <div className="p-5 bg-slate-900 rounded-2xl font-mono text-[13px] text-blue-300 shadow-lg">
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
                  <SubHeading id="status-polling">Real-time Status Polling</SubHeading>
                  <p className="text-slate-600 mb-4">While waiting for a webhook, your frontend should poll the public status endpoint to provide immediate feedback to the user.</p>
                  <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg w-fit mb-6 border border-slate-200">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">GET</span>
                    <code className="text-sm font-bold text-slate-700">/api/v1/check-status?token={"{payment_token}"}</code>
                  </div>
                </section>

                <section>
                  <SubHeading id="ready-code">Ready-to-Use Checkout Screen</SubHeading>
                  <p className="text-slate-600 mb-8">Copy and paste this high-fidelity React component to launch your custom checkout in minutes. It includes full status polling, QR rendering, and mobile intent switching.</p>
                  <CodeBlock snippets={{ 
                    "REACT / NEXT.JS": `import { useEffect, useState } from "react";
import QRCode from "qrcode.react"; // npm install qrcode.react
import { Smartphone, CheckCircle, Clock } from "lucide-react";

export default function CustomCheckout({ intentData }) {
  const [status, setStatus] = useState("PENDING");
  const { payment_token, upi_link, qr_data, amount, order_id } = intentData;

  useEffect(() => {
    // Poll status every 3 seconds
    const interval = setInterval(async () => {
      const res = await fetch(\`/api/v1/check-status?token=\${payment_token}\`);
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setStatus("SUCCESS");
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [payment_token]);

  if (status === "SUCCESS") {
    return (
      <div className="text-center p-12 bg-emerald-50 rounded-3xl border border-emerald-100">
        <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold text-emerald-900">Payment Successful!</h2>
        <p className="text-emerald-600">Order #\${order_id} is now being processed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Pay ₹\${amount}</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Order ID: \${order_id}</p>
        
        {/* QR Code Display */}
        <div className="p-4 bg-slate-50 rounded-3xl inline-block border border-slate-100">
          <QRCode value={qr_data} size={200} />
        </div>

        {/* Mobile Intent Button */}
        <div className="pt-4">
          <a 
            href={upi_link} 
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Smartphone size={20} />
            Pay via Any UPI App
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4">
          <Clock size={12} />
          Waiting for settlement...
        </div>
      </div>
    </div>
  );
}`
                  }} />
                </section>
              </div>

              <Callout type="warning" title="Protocol Safety">
                Always ensure your server-side API Key is <strong>NEVER</strong> exposed to the frontend. Custom checkouts must only interact with the public <code>check-status</code> API using the session token.
              </Callout>
            </motion.div>
          )}

          {activeSection === "webhooks" && (
            <motion.div 
              key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Webhooks</h1>
              <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12">
                Receive real-time settlement notifications as soon as UTR matching is confirmed.
              </p>

              <SectionHeading id="payload">Success Payload</SectionHeading>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-sm text-emerald-400">
                {'{'}<br/>
                &nbsp;&nbsp;"status": "SUCCESS",<br/>
                &nbsp;&nbsp;"order_id": "YOUR_REF_123",<br/>
                &nbsp;&nbsp;"amount": 500.00,<br/>
                &nbsp;&nbsp;"utr": "412239102931",<br/>
                &nbsp;&nbsp;"timestamp": "2024-05-04T12:00:00Z"<br/>
                {'}'}
              </div>

              <SectionHeading id="retries">Retry Strategy</SectionHeading>
              <p className="text-slate-600 mb-6">
                If your endpoint does not return a <code>200 OK</code> status, we will retry the notification 5 times over 1 hour with exponential backoff.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-12 pt-12 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                   <ShieldCheck size={14} />
                   Secure Signed Traffic
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm md:justify-end">
                   <Activity size={14} />
                   99.9% Delivery Guarantee
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* 3. Right Table of Contents (Sticky) */}
      <aside className="w-64 hidden xl:block sticky top-0 h-screen pt-32 pr-8">
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">On this page</p>
          <div className="space-y-3 border-l border-slate-100 pl-4">
             {activeSection === "overview" && (
               <>
                 <TocItem label="Architecture" href="#architecture" />
                 <TocItem label="Integration Models" />
               </>
             )}
             {activeSection === "intent" && (
               <>
                 <TocItem label="Request Params" href="#params" />
                 <TocItem label="Response Schema" href="#response" />
               </>
             )}
             {activeSection === "checkout" && (
               <>
                 <TocItem label="Hosted Checkout" href="#hosted" />
                 <TocItem label="Native Mobile" href="#native" />
               </>
             )}
             {activeSection === "webhooks" && (
               <>
                 <TocItem label="Payload" href="#payload" />
                 <TocItem label="Retry Strategy" href="#retries" />
               </>
             )}
          </div>
        </div>
      </aside>

    </div>
  );
}

const TocItem = ({ label, href = "#" }: any) => (
  <a href={href} className="block text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors">
    {label}
  </a>
);

const SetupStep = ({ num, title, children }: any) => (
  <div className="flex gap-6">
    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-1">
      {num}
    </div>
    <div className="space-y-2">
      <h4 className="text-lg font-bold text-slate-900">{title}</h4>
      <div className="text-sm text-slate-500 leading-relaxed font-medium">
        {children}
      </div>
    </div>
  </div>
);

const PhaseCard = ({ num, title, desc }: any) => (
  <div className="p-6 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">{num}</div>
    <div className="space-y-2">
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);
