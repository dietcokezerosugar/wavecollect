"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  Globe,
  Webhook,
  ShieldCheck,
  Gift,
  Book,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Code,
  Smartphone,
  Save,
  Lock,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickSetup() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [ipStatus, setIpStatus] = useState<"NONE" | "PENDING" | "APPROVED">("NONE");
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("CONFIG"); // CONFIG or DOCS

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, ipRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/dashboard/ip-whitelist")
      ]);
      const sData = await settingsRes.json();
      const iData = await ipRes.json();

      if (sData.data) {
        setWebhookUrl(sData.data.webhookUrl || "");
        setRedirectUrl(sData.data.redirectUrl || "");
        setAgentInfo(sData.data.agent || null);
        setTrialEndsAt(sData.data.trialEndsAt || null);
      }
      
      const pending = iData.data?.find((r: any) => r.status === "PENDING");
      const approved = iData.data?.find((r: any) => r.status === "APPROVED");
      
      if (approved) setIpStatus("APPROVED");
      else if (pending) setIpStatus("PENDING");
    } finally {
      setLoading(false);
    }
  };

  const isTrialActive = trialEndsAt && new Date(trialEndsAt) > new Date();

  const handleQuickSave = async () => {
    setSaving(true);
    try {
      // 1. Save Settings
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl, redirectUrl }),
      });

      // 2. Link Referral if provided and not already linked
      if (referralCode && !agentInfo) {
        const refRes = await fetch("/api/settings/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: referralCode }),
        });
        const refData = await refRes.json();
        if (refData.status === "success") setAgentInfo(refData.agent);
      }

      // Refresh Data
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const applyWhitelist = () => {
    window.location.href = "/dashboard/ip-whitelist";
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Zap size={10} fill="currentColor" /> Express Onboarding
              </div>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">Ultimate Quick Setup</h1>
           <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Configure your entire gateway in 60 seconds</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-md border border-slate-200 shadow-inner">
           <button 
             onClick={() => setActiveTab("CONFIG")}
             className={`px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CONFIG' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Configuration
           </button>
           <button 
             onClick={() => setActiveTab("DOCS")}
             className={`px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'DOCS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Documentation
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "CONFIG" ? (
          <motion.div 
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Form */}
            <div className="lg:col-span-7 space-y-8">
               <div className="bg-white rounded-[40px] border border-slate-200 p-10 space-y-10 shadow-sm shadow-slate-200/50">
                  
                  {/* Webhook & Redirect */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100">
                           <Globe size={20} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Endpoints</h3>
                     </div>
                     <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Webhook URL</label>
                           <input 
                             value={webhookUrl}
                             onChange={(e) => setWebhookUrl(e.target.value)}
                             placeholder="https://your-api.com/callback"
                             className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Success Redirect</label>
                           <input 
                             value={redirectUrl}
                             onChange={(e) => setRedirectUrl(e.target.value)}
                             placeholder="https://yoursite.com/success"
                             className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                           />
                        </div>
                     </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* IP Whitelist & Referrals */}
                  <div className="grid md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center border border-emerald-100">
                              <ShieldCheck size={20} />
                           </div>
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Security Access</h3>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                           <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                              Enable automated transaction verification for your server IP.
                           </p>
                           {ipStatus === 'APPROVED' ? (
                             <div className="py-3 px-4 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-emerald-600/20">
                                Whitelist Active
                             </div>
                           ) : ipStatus === 'PENDING' ? (
                             <div className="py-3 px-4 bg-amber-500 text-white rounded-md text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                                Under Review
                             </div>
                           ) : (
                             <button 
                               onClick={applyWhitelist}
                               className="w-full py-4 bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                             >
                               Apply for IP Whitelist
                             </button>
                           )}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center border border-amber-100">
                              <Gift size={20} />
                           </div>
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Partnership</h3>
                        </div>
                        <div className="space-y-4">
                           {agentInfo ? (
                             <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg flex flex-col items-center justify-center text-center space-y-2">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Linked Agent</p>
                                <p className="text-sm font-black text-blue-900">{agentInfo.name}</p>
                             </div>
                           ) : (
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Referral Code</label>
                                <input 
                                  value={referralCode}
                                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                  placeholder="WAVE-PARTNER-123"
                                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                                />
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="pt-6">
                     <button 
                       onClick={handleQuickSave}
                       disabled={saving}
                       className="w-full py-6 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-4"
                     >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Commit Configuration Everywhere
                     </button>
                  </div>
               </div>
            </div>

            {/* Right Column: Steps & Preview */}
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-slate-900 rounded-[40px] p-10 text-white space-y-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 space-y-6">
                     <h3 className="text-xl font-black tracking-tight">Onboarding Progress</h3>
                     <div className="space-y-4">
                        <ProgressStep title="Global Endpoints" completed={!!webhookUrl && !!redirectUrl} />
                        <ProgressStep title="Security Whitelist" completed={ipStatus === 'APPROVED'} />
                        <ProgressStep title="Referral Binding" completed={!!agentInfo} />
                        <ProgressStep title="First Bot Linked" completed={true} /> {/* Placeholder for accounts */}
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active API Endpoint</h3>
                     <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black">STABLE</span>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-md font-mono text-xs text-slate-600 border border-slate-200 break-all select-all cursor-pointer hover:bg-slate-100 transition-colors">
                     https://api.payxmint.com/v1/create-intent
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-slate-400 text-center leading-relaxed">
                     Once setup is complete, you can start dispatching payment intents to this endpoint.
                  </p>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="docs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm shadow-slate-200/50"
          >
             <div className="grid lg:grid-cols-4 min-h-[600px]">
                <aside className="bg-slate-50 border-r border-slate-100 p-8 space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Start</h4>
                   <div className="space-y-1">
                      <DocNav label="Overview" active />
                      <DocNav label="Authentication" />
                      <DocNav label="Creating Intents" />
                      <DocNav label="Webhook Schema" />
                      <DocNav label="Error Codes" />
                   </div>
                </aside>
                <div className="lg:col-span-3 p-12 space-y-8 max-h-[800px] overflow-y-auto custom-scrollbar">
                   <div className="space-y-4">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">API Integration Overview</h2>
                      <p className="text-slate-500 font-medium leading-relaxed">
                         PayxMint provides a high-fidelity, dual-engine UPI automation gateway. Integration requires 3 main steps:
                      </p>
                   </div>

                   <div className="space-y-6">
                      <div className="p-8 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-600/20">1</span>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Create Payment Intent</h4>
                         </div>
                         <div className="bg-slate-900 rounded-md p-6 font-mono text-[11px] text-blue-200 overflow-x-auto">
                            <span className="text-emerald-400">POST</span> /v1/create-intent<br/>
                            {'{'} <br/>
                            &nbsp;&nbsp;"amount": 500.00,<br/>
                            &nbsp;&nbsp;"order_id": "ORD_12345",<br/>
                            &nbsp;&nbsp;"customer_email": "user@example.com"<br/>
                            {'}'}
                         </div>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-600/20">2</span>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Receive Webhook</h4>
                         </div>
                         <p className="text-[11px] font-medium text-slate-500 leading-relaxed px-1">
                            We will POST to your configured Webhook URL once the transaction is verified on the GPay node.
                         </p>
                         <div className="bg-slate-900 rounded-md p-6 font-mono text-[11px] text-blue-200 overflow-x-auto">
                            {'{'} <br/>
                            &nbsp;&nbsp;"status": "SUCCESS",<br/>
                            &nbsp;&nbsp;"order_id": "ORD_12345",<br/>
                            &nbsp;&nbsp;"utr": "412239102931"<br/>
                            {'}'}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressStep({ title, completed }: { title: string, completed: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-md border border-white/5">
       <div className="flex items-center gap-3">
          {completed ? (
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
               <CheckCircle2 size={12} className="text-white" />
            </div>
          ) : (
            <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
            </div>
          )}
          <span className={`text-[11px] font-bold ${completed ? 'text-white' : 'text-slate-500'}`}>{title}</span>
       </div>
       {completed && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Done</span>}
    </div>
  );
}

function DocNav({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <button className={`w-full text-left px-4 py-3 rounded-md text-[11px] font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-slate-200/50 hover:text-slate-600'}`}>
       {label}
    </button>
  );
}
