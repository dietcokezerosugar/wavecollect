"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Smartphone, Plus, Play, Square, RefreshCw, Terminal as TerminalIcon, Power, CheckCircle2, ShieldCheck, AlertTriangle, Key, Loader2, ArrowRight, X, Clock
} from "lucide-react";

interface GPayAccount {
  id: string;
  name: string;
  email: string;
  upiId: string;
  reportId: string | null;
  status: string;
  desiredStatus: string;
  reviewStatus: string;
  sessionStatus: string;
  monthlyLimit: number;
  usedAmount: number;
  pm2Status?: "online" | "stopped" | "errored" | "unknown";
  lastAction?: string;
  lastActionTime?: string;
}

export default function MerchantAccountsPage() {
  const [accounts, setAccounts] = useState<GPayAccount[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUpiId, setNewUpiId] = useState("");
  const [newMinTicket, setNewMinTicket] = useState("");
  const [newMaxTicket, setNewMaxTicket] = useState("");
  const [newProxy, setNewProxy] = useState("");

  const [autoLoginLogs, setAutoLoginLogs] = useState<string[]>([]);
  const [isLoginComplete, setIsLoginComplete] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);

  const [activeLogBot, setActiveLogBot] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [botStats, setBotStats] = useState<any>(null);

  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  // Pool State
  const [poolState, setPoolState] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
    fetchPoolStatus();
    const interval = setInterval(() => {
      fetchAccounts();
      fetchPoolStatus();
    }, 8000); // Poll PM2 status and pool status
    return () => clearInterval(interval);
  }, []);

  // Poll live logs for a specific bot (Bridged Deep Fix)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeLogBot) {
      const fetchLiveLogs = async () => {
        try {
          // 1. Try to fetch from the Engine Stream Proxy
          const streamRes = await fetch(`/api/bots/stream?name=${activeLogBot}`);
          const streamData = await streamRes.json();
          
          if (streamData.status === "online") {
            if (streamData.logs) setLiveLogs(streamData.logs);
            if (streamData.stats) setBotStats(streamData.stats);
          } else {
            // 2. Fallback to Login Progress if engine not yet online
            const loginRes = await fetch(`/api/bots/login/progress?name=${activeLogBot}`);
            const loginData = await loginRes.json();
            if (loginData.logs) setLiveLogs(loginData.logs);
            setBotStats(null);
          }
        } catch (e) {
          console.error("Log Bridge Error:", e);
        }
      };
      fetchLiveLogs();
      interval = setInterval(fetchLiveLogs, 1500);
    } else {
      setLiveLogs([]);
    }
    return () => clearInterval(interval);
  }, [activeLogBot]);

  function formatUptime(sec: number) {
    if (!sec) return "0s";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/gpay-accounts");
      const data = await res.json();
      setAccounts(data.data || []);
    } catch (e) {
      console.error("Critical Fetch Error:", e);
    }
  }

  async function updateAccount(id: string, updates: any) {
    await fetch("/api/gpay-accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchAccounts();
  }

  async function toggleAccountStatus(id: string, newStatus: string) {
    await updateAccount(id, { status: newStatus });
  }

  async function deleteAccount(id: string) {
    if (!confirm(`Are you sure you want to delete this account?`)) return;
    await fetch(`/api/gpay-accounts?id=${id}`, { method: "DELETE" });
    fetchAccounts();
  }

  async function fetchPoolStatus() {
    try {
      const res = await fetch("/api/merchant/pool-request");
      const json = await res.json();
      if (json.status === "success") {
        setPoolState(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch pool status", e);
    }
  }

  async function toggleProcessingMode(mode: string) {
    try {
      await fetch("/api/merchant/pool-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      fetchPoolStatus();
    } catch (e) {
      console.error("Failed to toggle mode", e);
    }
  }

  async function applyForPool() {
    try {
      const res = await fetch("/api/merchant/pool-request", {
        method: "POST",
      });
      const json = await res.json();
      if (json.status === "success") {
        fetchPoolStatus();
      } else {
        alert(json.error || "Failed to request pool account");
      }
    } catch (e) {
      console.error("Failed to apply for pool", e);
    }
  }

  const submitForReview = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/gpay-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          upiId: newUpiId,
          password: newPassword,
          proxyConfig: newProxy,
          minTicket: newMinTicket,
          maxTicket: newMaxTicket,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setWizardStep(3);
        fetchAccounts();
      } else {
        alert(data.message || "Failed to submit account");
      }
    } catch (e) {
      alert("Error submitting account");
    } finally {
      setIsSubmitting(false);
    }
  };

  function resetWizard() {
    setShowWizard(false);
    setWizardStep(1);
    setNewName(""); setNewEmail(""); setNewPassword(""); setConfirmPassword(""); setNewUpiId(""); setNewMinTicket(""); setNewMaxTicket(""); setNewProxy("");
  }

  async function submitOtp(name: string) {
    const code = otpInputs[name];
    if (!code) return;
    await fetch("/api/bots/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, action: "submit_otp", otpCode: code }),
    });
    setOtpInputs(prev => ({...prev, [name]: ""}));
    fetchAccounts();
    alert("OTP sent to the remote engine. Please wait for synchronization to complete.");
  }

  return (
    <div className="space-y-8 pb-24 font-sans max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Merchant Fleet</h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium">Configure and monitor your Google Pay automated nodes.</p>
        </div>
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className="w-full md:w-auto px-6 py-3.5 bg-blue-600 text-white rounded-md text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            disabled={accounts.length >= 10}
          >
            <Plus className="w-4 h-4" /> Add New Node
          </button>
        )}
      </div>

      {/* Processing Mode Toggle */}
      {poolState && (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Payment Processing Mode</h2>
            <div className="flex bg-slate-50 p-1.5 rounded-md border border-slate-200 max-w-sm">
              <button 
                onClick={() => toggleProcessingMode("OWN_ACCOUNT")}
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  poolState.processingMode === "OWN_ACCOUNT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Self Account
              </button>
              <button 
                onClick={() => toggleProcessingMode("PLATFORM_POOL")}
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  poolState.processingMode === "PLATFORM_POOL" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Platform Pool
              </button>
            </div>
          </div>

          {poolState.processingMode === "PLATFORM_POOL" && (
            <div className="pt-2 border-t border-slate-100">
              {poolState.poolRequestStatus === "APPROVED" && poolState.allocation ? (
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-emerald-50 rounded-md border border-emerald-100">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900">Platform Account Active</h3>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-[9px] font-black uppercase rounded-full">
                        {poolState.allocation.sessionStatus}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 font-mono">UPI ID: {poolState.allocation.upiId}</p>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-black text-emerald-700 uppercase mb-1">
                        <span>Quota Used: ₹{(Number(poolState.allocation.usedQuota)).toLocaleString()}</span>
                        <span>₹{(Number(poolState.allocation.totalQuota)).toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-emerald-200/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${poolState.allocation.allocationStatus === "EXHAUSTED" ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min((Number(poolState.allocation.usedQuota) / Number(poolState.allocation.totalQuota)) * 100, 100)}%` }}
                        />
                      </div>
                      {poolState.allocation.allocationStatus === "EXHAUSTED" && (
                         <p className="text-[10px] text-rose-600 font-bold mt-1 uppercase tracking-widest">Quota Exhausted. API Paused.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : poolState.poolRequestStatus === "PENDING" ? (
                <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-md border border-amber-100">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-amber-900">Request Pending</h3>
                    <p className="text-xs font-medium text-amber-700">Admin will allocate a platform account to you shortly.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-50 rounded-md border border-slate-200">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Use Platform Accounts</h3>
                    <p className="text-xs font-medium text-slate-500 max-w-lg mt-1">
                      Let the platform handle Google Pay nodes and transaction routing. Simply request access and start processing payments through our shared infrastructure.
                    </p>
                  </div>
                  <button 
                    onClick={applyForPool}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shrink-0"
                  >
                    Apply for Platform Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showWizard && (
        <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden mx-2 md:mx-0">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/30 gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Node Onboarding</h2>
            <div className="flex items-center gap-1 md:gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 overflow-x-auto whitespace-nowrap pb-1 md:pb-0 scrollbar-hide">
              <span className={`${wizardStep >= 1 ? 'text-blue-600' : ''}`}>1. Security</span>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={`${wizardStep >= 2 ? 'text-blue-600' : ''}`}>2. Credentials</span>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={`${wizardStep >= 3 ? 'text-blue-600' : ''}`}>3. Sync</span>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {wizardStep === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">Mandatory Security Step</h3>
                  <p className="text-sm md:text-base text-slate-500 leading-relaxed px-4">
                    To automate verification, you <strong>must disable 2FA</strong> and phone prompts on the Google Account. This ensures the headless engine can verify sessions autonomously.
                  </p>
                </div>
                <div className="pt-4 flex flex-col md:flex-row items-center justify-center gap-3">
                  <button onClick={resetWizard} className="w-full md:w-auto px-8 py-3.5 bg-slate-50 text-slate-500 rounded-md font-black uppercase text-[11px] tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors order-2 md:order-1">Cancel</button>
                  <button onClick={() => setWizardStep(2)} className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-md font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-all order-1 md:order-2 shadow-lg shadow-blue-600/20">I Understand</button>
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="grid gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Internal Alias</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value.replace(/\s+/g, '-'))} placeholder="e.g. gpay-primary" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Google Identity (Email)</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="merchant@gmail.com" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Access Token (Google Password)</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Confirm Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Type again (pasting disabled)" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" 
                    />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight px-1">Must match exactly to ensure operational accuracy</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Business UPI Endpoint</label>
                    <input value={newUpiId} onChange={(e) => setNewUpiId(e.target.value)} placeholder="merchant@okaxis" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Proxy Configuration (Optional)</label>
                    <input value={newProxy} onChange={(e) => setNewProxy(e.target.value)} placeholder="http://user:pass@ip:port" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Min Ticket</label>
                      <input type="number" value={newMinTicket} onChange={(e) => setNewMinTicket(e.target.value)} placeholder="0" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Ticket</label>
                      <input type="number" value={newMaxTicket} onChange={(e) => setNewMaxTicket(e.target.value)} placeholder="100000" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
                  <button onClick={() => setWizardStep(1)} className="w-full md:w-auto px-6 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors order-2 md:order-1">Previous</button>
                  <button 
                    onClick={submitForReview} 
                    disabled={!newName || !newEmail || !newPassword || !newUpiId || newPassword !== confirmPassword || isSubmitting} 
                    className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-md font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 order-1 md:order-2 shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} 
                    Submit for Operational Activation
                  </button>
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="max-w-md mx-auto text-center space-y-8 py-8 md:py-12">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
                  <Clock className="w-12 h-12" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-slate-900">Submission Under Review</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Our operations staff has received your credentials. They will now manually activate your browser session on our secure VPS infrastructure.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-md p-4 text-left border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Next Steps</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Staff verifies credentials
                    </li>
                    <li className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Remote browser login session initiated
                    </li>
                    <li className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Account marked ACTIVE for API traffic
                    </li>
                  </ul>
                </div>
                <button onClick={resetWizard} className="w-full px-8 py-4 bg-slate-900 text-white rounded-md font-black uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Account List */}
      {!showWizard && (
        <div className={`grid gap-3 md:gap-6 px-2 md:px-0 pb-12 transition-all duration-300 ${poolState?.processingMode === "PLATFORM_POOL" ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          {poolState?.processingMode === "PLATFORM_POOL" && (
             <div className="col-span-full mb-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-md text-amber-800 text-xs font-bold">
               <AlertTriangle className="w-4 h-4" /> Self-managed accounts are disabled while using Platform Pool mode.
             </div>
          )}
          {accounts.map(acc => {
            const isApproved = acc.reviewStatus === "APPROVED";
            const isOnline = acc.sessionStatus === "ONLINE";
            const isActive = acc.status === "ACTIVE";
            return (
              <div key={acc.id} className={`bg-white rounded-md border transition-all ${isActive ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-70 grayscale-[0.5]'}`}>
                <div className="p-4 md:p-6 flex flex-col gap-4">
                  <div className="flex gap-3 md:gap-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-md flex items-center justify-center border shadow-sm ${isActive ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">{acc.name}</h4>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {isApproved ? 'Approved' : acc.reviewStatus.replace('_', ' ')}
                        </div>
                        {isApproved && (
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            {isOnline ? 'Session Live' : acc.sessionStatus}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight truncate">{acc.email}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                           <Key className="w-3 h-3 text-slate-400" /> {acc.upiId}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           ₹{((acc as any).minTicket || 0).toLocaleString()} - ₹{((acc as any).maxTicket || 0).toLocaleString()}
                        </p>
                        {acc.lastAction && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                             <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                             {acc.lastAction}
                             {acc.lastActionTime && <span className="text-slate-400 ml-1">@{acc.lastActionTime}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between gap-4 bg-slate-50/50 rounded-md p-3 md:p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</label>
                      <button onClick={() => updateAccount(acc.id, { status: isActive ? "PAUSED" : "ACTIVE" })} className={`w-11 h-6 rounded-full relative transition-all duration-300 ${isActive ? 'bg-blue-600' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${isActive ? 'left-6' : 'left-1'}`} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 hidden md:block">Quota</label>
                      <input type="number" defaultValue={acc.monthlyLimit || 0} onBlur={(e) => updateAccount(acc.id, { monthlyLimit: parseFloat(e.target.value) || 0 })} className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-black focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" />
                    </div>
                  </div>
                </div>
                


                <div className="bg-slate-50/30 border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Processing: {acc.monthlyLimit > 0 ? `${Math.round((acc.usedAmount / acc.monthlyLimit) * 100)}% Capacity` : 'Unlimited'}</span>
                  </div>
                  <div className="flex items-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <button onClick={() => deleteAccount(acc.id)} className="hover:text-rose-500 transition-colors flex items-center gap-1.5 text-rose-400"><X className="w-3 h-3" /> Purge</button>
                  </div>
                </div>
                {acc.monthlyLimit > 0 && (<div className="h-1 bg-slate-100 w-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${acc.usedAmount >= acc.monthlyLimit ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${Math.min((acc.usedAmount / acc.monthlyLimit) * 100, 100)}%` }} /></div>)}
              </div>
            );
          })}
          {accounts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-md border-2 border-dashed border-slate-200 px-8 mx-2">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100"><Smartphone className="w-8 h-8 text-slate-300" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Fleet Empty</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto mb-8 font-medium">Provision your first Google Pay node to begin automated payment orchestration.</p>
              <button onClick={() => setShowWizard(true)} className="px-8 py-3.5 bg-blue-600 text-white rounded-md font-black uppercase text-[11px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Onboard First Node</button>
            </div>
          )}
        </div>
      )}

      {/* Live Console Modal */}
      {activeLogBot && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveLogBot(null)} />
          <div className="relative w-full md:max-w-4xl bg-white md:rounded-md rounded-t-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[85vh] animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300">
            <div className="bg-slate-50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-md flex items-center justify-center text-blue-600 border border-slate-200 shadow-sm shrink-0">
                  <TerminalIcon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[11px] md:text-[13px] font-black text-slate-900 uppercase tracking-tight truncate">Stream: {activeLogBot}</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 hidden md:block">High-Frequency Verification Node</p>
                </div>
              </div>
              <button onClick={() => setActiveLogBot(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Stats Dashboard (Top Half) */}
            {botStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 p-4 md:p-6 bg-slate-50/50 border-b border-slate-200">
                <div className="p-3 md:p-4 bg-white rounded-md border border-slate-200 shadow-sm">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime</p>
                  <p className="text-xs md:text-sm font-black text-slate-900">{formatUptime(botStats.uptime)}</p>
                </div>
                <div className="p-3 md:p-4 bg-white rounded-md border border-slate-200 shadow-sm">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sweeps</p>
                  <p className="text-xs md:text-sm font-black text-emerald-600">{botStats.totalSweeps || 0}</p>
                </div>
                <div className="p-3 md:p-4 bg-white rounded-md border border-slate-200 shadow-sm">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Relay</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] md:text-[10px] font-black text-emerald-600">{botStats.webhookStats?.success || 0} OK</span>
                    <span className="text-[9px] md:text-[10px] font-black text-rose-500">{botStats.webhookStats?.failure || 0} ERR</span>
                  </div>
                </div>
                <div className="p-3 md:p-4 bg-white rounded-md border border-slate-200 shadow-sm">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Load</p>
                  <p className="text-xs md:text-sm font-black text-blue-600">{Math.round(botStats.memory / 1024 / 1024)} MB</p>
                </div>
              </div>
            )}

            <div className="flex-grow overflow-y-auto p-6 font-mono text-[12px] text-slate-400 space-y-1.5 custom-scrollbar bg-slate-950">
              {liveLogs.length === 0 && <p className="text-slate-600 italic">Waiting for node stream...</p>}
              {liveLogs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-slate-800 shrink-0 select-none">[{i+1}]</span>
                  <span className={`${
                    log.includes('SUCCESS') ? 'text-emerald-400' : 
                    log.includes('ERROR') || log.includes('CRITICAL') ? 'text-rose-400' : 
                    log.includes('XHR sweep') || log.includes('CSV process') || log.includes('Sweep cycle') ? 'text-blue-400 font-bold' : 
                    log.includes('[BOOT]') ? 'text-amber-400' :
                    ''
                  }`}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Healthy</span>
                  </div>
               </div>
               <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest hidden md:block">ESC to Close Monitor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloudBrowser({ name }: { name: string }) {
  const [screenBlob, setScreenBlob] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [typingText, setTypingText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/bots/screen?name=${name}&t=${Date.now()}`);
        if (res.ok && res.headers.get('content-type')?.includes('image')) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          if (active) {
            setScreenBlob(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
            setIsConnected(true);
          }
        } else {
          if (active) setIsConnected(false);
        }
      } catch {
        if (active) setIsConnected(false);
      }
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => { active = false; clearInterval(interval); };
  }, [name]);

  const handleClick = async (e: React.MouseEvent) => {
    if (!containerRef.current || !isConnected) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1280 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (800 / rect.height));
    try {
      await fetch("/api/bots/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: 'click', x, y, key: '' }),
      });
    } catch {}
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!isConnected) return;
    // Let the text input handle regular characters
    if (e.target instanceof HTMLInputElement) return;
    e.preventDefault();
    try {
      await fetch("/api/bots/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: 'press', x: 0, y: 0, key: e.key }),
      });
    } catch {}
  };

  const sendText = async () => {
    if (!typingText || !isConnected) return;
    try {
      await fetch("/api/bots/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: 'type', x: 0, y: 0, key: typingText }),
      });
      setTypingText("");
    } catch {}
  };

  return (
    <div className="space-y-3">
      <div 
        ref={containerRef}
        className="relative bg-slate-950 rounded-md overflow-hidden border border-slate-800 shadow-2xl cursor-crosshair aspect-[1280/800] w-full group outline-none"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {isConnected && screenBlob ? (
          <img 
            src={screenBlob} 
            alt="Cloud View" 
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Connecting to Cloud Browser...</p>
              <p className="text-[10px] text-slate-600">The remote browser is starting up. This takes 10-20 seconds.</p>
            </div>
          </div>
        )}
        
        {isConnected && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-500 uppercase tracking-widest">
             Connected
          </div>
        )}
      </div>

      {/* Text Input Bar — for typing email/password into the remote browser */}
      <div className="flex gap-2">
        <input
          type="text"
          value={typingText}
          onChange={(e) => setTypingText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendText(); }}
          placeholder={isConnected ? "Type here, then press Enter to send to browser..." : "Waiting for connection..."}
          disabled={!isConnected}
          className="flex-grow px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-40 transition-all"
        />
        <button 
          onClick={sendText}
          disabled={!isConnected || !typingText}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-40 transition-all shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}

