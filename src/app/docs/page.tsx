"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { 
  Code, Copy, Check, Terminal, Shield, 
  HelpCircle, ArrowRight, Zap, ExternalLink, Menu, X, Key, ShieldCheck
} from "lucide-react";

// Premium Interactive Code Block Component
function CodeBlock({ code, language = "JSON" }: { code: string, language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-700/50 bg-[#0F172A] shadow-lg shadow-slate-900/10">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1E293B] border-b border-slate-800">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{language}</span>
        <button 
          onClick={copyToClipboard} 
          className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded-lg flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10px] font-black uppercase">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-[#090D16]">
        <pre className="text-[13px] font-mono leading-relaxed text-slate-300">
          {code}
        </pre>
      </div>
    </div>
  );
}

// Navigation sidebar configuration matching actual endpoints
const SECTIONS = [
  {
    group: "Overview",
    items: [
      { id: "intro", label: "Getting Started" },
      { id: "base_url", label: "API Configuration" },
    ]
  },
  {
    group: "Collections API",
    items: [
      { id: "create_intent", label: "1. Initiate Payment" },
      { id: "check_status", label: "2. Payment Status" },
      { id: "payment_webhook", label: "3. Process Webhook" },
      { id: "custom_checkout", label: "4. Custom Checkout Screen" },
    ]
  }
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('intro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-80px 0px -40% 0px" }
    );

    SECTIONS.flatMap(n => n.items.map(i => i.id)).forEach(id => {
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-slate-650 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sleek Modern Header with Brand Theme */}
      <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[100] px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo height={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-mono">Devs</span>
          </Link>
          <div className="hidden md:flex h-6 w-px bg-slate-250 mx-2" />
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-blue-700 transition-colors uppercase tracking-widest">Dashboard</Link>
            <Link href="/docs" className="text-xs font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 py-5 translate-y-[2px]">Documentation</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm text-xs font-bold">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span>API Gateway Online</span>
          </div>
          <button className="lg:hidden p-2 text-slate-500 hover:text-slate-800" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex relative">
        
        {/* Navigation Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 bottom-0 w-72 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 z-[90] p-6 overflow-y-auto transition-transform duration-300 shrink-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.group}>
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2.5 px-3">
                  {section.group}
                </h4>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-semibold flex items-center justify-between ${
                        activeSection === item.id 
                          ? "bg-blue-50/70 text-blue-600 font-black" 
                          : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/20"
                      }`}
                    >
                      <span>{item.label}</span>
                      {activeSection === item.id && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Help Box */}
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <Terminal size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-wider">Dev Operations</span>
            </div>
            <p className="text-[11px] leading-relaxed font-semibold text-slate-500">
              Need programmatic help? Contact our engineering team at <a href="mailto:infra@payxmint.com" className="text-blue-600 hover:underline">infra@payxmint.com</a>.
            </p>
          </div>
        </aside>

        {/* Documentation Content Panel */}
        <main className="flex-1 bg-white">
          <div className="max-w-4xl px-6 py-12 md:px-12 md:py-14 lg:px-16 mx-auto min-w-0">
            
            {/* Section: Introduction */}
            <section id="intro" className="mb-16 scroll-mt-24">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2F9BFF] to-[#0072FF] flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                  <Zap size={16} className="fill-current" />
                </div>
                Developer Integration Reference
              </h1>
              <p className="text-slate-500 font-medium text-[15px] leading-relaxed max-w-3xl mb-6">
                Welcome to the official PayxMint API documentation. Use this reference to integrate high-fidelity UPI automated payments securely into your core applications.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-2">Intent Status Codes</span>
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-650">
                    <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-150">
                      <span className="font-bold text-slate-800">PENDING</span>
                      <span className="text-slate-400">Created, awaiting UPI scan</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-150">
                      <span className="font-bold text-emerald-600">SUCCESS</span>
                      <span className="text-slate-400">Paid and reconciled by engine</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-150">
                      <span className="font-bold text-rose-600">EXPIRED</span>
                      <span className="text-slate-400">Time window elapsed before payment</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-2">Integration Testing (Simulator)</span>
                    <p className="text-slate-500 text-[11.5px] leading-relaxed mb-3 font-medium">
                      Simulate successful payment state transitions during development by sending an incoming POST request to the simulation endpoint using your active <code className="font-mono text-blue-600 bg-blue-50 px-1 rounded font-bold">order_id</code>.
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-150 font-mono text-[10.5px] text-slate-700 break-all select-all font-semibold">
                    POST /api/v1/simulate-payment {"{ \"order_id\": \"your_order_id\" }"}
                  </div>
                </div>
              </div>
            </section>

            {/* Section: API Configuration */}
            <section id="base_url" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <h2 className="text-lg font-black text-slate-900 mb-3">API Environment Configuration</h2>
              <p className="text-slate-500 font-medium text-[14px] mb-4">
                Authenticate all requests by including your secret API key in the <code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header.
              </p>
              
              <div className="max-w-xl my-6">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#2F9BFF] to-[#0072FF]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Production API Base Endpoint</span>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1 select-all">https://api.payxmint.com/api/v1</p>
                </div>
              </div>

              <div className="my-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-xs">
                <Key className="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
                <div className="font-semibold text-blue-900">
                  <span className="font-black uppercase tracking-wide block mb-0.5 text-[10px]">Header Authentication Pattern</span>
                  Pass your key as <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">Authorization: Bearer YOUR_API_KEY</code> on every outgoing HTTP request.
                </div>
              </div>
            </section>

            {/* --- Collections Section Header --- */}
            <div className="border-t border-slate-150 my-12 pt-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section 1</span>
              <h2 className="text-xl font-black text-slate-900 mt-1">Collections & Inbound Payments</h2>
            </div>

            {/* 1. Initiate Payment */}
            <section id="create_intent" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-blue-650 text-white font-mono text-[10px] font-bold rounded">POST</span>
                <h3 className="text-base font-black text-slate-900">1. Initiate Payment (/create-intent)</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                Creates a new dynamic payment intent and returns the checkout URL to showcase to your user, alongside high-fidelity raw UPI deep links.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all mb-4 font-semibold">
                    {"https://api.payxmint.com/api/v1/create-intent"}
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Body Payload</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-650">Field</th>
                          <th className="p-3 font-bold text-slate-650">Type</th>
                          <th className="p-3 font-bold text-slate-650">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">amount</td>
                          <td className="p-3 text-slate-500 font-mono">string/number</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">order_id</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required (Unique Merchant ID)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">customer_mobile</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">customer_email</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">customer_ip</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">customer_device_id</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">redirect_url</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">metadata</td>
                          <td className="p-3 text-slate-500 font-mono">object</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Interactive Request</h4>
                  <CodeBlock 
                    language="Bash" 
                    code={`curl --request POST \\
  --url https://api.payxmint.com/api/v1/create-intent \\
  --header 'Authorization: Bearer YOUR_API_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "amount": "5000.00",
    "order_id": "pay_202506038627",
    "customer_mobile": "9898989898",
    "customer_email": "amit_bansal@email.com",
    "redirect_url": "https://merchant.site/thankyou"
  }'`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 mt-4">Sample Response</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "id": "intent_wmK6wBC7BF0N6Rb5",
  "object": "payment_intent",
  "amount": 5000,
  "currency": "INR",
  "status": "PENDING",
  "order_id": "pay_202506038627",
  "checkout_url": "https://payxmint.com/pay/tok_202506038627",
  "payment_token": "tok_202506038627",
  "upi_link": "upi://pay?pa=payxmint@sbi&pn=PayxMint...",
  "qr_data": "upi://pay?pa=payxmint@sbi...",
  "metadata": {},
  "created": 1748553768
}`}
                  />
                </div>
              </div>
            </section>

            {/* 2. Payment Status */}
            <section id="check_status" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-blue-650 text-white font-mono text-[10px] font-bold rounded">POST</span>
                <h3 className="text-base font-black text-slate-900">2. Payment Status (/check-status)</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                Queries and retrieves the exact transaction metadata, settlement details, and collection status using your <code className="text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded text-xs font-mono">order_id</code>.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all mb-4 font-semibold">
                    {"https://api.payxmint.com/api/v1/check-status"}
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Body Payload</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-650">Field</th>
                          <th className="p-3 font-bold text-slate-650">Type</th>
                          <th className="p-3 font-bold text-slate-650">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">order_id</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required (Unique Merchant ID)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-250 text-xs text-slate-500 leading-relaxed font-semibold">
                    💡 **Query Alternative**: You can also use HTTP <code className="text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded font-mono">GET</code> to check status by appending order_id to search params: <br />
                    <code className="block mt-1 font-mono text-[11px] select-all bg-white p-1 rounded border border-slate-200 break-all text-slate-700">https://api.payxmint.com/api/v1/check-status?order_id=pay_202506038627</code>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Interactive Request</h4>
                  <CodeBlock 
                    language="Bash" 
                    code={`curl --request POST \\
  --url https://api.payxmint.com/api/v1/check-status \\
  --header 'Authorization: Bearer YOUR_API_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "order_id": "pay_202506038627"
  }'`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 mt-4">Sample Response</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "id": "intent_wmK6wBC7BF0N6Rb5",
  "object": "payment_intent",
  "amount": 799,
  "currency": "INR",
  "status": "SUCCESS",
  "order_id": "pay_202506038627",
  "metadata": {},
  "payer": {
    "name": "Ajay Bansal",
    "upi": "ajay.b@ybl"
  },
  "settlement": {
    "utr": "5477419633",
    "txn_id": "pay_202506035445",
    "timestamp": "2025-06-03T21:40:51.000Z"
  },
  "created": 1748553768,
  "expire_at": 1748554768
}`}
                  />
                </div>
              </div>
            </section>

            {/* 3. Process Webhook Data */}
            <section id="payment_webhook" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-[#002C8A] text-white font-mono text-[10px] font-bold rounded">SECURITY</span>
                <h3 className="text-base font-black text-slate-900">3. Process Webhook Data (Payment)</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                To guarantee secure event delivery, calculate the HMAC-SHA256 hex signature directly from the raw incoming body string against your webhook secret.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Cryptographic Headers</h4>
                  <div className="space-y-2 mb-4 font-mono text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between font-semibold">
                      <span className="text-slate-800">X-PayxMint-Event</span>
                      <span className="text-slate-400">collection_notification</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between font-semibold">
                      <span className="text-slate-800">X-PayxMint-Signature</span>
                      <span className="text-slate-400">Hex-encoded HMAC-SHA256</span>
                    </div>
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Verification Implementation (NodeJS)</h4>
                  <CodeBlock 
                    language="Javascript" 
                    code={`// Define your webhook signing secret (from Settings dashboard)
webhook_secret = 'your_webhook_secret'

// Read webhook HTTP signature header from the request
signature = getHeader('X-PayxMint-Signature')
event_type = getHeader('X-PayxMint-Event')

// Read raw request body
raw_body = getRawBody()

// Initialize response
response = {
  'status': 'failure',
  'message': ''
}

if signature and raw_body:
  // Calculate expected signature using HMAC-SHA256 hex digest
  expected_signature = HMAC_SHA256(raw_body, webhook_secret).toHex()
  
  if secureCompare(expected_signature, signature):
    response['status'] = 'success'
    response['message'] = 'Webhook verified successfully'
  else:
    response['message'] = 'Invalid signature'
else:
  response['message'] = 'Missing signature header or raw request body'

// Send JSON response back with HTTP status 200 to acknowledge receipt
sendJSONResponse(response, 200)`}
                  />
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Sample Webhook Notification Payload</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "event_type": "collection_notification",
  "data": {
    "timestamp_create": 1748553768,
    "timestamp_update": 1748635750,
    "pid": "btx_wmK6wBC7BF0N6Rb5",
    "device": "desktop",
    "payment_method": "upi",
    "gateway": "smart_collect",
    "platform_txn_id": "pay_202505298531",
    "gateway_txn_id": "pay_202505298531",
    "bank_txn_id": "541254875525",
    "buyer_first_name": "Ajay",
    "buyer_last_name": "Bansal",
    "buyer_phone": "9898989898",
    "buyer_email": "ajay.b@email.com",
    "amount": 388,
    "remark": "attempted",
    "status": "success"
  }
}`}
                  />
                </div>
              </div>
            </section>

            {/* 4. Custom Checkout Screen */}
            <section id="custom_checkout" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-[#002C8A] text-white font-mono text-[10px] font-bold rounded">NATIVE</span>
                <h3 className="text-base font-black text-slate-900">4. Custom Checkout Screen (Web & Mobile Apps)</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                To maximize conversion rates, you can completely bypass our hosted checkout page and render the payment experience natively inside your own application using raw UPI links.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">A. Render Custom Web QR Code</h4>
                  <p className="text-slate-550 text-xs font-semibold leading-relaxed mb-3">
                    Use any standard QR generating library (such as <code className="font-mono bg-slate-100 px-1 py-0.5 text-blue-600 rounded">qrcode.react</code> or standard canvas libraries) to render the raw <code className="font-mono text-slate-800 font-bold bg-slate-50 px-1">qr_data</code> string returned from the intent creation.
                  </p>
                  
                  <CodeBlock 
                    language="React / JSX" 
                    code={`import { QRCodeSVG } from 'qrcode.react';

function NativeUPIQRCode({ qr_data, amount }) {
  return (
    <div className="p-6 border border-slate-200 rounded-2xl text-center">
      <h3 className="text-sm font-bold text-slate-800 mb-4">
        Scan to Pay: ₹\${amount}
      </h3>
      <div className="flex justify-center my-4">
        <QRCodeSVG value={qr_data} size={200} includeMargin={true} />
      </div>
      <p className="text-xs text-slate-400">
        Scan using GPay, PhonePe, Paytm, or BHIM
      </p>
    </div>
  );
}`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-6">B. Mobile Deep Linking (One-click Apps)</h4>
                  <p className="text-slate-550 text-xs font-semibold leading-relaxed mb-3">
                    For mobile checkouts (iOS & Android), bind the <code className="font-mono text-slate-800 font-bold bg-slate-50 px-1">upi_link</code> directly as a hyperlink or button click handler. The operating system will trigger standard UPI application sheets instantly.
                  </p>
                  
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 font-mono text-[11px] text-slate-700 leading-relaxed font-semibold">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">HTML Hyperlink Trigger</span>
                    &lt;a href="{"{upi_link}"}" class="btn"&gt;Pay with UPI App&lt;/a&gt;
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">C. Browser Status Polling loop</h4>
                  <p className="text-slate-550 text-xs font-semibold leading-relaxed mb-3">
                    To auto-redirect your customer once the payment is completed, poll the check-status API using JavaScript every 3 seconds:
                  </p>
                  
                  <CodeBlock 
                    language="Javascript" 
                    code={`// Start polling status for client-side redirection
function startPaymentPolling(orderId) {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(\`https://api.payxmint.com/api/v1/check-status?order_id=\${orderId}\`);
      const result = await response.json();
      
      if (result.status === 'SUCCESS') {
        clearInterval(pollInterval);
        // Redirect user instantly to your success page
        window.location.href = '/checkout/success?order_id=' + orderId;
      } else if (result.status === 'EXPIRED') {
        clearInterval(pollInterval);
        // Redirect user to failed page
        window.location.href = '/checkout/failed?order_id=' + orderId;
      }
    } catch (error) {
      console.error('Check status polling failed:', error);
    }
  }, 3000); // Check every 3 seconds
}`}
                  />

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-xs">
                    <ShieldCheck className="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
                    <div className="font-semibold text-blue-900">
                      <span className="font-black uppercase tracking-wide block mb-0.5 text-[10px]">Security Warning</span>
                      Never rely solely on client-side status polling to deliver products or fulfill orders. Always verify the transaction state server-side using Webhooks or direct API calls before fulfilling.
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
