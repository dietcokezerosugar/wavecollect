"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { 
  Code, Copy, Check, Terminal, Shield, 
  HelpCircle, ArrowRight, Zap, ExternalLink, Menu, X
} from "lucide-react";

// Custom Interactive Code Block Component
function CodeBlock({ code, language = "JSON" }: { code: string, language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700/50">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{language}</span>
        <button 
          onClick={copyToClipboard} 
          className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded-lg flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10px] font-bold uppercase">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-slate-950/80">
        <pre className="text-[13px] font-mono leading-relaxed text-slate-350">
          {code}
        </pre>
      </div>
    </div>
  );
}

// Navigation sidebar configuration matching reference sections
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
      { id: "initiate_payment", label: "1. Initiate Payment" },
      { id: "payment_status", label: "2. Payment Status" },
      { id: "payment_webhook", label: "3. Process Webhook" },
    ]
  },
  {
    group: "Payouts API",
    items: [
      { id: "payout_balance", label: "4. Payout Balance" },
      { id: "payout_initiate", label: "5. Payout Initiate" },
      { id: "payout_status", label: "6. Payout Status" },
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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-700 selection:bg-blue-50 selection:text-blue-900">
      
      {/* Sleek Modern Header */}
      <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[100] px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo height={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">Devs</span>
          </Link>
          <div className="hidden md:flex h-6 w-px bg-slate-200 mx-2" />
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Dashboard</Link>
            <Link href="/docs" className="text-xs font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 py-5 translate-y-[2px]">Documentation</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shadow-sm text-xs font-bold">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
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
          fixed lg:sticky top-16 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-[90] p-6 overflow-y-auto transition-transform duration-300 shrink-0
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
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium flex items-center justify-between ${
                        activeSection === item.id 
                          ? "bg-blue-50 text-blue-600 font-bold" 
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
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

          {/* Quick Help Box */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2 text-slate-850">
              <Terminal size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-wider">Dev Help</span>
            </div>
            <p className="text-[11px] leading-relaxed font-semibold text-slate-500">
              Need assistance? Drop a line to our technical operations center at <a href="mailto:infra@payxmint.com" className="text-blue-600 hover:underline">infra@payxmint.com</a>.
            </p>
          </div>
        </aside>

        {/* Documentation Content Panel */}
        <main className="flex-1 bg-white">
          <div className="max-w-4xl px-6 py-12 md:px-12 md:py-14 lg:px-16 mx-auto min-w-0">
            
            {/* Section: Introduction */}
            <section id="intro" className="mb-16 scroll-mt-24">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2.5">
                <Zap className="text-blue-600 w-8 h-8 fill-current" />
                Developer Integration Reference
              </h1>
              <p className="text-slate-500 font-medium text-[15px] leading-relaxed max-w-3xl">
                Welcome to the simple one-page developer documentation. Use this technical reference to integrate collections and payout automation into your system securely and efficiently.
              </p>
            </section>

            {/* Section: API Configuration */}
            <section id="base_url" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <h2 className="text-lg font-black text-slate-900 mb-3">API Environment Configuration</h2>
              <p className="text-slate-500 font-medium text-[14px] mb-4">
                Use the following endpoints to initiate requests. Ensure that you authenticate all API requests by providing your <code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-xs font-mono">public_key</code>.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sandbox Endpoint</span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">https://sandbox.payxmint.com/api/v1</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Production Endpoint</span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">https://api.payxmint.com/api/v1</p>
                </div>
              </div>
            </section>

            {/* --- Collections Section Header --- */}
            <div className="border-t border-slate-150 my-12 pt-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section 1</span>
              <h2 className="text-xl font-black text-slate-900 mt-1">Collections & Inbound Payments</h2>
            </div>

            {/* 1. Initiate Payment */}
            <section id="initiate_payment" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded">POST</span>
                <h3 className="text-base font-black text-slate-900">Initiate Payment</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                Creates a new payment intent and returns a secure payment link URL to display to your customer.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all mb-4">
                    {"<API_BASE_URL>"}/payment/initiate
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Parameters</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-250">
                          <th className="p-3 font-bold text-slate-600">Field</th>
                          <th className="p-3 font-bold text-slate-600">Type</th>
                          <th className="p-3 font-bold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">public_key</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">merchant_txn_id</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">amount</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">redirect_url</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">buyer_first_name</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">buyer_last_name</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">buyer_phone</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-slate-400 font-normal">Optional</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">buyer_email</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
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
  --url <API_BASE_URL>/payment/initiate \\
  --header 'Content-Type: application/json' \\
  --data '{
    "public_key": "YOUR_PUBLIC_KEY",
    "merchant_txn_id": "pay_202506038627",
    "buyer_first_name": "Amit",
    "buyer_last_name": "Bansal",
    "buyer_phone": "9898989898",
    "buyer_email": "amit_bansal@email.com",
    "amount": "5000.00",
    "redirect_url": "https://merchant.site/thankyou"
  }'`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 mt-4">Sample Response</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "query": "success",
  "code": 200,
  "message": "Payment request created",
  "timestamp_create": "03-06-2025 09:47:48 PM",
  "merchant_txn_id": "pay_202506038627",
  "amount": "5000.00",
  "buyer_first_name": "Amit",
  "buyer_last_name": "Bansal",
  "buyer_phone": "9898989898",
  "buyer_email": "amit_bansal@email.com",
  "redirect_url": "https://merchant.site/thankyou",
  "payment_link": "https://gateway.site/checkout/pay_202506038627",
  "payment_status": "pending"
}`}
                  />
                </div>
              </div>
            </section>

            {/* 2. Payment Status */}
            <section id="payment_status" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded">POST</span>
                <h3 className="text-base font-black text-slate-900">Payment Status</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                Queries and retrieves the current transaction metadata, verification status, and processing logs for an intent.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all mb-4">
                    {"<API_BASE_URL>"}/payment/status
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Parameters</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-250">
                          <th className="p-3 font-bold text-slate-600">Field</th>
                          <th className="p-3 font-bold text-slate-600">Type</th>
                          <th className="p-3 font-bold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">public_key</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">merchant_txn_id</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
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
  --url <API_BASE_URL>/payment/status \\
  --header 'Content-Type: application/json' \\
  --data '{
    "public_key": "YOUR_PUBLIC_KEY",
    "merchant_txn_id": "pay_202506038627"
  }'`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 mt-4">Sample Response</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "query": "success",
  "code": 200,
  "message": "Collection details found",
  "created": "03-06-2025 09:40:24 PM",
  "updated": "03-06-2025 09:40:51 PM",
  "device": "mobile",
  "mode": "upi",
  "gateway": "smart_collect",
  "platform_txn_id": "pay_202506035445",
  "gateway_txn_id": "pay_202506035445",
  "bank_txn_id": "5477419633",
  "buyer_first_name": "Ajay",
  "buyer_last_name": "Bansal",
  "buyer_phone": "9898989898",
  "buyer_email": "ajay.b@email.com",
  "amount": "799.00",
  "fee": "22.40",
  "net_amount": "776.60",
  "redirect_url": "https://merchant.site/thankyou",
  "remark": "submitted",
  "status": "success"
}`}
                  />
                </div>
              </div>
            </section>

            {/* 3. Process Webhook Data */}
            <section id="payment_webhook" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[10px] font-bold rounded">ENGINE</span>
                <h3 className="text-base font-black text-slate-900">Process Webhook Data (Payment)</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                To guarantee secure message processing, verify the HMAC-SHA256 signature calculated from the raw body against the HTTP headers.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Cryptographic Headers</h4>
                  <div className="space-y-2 mb-4 font-mono text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                      <span className="font-bold text-slate-700">X-Timestamp</span>
                      <span className="text-slate-400">Epoch Unix Timestamp</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
                      <span className="font-bold text-slate-700">X-Signature</span>
                      <span className="text-slate-400">Base64 Encoded Hashed Payload</span>
                    </div>
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Signature Verification Algorithm</h4>
                  <CodeBlock 
                    language="Javascript" 
                    code={`// Define the secret key
secret_key = 'secret_key'

// Read HTTP headers from the request
timestamp = getHeader('X-Timestamp')
signature = getHeader('X-Signature')

// Read raw request body
raw_body = getRawBody()

// Initialize response
response = {
  'status': 'failure',
  'message': ''
}

// Ensure required values are present
if timestamp and signature and raw_body:
  signed_payload = timestamp + '.' + raw_body
  expected_signature = base64encode(HMAC_SHA256(signed_payload, secret_key))
  
  if secureCompare(expected_signature, signature):
    response['status'] = 'success'
    response['message'] = 'Webhook verified and accepted'
  else:
    response['message'] = 'Invalid signature'
else:
  response['message'] = 'Missing timestamp, signature, or body'

// Send JSON response back to the sender
sendJSONResponse(response)`}
                  />
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Sample Payment Webhook Payload</h4>
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

            {/* --- Payouts Section Header --- */}
            <div className="border-t border-slate-150 my-12 pt-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section 2</span>
              <h2 className="text-xl font-black text-slate-900 mt-1">Payouts & Bank Settlements</h2>
            </div>

            {/* 4. Payout Balance */}
            <section id="payout_balance" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded">POST</span>
                <h3 className="text-base font-black text-slate-900">Payout Balance</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                Queries and retrieves the current net settlement ledger balance available inside your merchant account.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all mb-4">
                    {"<API_BASE_URL>"}/payout/balance
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Parameters</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-250">
                          <th className="p-3 font-bold text-slate-600">Field</th>
                          <th className="p-3 font-bold text-slate-600">Type</th>
                          <th className="p-3 font-bold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">public_key</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
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
  --url <API_BASE_URL>/payout/balance \\
  --header 'Content-Type: application/json' \\
  --data '{
    "public_key": "YOUR_PUBLIC_KEY"
  }'`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 mt-4">Sample Response</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "query": "success",
  "code": 200,
  "message": "Payout balance fetched",
  "timestamp_request": "03-06-2025 10:04:24 PM",
  "account_id": "btx_wmK6wBC7BF0N6Rb5",
  "payout_balance": "3,061.19"
}`}
                  />
                </div>
              </div>
            </section>

            {/* 5. Payout Initiate */}
            <section id="payout_initiate" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded">POST</span>
                <h3 className="text-base font-black text-slate-900">Payout Initiate</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                Creates a new payout transaction to transfer funds directly to any bank account via IMPS, NEFT, or RTGS.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all mb-4">
                    {"<API_BASE_URL>"}/payout/initiate
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Parameters</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-250">
                          <th className="p-3 font-bold text-slate-600">Field</th>
                          <th className="p-3 font-bold text-slate-600">Type</th>
                          <th className="p-3 font-bold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">public_key</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">merchant_txn_id</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">payout_mode</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required (imps / neft / rtgs)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">account_name</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">account_number</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">ifsc</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">amount</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
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
  --url <API_BASE_URL>/payout/initiate \\
  --header 'Content-Type: application/json' \\
  --data '{
    "public_key": "YOUR_PUBLIC_KEY",
    "merchant_txn_id": "pay_202506031327",
    "payout_mode": "imps",
    "account_name": "Beneficiary name",
    "account_number": "919898989898",
    "ifsc": "SBIN0005050",
    "amount": "20000.00"
  }'`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 mt-4">Sample Response</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "query": "success",
  "code": 200,
  "message": "Payout request created",
  "timestamp_create": "03-06-2025 10:01:36 PM",
  "payout_mode": "imps",
  "merchant_txn_id": "pay_202506031327",
  "bank_name": "State Bank of India",
  "branch_name": "TRADE CPC",
  "account_name": "Beneficiary name",
  "account_number": "919898989898",
  "ifsc": "SBIN0005050",
  "amount": "20000.00",
  "fee": "11.80",
  "net_amount": "20011.80",
  "payout_status": "success"
}`}
                  />
                </div>
              </div>
            </section>

            {/* 6. Payout Status */}
            <section id="payout_status" className="mb-16 scroll-mt-24 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded">POST</span>
                <h3 className="text-base font-black text-slate-900">Payout Status</h3>
              </div>
              <p className="text-slate-500 text-[13.5px] font-medium mb-4">
                Queries and retrieves the current metadata, verification status, and transaction references for a payout request.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</h4>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all mb-4">
                    {"<API_BASE_URL>"}/payout/status
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Request Parameters</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-250">
                          <th className="p-3 font-bold text-slate-600">Field</th>
                          <th className="p-3 font-bold text-slate-600">Type</th>
                          <th className="p-3 font-bold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">public_key</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 font-bold">merchant_txn_id</td>
                          <td className="p-3 text-slate-500 font-mono">string</td>
                          <td className="p-3 text-red-500">Required</td>
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
  --url <API_BASE_URL>/payout/status \\
  --header 'Content-Type: application/json' \\
  --data '{
    "public_key": "YOUR_PUBLIC_KEY",
    "merchant_txn_id": "pay_202506031327"
  }'`}
                  />

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 mt-4">Sample Response</h4>
                  <CodeBlock 
                    language="JSON" 
                    code={`{
  "query": "success",
  "code": 200,
  "message": "Payout details found",
  "created": "03-06-2025 10:01:36 PM",
  "updated": "03-06-2025 10:02:11 PM",
  "payout_mode": "imps",
  "platform_txn_id": "pay_202506031327",
  "bank_txn_id": "521245112100",
  "bank_name": "State Bank of India",
  "branch_name": "TRADE CPC",
  "account_name": "Beneficiary name",
  "account_number": "919898989898",
  "ifsc": "SBIN0005050",
  "amount": "20000",
  "fee": "11.8",
  "net_amount": "20011.80",
  "status": "success"
}`}
                  />
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
