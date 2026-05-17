"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { 
  UserCheck, FileText, Shield, Webhook as WebhookIcon, Layers, Cpu, Code, 
  ShieldCheck, AlertTriangle, HelpCircle, Check, Copy, ArrowRight, Menu, X, 
  ExternalLink, Search, CheckSquare
} from "lucide-react";
import { motion } from "framer-motion";

// --- Custom Sidebar Link ---
const SidebarLink = ({ id, label, active, onClick, isGroup = false }: any) => (
  <button
    onClick={() => !isGroup && onClick(id)}
    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
      isGroup 
        ? "font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-8 mb-2 cursor-default" 
        : "text-[13px] group relative pl-6"
    } ${
      !isGroup && active 
        ? "bg-blue-50 text-blue-600 font-bold" 
        : !isGroup ? "text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium" : ""
    }`}
  >
    {label}
    {!isGroup && active && (
       <motion.div layoutId="activeNav" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-600 rounded-r-full" />
    )}
  </button>
);

// --- Custom Code Block ---
const CodeBlock = ({ code, language = "JSON" }: { code: string, language?: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm shadow-blue-900/5">
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100 border-b border-slate-200">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language}</span>
        <button onClick={copy} className="text-slate-400 hover:text-slate-750 transition-colors p-1.5 hover:bg-slate-200/50 rounded-lg">
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-5 overflow-x-auto bg-slate-50/50">
        <pre className="text-[12.5px] font-mono leading-relaxed text-slate-700">
           {code}
        </pre>
      </div>
    </div>
  );
};

// --- Custom Callout ---
const Callout = ({ type, title, children }: any) => {
  const styles: any = {
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: <AlertTriangle size={18} className="text-amber-500" /> },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: <Shield size={18} className="text-blue-500" /> },
    tip: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: <ShieldCheck size={18} className="text-emerald-500" /> }
  };
  const s = styles[type] || styles.info;
  return (
    <div className={`my-6 p-5 rounded-xl border ${s.border} ${s.bg} flex gap-4 shadow-sm`}>
       <div className="mt-0.5 shrink-0">{s.icon}</div>
       <div>
          <h5 className={`text-[12px] font-black ${s.text} mb-1 uppercase tracking-widest`}>{title}</h5>
          <div className={`text-[13.5px] leading-relaxed opacity-90 ${s.text} font-medium`}>{children}</div>
       </div>
    </div>
  );
};

// --- Navigation Sections matching ONBOARDING_WORKFLOW ---
const NAVIGATION = [
  { group: "Getting Started", items: [
    { id: "intro", label: "Introduction" },
    { id: "step1", label: "Step 1: Create Account" },
    { id: "step2", label: "Step 2: Business Details" },
    { id: "step3", label: "Step 3: Secure Server" },
    { id: "step4", label: "Step 4: Webhooks" },
    { id: "step5", label: "Step 5: Join Pool" },
  ]},
  { group: "Architecture & Integration", items: [
    { id: "step6", label: "Step 6: Core Mechanics" },
    { id: "step7", label: "Step 7: API Reference" },
    { id: "step8", label: "Step 8: Webhooks & Safety" },
  ]},
  { group: "Oversight & Verification", items: [
    { id: "step9", label: "Step 9: Error Codes" },
    { id: "step10", label: "Step 10: Troubleshooting" },
    { id: "checklist", label: "Production Checklist" },
  ]}
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('intro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-80px 0px -50% 0px" }
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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 text-slate-705">
      {/* --- Header --- */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[100] px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
             <Logo height={24} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-1.5 border border-slate-200">Devs</span>
          </Link>
          <div className="hidden md:flex h-6 w-px bg-slate-200 mx-2" />
          <div className="hidden md:flex items-center gap-6">
             <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">Dashboard</Link>
             <Link href="/docs" className="text-xs font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 py-5 translate-y-[2px]">Documentation</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shadow-sm">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Gateway Online</span>
           </div>
           <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
           </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* --- Navigation Sidebar --- */}
        <aside className={`
          fixed lg:sticky top-16 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-[90] p-6 overflow-y-auto transition-transform duration-300 shrink-0
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

          <div className="mt-12 p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/10 group overflow-hidden relative">
             <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
             <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100">Sync Status</span>
             </div>
             <p className="text-[11px] leading-relaxed font-bold">
                Dynamic routing engine verified. Heartbeat is live.
             </p>
             <Link href="/dashboard" className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-200 group-hover:text-white transition-colors">
                Open Console <ArrowRight size={10} />
             </Link>
          </div>
        </aside>

        {/* --- Main Document --- */}
        <main className="flex-1 bg-white">
          <div className="max-w-3xl px-6 py-12 md:px-12 md:py-16 lg:px-16 mx-auto min-w-0">
             
             {/* --- INTRO --- */}
             <section id="intro" className="mb-24 scroll-mt-24">
                <h1 className="text-4xl font-black text-slate-705 tracking-tight mb-4">
                  How to Start Using PayxMint (WaveCollect)
                </h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
                  Merchant Setup & API Integration Master Guide
                </p>
                <div className="h-1 w-20 bg-blue-600 rounded-full mb-8" />
                <p className="text-base text-slate-600 leading-relaxed font-medium">
                  Follow these simple steps to set up your account, configure security credentials, whitelist your servers, and start collecting lightning-fast UPI payments on your platform today.
                </p>
             </section>

             {/* --- STEP 1 --- */}
             <section id="step1" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><UserCheck size={18}/></div>
                   Step 1: Create Your Account
                </h2>
                <div className="space-y-4 text-[14.5px] text-slate-600 leading-relaxed font-medium">
                   <ol className="list-decimal list-inside space-y-3 pl-2">
                     <li>
                       Go to <a href="https://payxmint.com/register" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1">https://payxmint.com/register <ExternalLink size={12}/></a>.
                     </li>
                     <li>Sign up with your email.</li>
                     <li>Check your email to verify your account and log in.</li>
                   </ol>
                </div>
             </section>

             {/* --- STEP 2 --- */}
             <section id="step2" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><FileText size={18}/></div>
                   Step 2: Fill Your Business Details
                </h2>
                <div className="space-y-4 text-[14.5px] text-slate-600 leading-relaxed font-medium">
                   <ol className="list-decimal list-inside space-y-3 pl-2">
                     <li>
                       Go to the <span className="font-bold text-slate-900">Quick Setup</span> page: <a href="https://payxmint.com/dashboard/quick-setup" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1">https://payxmint.com/dashboard/quick-setup <ExternalLink size={12}/></a>.
                     </li>
                     <li>Fill in all the boxes (Business Name, Phone Number, etc.).</li>
                     <li>Click <span className="font-bold text-slate-900">Save</span>.</li>
                     <li>
                       Click the <span className="font-bold text-slate-900">"Apply for Whitelist"</span> button at the bottom. This tells our compliance team to audit and activate your account.
                     </li>
                   </ol>
                </div>
             </section>

             {/* --- STEP 3 --- */}
             <section id="step3" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><Shield size={18}/></div>
                   Step 3: Secure Your Server (IP Whitelist)
                </h2>
                <div className="space-y-4 text-[14.5px] text-slate-600 leading-relaxed font-medium">
                   <ol className="list-decimal list-inside space-y-3 pl-2">
                     <li>
                       Go to the <span className="font-bold text-slate-900">IP Whitelist</span> page: <a href="https://payxmint.com/dashboard/ip-whitelist" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1">https://payxmint.com/dashboard/ip-whitelist <ExternalLink size={12}/></a>.
                     </li>
                     <li><span className="font-bold text-slate-900">Read the agreement</span> and click the <span className="font-bold text-slate-900">Check Box</span> to agree.</li>
                     <li>Type in your server's IP address (where your website is hosted) and click <span className="font-bold text-slate-900">Whitelist IP</span>.</li>
                   </ol>
                   <Callout type="warning" title="Critical security note">
                     If your production or testing server's IP is not whitelisted, all API calls originating from that server will be rejected with an unauthorized request error.
                   </Callout>
                </div>
             </section>

             {/* --- STEP 4 --- */}
             <section id="step4" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><WebhookIcon size={18}/></div>
                   Step 4: Set Up Your Webhook
                </h2>
                <div className="space-y-4 text-[14.5px] text-slate-600 leading-relaxed font-medium">
                   <ol className="list-decimal list-inside space-y-3 pl-2">
                     <li>
                       Go to the <span className="font-bold text-slate-900">Quick Setup</span> page: <a href="https://payxmint.com/dashboard/quick-setup" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1">https://payxmint.com/dashboard/quick-setup <ExternalLink size={12}/></a>.
                     </li>
                     <li>Type in the URL where you want us to send payment callback notifications (e.g., <code>https://yoursite.com/payment-callback</code>).</li>
                     <li>Click <span className="font-bold text-slate-900">Save</span>.</li>
                   </ol>
                </div>
             </section>

             {/* --- STEP 5 --- */}
             <section id="step5" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><Layers size={18}/></div>
                   Step 5: Join the Payment Pool
                </h2>
                <div className="space-y-4 text-[14.5px] text-slate-600 leading-relaxed font-medium">
                   <ol className="list-decimal list-inside space-y-3 pl-2">
                     <li>
                       Go to the <span className="font-bold text-slate-900">Merchant Accounts</span> page: <a href="https://payxmint.com/dashboard/merchant-accounts" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1">https://payxmint.com/dashboard/merchant-accounts <ExternalLink size={12}/></a>.
                     </li>
                     <li>Look for <span className="font-bold text-slate-900">"Platform Pool"</span>.</li>
                     <li>Choose <span className="font-bold text-slate-900">"Use Platform Pool Only"</span>.</li>
                     <li>Click <span className="font-bold text-slate-900">"Apply for Platform Pool"</span>.</li>
                     <li>
                       <span className="font-bold text-slate-900">Wait for Approval:</span> Our operations team will check and approve your request. Once the status shows <span className="font-bold text-emerald-600">APPROVED</span>, you are fully authorized to take pool payments.
                     </li>
                   </ol>
                </div>
             </section>

             {/* --- STEP 6 --- */}
             <section id="step6" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><Cpu size={18}/></div>
                   Step 6: How the System Works (The Technical Part)
                </h2>
                <div className="space-y-6 text-[14px] text-slate-600 leading-relaxed font-medium">
                   <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                     <p>
                       <span className="font-black text-slate-900 uppercase text-xs tracking-wider block">The Hub (Intents Engine)</span>
                       This is the central brain. It manages payment states, stores your custom metadata, and decides which bank account should receive the money based on limit matching and rotation rules.
                     </p>
                     <p>
                       <span className="font-black text-slate-900 uppercase text-xs tracking-wider block">Nodes (Discovery Fleet)</span>
                       These are small headless workers that monitor bank interfaces (GPay/PhonePe) in real-time. When they discover a successful transaction, they notify the matching engine instantly.
                     </p>
                   </div>
                   
                   <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest pl-1 mt-6">Payment Intent Lifecycles</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { name: "PENDING", desc: "Waiting for the customer to complete payment." },
                       { name: "SUCCESS", desc: "Money is verified and crypto-matched to your order." },
                       { name: "EXPIRED", desc: "The payment session timer (15 minutes) ran out." },
                       { name: "FLAGGED", desc: "Requires audit (e.g. duplicate UTR). Staff will resolve." }
                     ].map(state => (
                       <div key={state.name} className="p-4 bg-white border border-slate-200 rounded-xl">
                         <span className="text-[11px] font-black text-indigo-600 tracking-wider block mb-1">{state.name}</span>
                         <span className="text-[12.5px] text-slate-500 font-bold">{state.desc}</span>
                       </div>
                     ))}
                   </div>
                </div>
             </section>

             {/* --- STEP 7 --- */}
             <section id="step7" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><Code size={18}/></div>
                   Step 7: API Reference (Full Details)
                </h2>
                
                <div className="space-y-12">
                   {/* Initiate Payment */}
                   <div>
                     <h3 className="text-lg font-black text-slate-900 mb-2">1. Initiate Payment</h3>
                     <p className="text-[14px] text-slate-500 font-medium mb-4">Call this endpoint to create a new checkout session and receive a direct payment checkout link.</p>
                     
                     <div className="flex items-center gap-3 font-mono text-[12.5px] bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-lg mb-6">
                       <span className="px-2 py-0.5 bg-indigo-600 text-white font-black rounded text-[10px]">POST</span>
                       <span className="font-bold text-slate-800">/payment/initiate</span>
                     </div>

                     <div className="overflow-hidden rounded-xl border border-slate-200 bg-white mb-6">
                       <table className="w-full text-left text-xs border-collapse">
                         <thead>
                           <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-400 uppercase tracking-wider text-[10px]">
                             <th className="p-3 pl-4">Parameter</th>
                             <th className="p-3">Type</th>
                             <th className="p-3">Required</th>
                             <th className="p-3 pr-4">Description</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">public_key</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-rose-500">Yes</td>
                             <td className="p-3 pr-4">Your merchant account public key.</td>
                           </tr>
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">merchant_txn_id</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-rose-500">Yes</td>
                             <td className="p-3 pr-4">Max 64 characters alphanumeric. Unique order reference.</td>
                           </tr>
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">amount</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-rose-500">Yes</td>
                             <td className="p-3 pr-4">The amount to collect, based on account limits (e.g. "5000.00").</td>
                           </tr>
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">redirect_url</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-rose-500">Yes</td>
                             <td className="p-3 pr-4">Must be a valid URL where the buyer is redirected after payment.</td>
                           </tr>
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">buyer_first_name</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-slate-400">No</td>
                             <td className="p-3 pr-4">Max 64 characters alphanumeric.</td>
                           </tr>
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">buyer_last_name</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-slate-400">No</td>
                             <td className="p-3 pr-4">Max 64 characters alphanumeric.</td>
                           </tr>
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">buyer_phone</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-slate-400">No</td>
                             <td className="p-3 pr-4">10-digit phone number.</td>
                           </tr>
                           <tr>
                             <td className="p-3 pl-4 font-mono text-indigo-600">buyer_email</td>
                             <td className="p-3">string</td>
                             <td className="p-3 text-slate-400">No</td>
                             <td className="p-3 pr-4">Max 100 characters.</td>
                           </tr>
                         </tbody>
                       </table>
                     </div>

                     <CodeBlock 
                       language="Bash"
                       code={`curl --request POST \\\n  --url <API_BASE_URL>/payment/initiate \\\n  --header 'Content-Type: application/json' \\\n  --data '{\\n    "public_key": "YOUR_PUBLIC_KEY",\\n    "merchant_txn_id": "pay_202506038627",\\n    "buyer_first_name": "Amit",\\n    "buyer_last_name": "Bansal",\\n    "buyer_phone": "9898989898",\\n    "buyer_email": "amit_bansal@email.com",\\n    "amount": "5000.00",\\n    "redirect_url": "https://merchant.site/thankyou"\\n  }'`}
                     />

                     <p className="text-[14px] text-slate-500 font-medium my-4">Sample Response:</p>
                     <CodeBlock 
                       language="JSON"
                       code={`{\\n  "query": "success",\\n  "code": 200,\\n  "message": "Payment request created",\\n  "timestamp_create": "03-06-2025 09:47:48 PM",\\n  "merchant_txn_id": "pay_202506038627",\\n  "amount": "5000.00",\\n  "buyer_first_name": "Amit",\\n  "buyer_last_name": "Bansal",\\n  "buyer_phone": "9898989898",\\n  "buyer_email": "amit_bansal@email.com",\\n  "redirect_url": "https://merchant.site/thankyou",\\n  "payment_link": "https://gateway.site/checkout/pay_202506038627",\\n  "payment_status": "pending"\\n}`}
                     />
                   </div>

                   {/* Payment Status Check */}
                   <div className="border-t border-slate-100 pt-8">
                     <h3 className="text-lg font-black text-slate-900 mb-2">2. Payment Status Check</h3>
                     <p className="text-[14px] text-slate-500 font-medium mb-4">Query the settlement and bank reference details of any payment transaction using this endpoint.</p>
                     
                     <div className="flex items-center gap-3 font-mono text-[12.5px] bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-lg mb-6">
                       <span className="px-2 py-0.5 bg-indigo-600 text-white font-black rounded text-[10px]">POST</span>
                       <span className="font-bold text-slate-800">/payment/status</span>
                     </div>

                     <CodeBlock 
                       language="Bash"
                       code={`curl --request POST \\\n  --url <API_BASE_URL>/payment/status \\\n  --header 'Content-Type: application/json' \\\n  --data '{\\n    "public_key": "YOUR_PUBLIC_KEY",\\n    "merchant_txn_id": "pay_202506038627"\\n  }'`}
                     />

                     <p className="text-[14px] text-slate-500 font-medium my-4">Sample Response:</p>
                     <CodeBlock 
                       language="JSON"
                       code={`{\\n  "query": "success",\\n  "code": 200,\\n  "message": "Collection details found",\\n  "created": "03-06-2025 09:40:24 PM",\\n  "updated": "03-06-2025 09:40:51 PM",\\n  "device": "mobile",\\n  "mode": "upi",\\n  "gateway": "smart_collect",\\n  "platform_txn_id": "pay_202506035445",\\n  "gateway_txn_id": "pay_202506035445",\\n  "bank_txn_id": "5477419633",\\n  "buyer_first_name": "Ajay",\\n  "buyer_last_name": "Bansal",\\n  "buyer_phone": "9898989898",\\n  "buyer_email": "ajay.b@email.com",\\n  "amount": "799.00",\\n  "fee": "22.40",\\n  "net_amount": "776.60",\\n  "redirect_url": "https://merchant.site/thankyou",\\n  "remark": "submitted",\\n  "status": "success"\\n}`}
                     />
                   </div>

                   </div>
             </section>

             {/* --- STEP 8 --- */}
             <section id="step8" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><ShieldCheck size={18}/></div>
                   Step 8: Webhooks & Safety
                </h2>
                
                <div className="space-y-8 text-[14px] text-slate-600 leading-relaxed font-medium">
                   <div>
                     <h3 className="text-[15px] font-black text-slate-900 mb-2">1. Webhook Signature Verification</h3>
                     <p className="text-slate-500 mb-4">Always verify the webhook signature to protect your application endpoint against spoofing. Use this implementation pattern to verify payloads securely:</p>
                     <CodeBlock 
                       language="JavaScript"
                       code={`// Define the secret key\\nsecret_key = 'secret_key'\\n\\n// Read HTTP headers from the request\\ntimestamp = getHeader('X-Timestamp')\\nsignature = getHeader('X-Signature')\\n\\n// Read raw request body\\nraw_body = getRawBody()\\n\\n// Initialize response\\nresponse = {\\n  'status': 'failure',\\n  'message': ''\\n}\\n\\n// Ensure required values are present\\nif timestamp and signature and raw_body:\\n  signed_payload = timestamp + '.' + raw_body\\n  expected_signature = base64encode(HMAC_SHA256(signed_payload, secret_key))\\n  if secureCompare(expected_signature, signature):\\n    response['status'] = 'success'\\n    response['message'] = 'Webhook verified and accepted'\\n  else:\\n    response['message'] = 'Invalid signature'\\nelse:\\n  response['message'] = 'Missing timestamp, signature, or body'\\n\\n// Send JSON response back to the sender\\nsendJSONResponse(response)`}
                     />
                   </div>

                   <div className="border-t border-slate-100 pt-8">
                     <h3 className="text-[15px] font-black text-slate-900 mb-2">2. Sample Payment Webhook Payload</h3>
                     <p className="text-slate-500 mb-4">Below is a sample notification payload that is POSTed securely to your designated webhook endpoint upon collection verification:</p>
                     <CodeBlock 
                       language="JSON"
                       code={`{\\n  "event_type": "collection_notification",\\n  "data": {\\n    "timestamp_create": 1748553768,\\n    "timestamp_update": 1748635750,\\n    "pid": "btx_wmK6wBC7BF0N6Rb5",\\n    "device": "desktop",\\n    "payment_method": "upi",\\n    "gateway": "smart_collect",\\n    "platform_txn_id": "pay_202505298531",\\n    "gateway_txn_id": "pay_202505298531",\\n    "bank_txn_id": "541254875525",\\n    "buyer_first_name": "Ajay",\\n    "buyer_last_name": "Bansal",\\n    "buyer_phone": "9898989898",\\n    "buyer_email": "ajay.b@email.com",\\n    "amount": 388,\\n    "remark": "attempted",\\n    "status": "success"\\n  }\\n}`}
                     />
                   </div>

                   <div className="border-t border-slate-100 pt-8">
                     <h3 className="text-[15px] font-black text-slate-900 mb-2">3. Idempotency (Preventing Duplicates)</h3>
                     <p className="text-slate-505 font-black">
                       We enforce strict request idempotency. Always supply a unique value in the <code>Idempotency-Key</code> header of your HTTP request. If you send the same key twice within 24 hours, our hub will return the pre-computed cached response to guarantee duplicate billing is physically impossible.
                     </p>
                   </div>
                </div>
             </section>{/* --- STEP 9 --- */}
             <section id="step9" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><AlertTriangle size={18}/></div>
                   Step 9: Error Codes
                </h2>
                <div className="space-y-6 text-[14px] text-slate-600 leading-relaxed font-medium">
                   <p className="text-slate-500">If an API request fails, we return a standard structured error payload alongside the appropriate HTTP status code.</p>
                   
                   <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                     <table className="w-full text-left text-xs border-collapse">
                       <thead>
                         <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-400 uppercase tracking-wider text-[10px]">
                           <th className="p-3 pl-4">HTTP Code</th>
                           <th className="p-3">Meaning</th>
                           <th className="p-3 pr-4">Common Root Cause</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                         <tr>
                           <td className="p-3 pl-4 font-mono text-rose-600">401 Unauthorized</td>
                           <td className="p-3">Authentication Failed</td>
                           <td className="p-3 pr-4">Your API token is missing, expired, or invalid.</td>
                         </tr>
                         <tr>
                           <td className="p-3 pl-4 font-mono text-rose-600">403 Forbidden</td>
                           <td className="p-3">IP Restriction Match</td>
                           <td className="p-3 pr-4">The server IP making the API call is not registered on your whitelist.</td>
                         </tr>
                         <tr>
                           <td className="p-3 pl-4 font-mono text-rose-600">409 Conflict</td>
                           <td className="p-3">Resource Conflict</td>
                           <td className="p-3 pr-4">That order_id or Idempotency-Key has already been processed.</td>
                         </tr>
                         <tr>
                           <td className="p-3 pl-4 font-mono text-rose-600">429 Rate Limit</td>
                           <td className="p-3">Usage limit Hit</td>
                           <td className="p-3 pr-4">You have exceeded the 60 requests per minute quota limit.</td>
                         </tr>
                         <tr>
                           <td className="p-3 pl-4 font-mono text-rose-600">503 Unavailable</td>
                           <td className="p-3">No Pool VPAs Available</td>
                           <td className="p-3 pr-4">No active platform pool accounts currently fit this ticket size bounds.</td>
                         </tr>
                       </tbody>
                     </table>
                   </div>

                   <CodeBlock 
                     code={`{\n  "error": {\n    "type": "invalid_request_error",\n    "code": "parameter_missing",\n    "message": "The 'amount' parameter is required."\n  }\n}`}
                   />
                </div>
             </section>

             {/* --- STEP 10 --- */}
             <section id="step10" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><HelpCircle size={18}/></div>
                   Step 10: Troubleshooting
                </h2>
                
                <div className="space-y-6 text-[14px] text-slate-600 leading-relaxed font-medium">
                   <div className="space-y-4">
                     <p>
                       <span className="font-bold text-slate-950 block">Unmatched Payments</span>
                       If a customer pays an incorrect amount, or there is an issue, the transaction goes to the <span className="font-bold">Unmatched Ledger</span> in your merchant dashboard.
                     </p>
                     <p>
                       <span className="font-bold text-slate-950 block">Manual Binding</span>
                       Merchants or admins can manually bind unmatched transactions directly to pending intents. This instantly updates the status to SUCCESS and queues your webhook callback.
                     </p>
                     <p>
                       <span className="font-bold text-slate-950 block">Node Sync Status</span>
                       If a bot sync node drops offline, automated transaction matching is temporarily suspended for that VPA. Monitor the status feed in the control console to ensure online connectivity.
                     </p>
                   </div>
                </div>
             </section>

             {/* --- CHECKLIST --- */}
             <section id="checklist" className="mb-20 scroll-mt-24 border-t border-slate-100 pt-16">
                <h2 className="text-2xl font-black text-slate-705 mb-6 tracking-tight flex items-center gap-3">
                   <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/10"><CheckSquare size={18}/></div>
                   Final Production Checklist
                </h2>
                
                <div className="p-6 bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl shadow-xl shadow-blue-100/10 space-y-4 font-bold text-xs uppercase tracking-wider">
                   {[
                     "Account is APPROVED for Platform Pool operation.",
                     "Idempotency-Key header is supplied with every API call.",
                     "Webhook signatures are fully verified on your servers.",
                     "IP Whitelist includes all production/testing backend server IPs.",
                     "Secret API Key is stored securely in env (never hardcoded)."
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center gap-3 border-b border-blue-100/50 pb-3 last:border-b-0 last:pb-0">
                       <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
                         <Check size={12} className="text-white" />
                       </div>
                       <span className="text-slate-700 normal-case font-medium text-[13.5px] leading-relaxed">{item}</span>
                     </div>
                   ))}
                </div>

                <div className="mt-8 text-center text-slate-400 font-bold text-xs">
                   Need programmatic assistance? Contact our engineering team at <a href="mailto:infra@payxmint.com" className="text-blue-600 hover:underline font-bold">infra@payxmint.com</a>.
                </div>
             </section>

             {/* --- FOOTER --- */}
             <footer className="mt-32 pt-8 border-t border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-black shadow-sm shadow-blue-600/20">W</div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2026 WaveCollect Developers Portal</span>
                   </div>
                   <div className="flex gap-6">
                      <Link href="/dashboard" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Status Feed</Link>
                      <Link href="/dashboard" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Security compliance</Link>
                      <Link href="/dashboard" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Legal Portal</Link>
                   </div>
                </div>
             </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
