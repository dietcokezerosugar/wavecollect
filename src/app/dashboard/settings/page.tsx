"use client";

import { useState, useEffect } from "react";
import { 
  Globe, 
  Bell, 
  Smartphone, 
  CheckCircle2, 
  Save, 
  Zap, 
  Plus, 
  XCircle, 
  ShieldAlert, 
  ShieldCheck,
  Activity,
  Palette,
  Lock,
  ArrowUpRight,
  Server,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [redirectUrl, setRedirectUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandName, setBrandName] = useState("");
  const [showSupportEmail, setShowSupportEmail] = useState(true);
  const [apiAccessStatus, setApiAccessStatus] = useState("NOT_REQUESTED");
  const [processingMode, setProcessingMode] = useState("OWN_ACCOUNT");
  const [referralCode, setReferralCode] = useState("");
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setRedirectUrl(d.data.redirectUrl || "");
          setWebhookUrl(d.data.webhookUrl || "");
          setIpWhitelist(d.data.ipWhitelist || "");
          setTelegramBotToken(d.data.telegramBotToken || "");
          setTelegramChatId(d.data.telegramChatId || "");
          setWebhookSecret(d.data.webhookSecret || "");
          setBrandColor(d.data.brandColor || "#2563eb");
          setBrandLogo(d.data.brandLogo || "");
          setBrandName(d.data.brandName || "");
          setShowSupportEmail(d.data.showSupportEmail ?? true);
          setApiAccessStatus(d.data.apiAccessStatus || "NOT_REQUESTED");
          setProcessingMode(d.data.processingMode || "OWN_ACCOUNT");
          setAgentInfo(d.data.agent || null);
        }
      });
  }, []);

  async function linkReferral() {
    setApplying(true);
    try {
      const res = await fetch("/api/settings/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralCode }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setAgentInfo(data.agent);
      } else {
        alert(data.error || "Invalid referral code");
      }
    } finally {
      setApplying(false);
    }
  }

  async function saveConfig() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        redirectUrl, 
        webhookUrl, 
        telegramBotToken, 
        telegramChatId,
        brandColor,
        brandLogo,
        brandName,
        showSupportEmail,
        processingMode
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function applyForAccess() {
    window.location.href = "/dashboard/ip-whitelist";
  }

  async function rotateWebhookSecret() {
    if (!confirm("Rotating your secret will break existing webhook verifications until you update your server. Continue?")) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ROTATE_SECRET" }),
    });
    const data = await res.json();
    if (data.secret) setWebhookSecret(data.secret);
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 font-sans max-w-5xl mx-auto px-4 md:px-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Control Center</h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Global platform architecture & environment security</p>
        </div>
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${
             apiAccessStatus === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
             apiAccessStatus === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-100" :
             "bg-slate-50 text-slate-400 border-slate-200"
           }`}>
              <Activity className={`w-3.5 h-3.5 ${apiAccessStatus === "PENDING" ? "animate-pulse" : ""}`} />
              API Status: {apiAccessStatus.replace("_", " ")}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* API Access Approval Section */}
          {apiAccessStatus !== "APPROVED" && (
            <section className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Lock className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black tracking-tight">API Access Request</h2>
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">One-time compliance verification</p>
                     </div>
                  </div>
                  <p className="text-blue-50 text-sm font-medium leading-relaxed max-w-md">
                    To maintain ecosystem integrity, external API access requires a one-time verification. Applying will notify our compliance team to audit your account nodes.
                  </p>
                  <button 
                    onClick={applyForAccess}
                    disabled={apiAccessStatus === "PENDING"}
                    className="px-8 py-4 bg-white text-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                  >
                    {apiAccessStatus === "PENDING" ? "Application Under Review" : "Apply for API Whitelisting"}
                  </button>
               </div>
            </section>
          )}

          {/* Core Integration Details */}
          <section className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-8 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                   <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Network Architecture</h3>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Callback URL (Redirect)</label>
                   <input 
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      placeholder="https://yoursite.com/done"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Event Stream (Webhook)</label>
                   <input 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.yoursite.com/webhook"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                   />
                </div>
                <div className="space-y-3 col-span-2">
                   <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Webhook Signing Secret</label>
                      <button 
                        onClick={rotateWebhookSecret}
                        className="text-[9px] font-black text-rose-500 uppercase hover:underline"
                      >
                        Rotate Secret
                      </button>
                   </div>
                   <div className="relative group">
                      <input 
                          type="text"
                          readOnly
                          value={webhookSecret || "Not Generated"}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-xs font-mono font-bold text-slate-600 outline-none pr-24"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(webhookSecret);
                          alert("Secret copied to clipboard");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-blue-600 shadow-sm"
                      >
                        Copy
                      </button>
                   </div>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter px-1">
                      Use this secret to verify the <code className="text-blue-600">X-Wave-Signature</code> header in incoming webhooks.
                   </p>
                </div>
                {/* Managed Infrastructure */}
                <div className="space-y-4 pt-4 border-t border-slate-50 col-span-2">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                         <ShieldCheck className="text-blue-600 w-4 h-4" />
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Managed Infrastructure</label>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                         <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Verified System</span>
                      </div>
                   </div>
                   
                   <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-between group hover:border-blue-200 transition-all shadow-inner">
                      <div className="space-y-1">
                         <p className="text-[11px] font-black text-slate-900 leading-none">
                            {ipWhitelist || "Awaiting First Request"}
                         </p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            Active Traffic Origination Node
                         </p>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-300 shadow-sm">
                         <Lock size={18} />
                      </div>
                   </div>
                   
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter px-1 leading-relaxed max-w-md">
                      This whitelist is automatically updated upon approval of your <a href="/dashboard/ip-whitelist" className="text-blue-600 hover:underline font-black">Security Access Requests</a>. Manual editing is restricted for platform integrity.
                   </p>
                </div>
             </div>
          </section>
          
          {/* Processing Mode Selection */}
          <section className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-8 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                   <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Processing Infrastructure</h3>
             </div>

             <div className="grid md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setProcessingMode("OWN_ACCOUNT")}
                  className={`p-6 rounded-[28px] border text-left transition-all relative overflow-hidden group ${
                    processingMode === "OWN_ACCOUNT" ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20" : "bg-slate-50 border-slate-100 text-slate-900 hover:border-slate-200"
                  }`}
                >
                   <div className="relative z-10 space-y-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${processingMode === "OWN_ACCOUNT" ? "bg-white/10" : "bg-white shadow-sm text-slate-400"}`}>
                         <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase tracking-widest">Own Managed Account</p>
                         <p className={`text-[10px] font-medium leading-relaxed mt-1 ${processingMode === "OWN_ACCOUNT" ? "text-slate-400" : "text-slate-500"}`}>
                            Route orders through your staff-approved GPay accounts.
                         </p>
                      </div>
                   </div>
                   {processingMode === "OWN_ACCOUNT" && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-emerald-400" />}
                </button>

                <button 
                   onClick={() => setProcessingMode("PLATFORM_POOL")}
                   className={`p-6 rounded-[28px] border text-left transition-all relative overflow-hidden group ${
                     processingMode === "PLATFORM_POOL" ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20" : "bg-slate-50 border-slate-100 text-slate-900 hover:border-slate-200"
                   }`}
                >
                   <div className="relative z-10 space-y-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${processingMode === "PLATFORM_POOL" ? "bg-white/10" : "bg-white shadow-sm text-blue-600"}`}>
                         <Globe className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase tracking-widest">Platform Account Pool</p>
                         <p className={`text-[10px] font-medium leading-relaxed mt-1 ${processingMode === "PLATFORM_POOL" ? "text-blue-100" : "text-slate-500"}`}>
                            Leverage shared platform accounts for instant scalability.
                         </p>
                      </div>
                   </div>
                   {processingMode === "PLATFORM_POOL" && <CheckCircle2 className="absolute top-6 right-6 w-5 h-5 text-white" />}
                </button>
             </div>
             
             <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase tracking-tight">
                   Note: Switching modes affects routing immediately. Ensure your managed accounts are "ONLINE" before selecting "Own Managed Account".
                </p>
             </div>
          </section>

          {/* Referral Program */}
          <section className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-8 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                   <Gift className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Referral Network</h3>
             </div>

             <div className="space-y-4">
                {agentInfo ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[24px] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 font-black border border-emerald-200">
                           {agentInfo.name[0]}
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Linked Agent</p>
                           <p className="text-sm font-black text-slate-900">{agentInfo.name}</p>
                        </div>
                     </div>
                     <div className="px-3 py-1 bg-white rounded-lg border border-emerald-200 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        Partner Active
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-md">
                        Were you referred to PayxMint? Enter your partner's referral code below to link your account to their network.
                     </p>
                     <div className="flex flex-col md:flex-row gap-3">
                        <input 
                           value={referralCode}
                           onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                           placeholder="Enter Referral Code (e.g. WAVE-123)"
                           className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none placeholder:font-bold placeholder:text-slate-300"
                        />
                        <button 
                           onClick={linkReferral}
                           disabled={!referralCode || applying}
                           className="px-8 py-4 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                        >
                           {applying ? "Verifying..." : "Link Account"}
                        </button>
                     </div>
                  </div>
                )}
              </div>
           </section>

           {/* Branding & Appearance */}
           <section className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-8 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                    <Palette className="w-5 h-5" />
                 </div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Checkout Branding</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Business Name</label>
                    <input 
                       value={brandName}
                       onChange={(e) => setBrandName(e.target.value)}
                       placeholder="e.g. Acme Payments"
                       className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all outline-none"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Brand Color</label>
                    <div className="flex gap-3">
                       <input 
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="h-13 w-13 rounded-xl border-none cursor-pointer bg-transparent"
                       />
                       <input 
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-mono font-bold text-slate-900 focus:bg-white transition-all outline-none"
                       />
                    </div>
                 </div>
                 <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Logo URL (Transparent PNG Rec.)</label>
                    <input 
                       value={brandLogo}
                       onChange={(e) => setBrandLogo(e.target.value)}
                       placeholder="https://cdn.yoursite.com/logo.png"
                       className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:bg-white outline-none"
                    />
                 </div>
                 
                 <div className="col-span-2 p-6 bg-slate-50 rounded-[28px] border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[11px] font-black text-slate-900">Show Support Identity</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Display your email on the checkout page</p>
                    </div>
                    <button 
                      onClick={() => setShowSupportEmail(!showSupportEmail)}
                      className={`w-12 h-6 rounded-full relative transition-all ${showSupportEmail ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showSupportEmail ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
              </div>

              {/* Live Preview */}
              <div className="pt-4 border-t border-slate-50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Live Checkout Preview</p>
                 <div className="bg-slate-100 rounded-[32px] p-8 flex items-center justify-center">
                    <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                       <div className="p-4 border-b border-slate-50 flex items-center justify-between" style={{ borderTop: `4px solid ${brandColor}` }}>
                          {brandLogo ? <img src={brandLogo} alt="Logo" className="h-6 object-contain" /> : <div className="w-6 h-6 bg-slate-100 rounded-full" />}
                          <span className="text-[10px] font-black text-slate-900">{brandName || "Merchant Name"}</span>
                       </div>
                       <div className="p-6 space-y-4">
                          <div className="h-10 w-full bg-slate-50 rounded-xl" />
                          <button className="w-full py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: brandColor }}>
                             Pay Securely
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </section>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-6 shadow-xl shadow-slate-900/10">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
             </div>
             <h3 className="text-xl font-black tracking-tight">Security Hardening</h3>
             <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Ensure your callback endpoints are secured with TLS 1.3. For high-throughput environments, we recommend IP whitelisting to prevent unauthorized request injection.
             </p>
             <div className="pt-4 border-t border-white/5">
                <button
                  onClick={saveConfig}
                  disabled={saved}
                  className={`w-full py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    saved ? "bg-emerald-500 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {saved ? "Configuration Committed" : "Save All Changes"}
                </button>
             </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6">
             <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Environment Info</h3>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Tier</span>
                   <span className="text-[11px] font-black text-slate-900">ENTERPRISE</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency Avg</span>
                   <span className="text-[11px] font-black text-emerald-600">42ms</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SSL Status</span>
                   <span className="text-[11px] font-black text-blue-600 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> SECURE
                   </span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
