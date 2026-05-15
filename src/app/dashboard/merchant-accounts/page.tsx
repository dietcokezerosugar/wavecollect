"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Smartphone, Plus, Play, Square, RefreshCw, Terminal as TerminalIcon, Power, CheckCircle2, ShieldCheck, AlertTriangle, Key, Loader2, ArrowRight, X
} from "lucide-react";

interface GPayAccount {
  id: string;
  name: string;
  email: string;
  upiId: string;
  reportId: string | null;
  status: string;
  desiredStatus: string;
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

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 10000); // Poll PM2 status
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

  // Poll progress logs when in Step 3
  useEffect(() => {
    let logInterval: NodeJS.Timeout;
    if (wizardStep === 3 && newName) {
      logInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/bots/login/progress?name=${newName}`);
          const data = await res.json();
          if (data.logs) {
            setAutoLoginLogs(data.logs);
            if (data.logs.some((l: string) => l.includes("[SUCCESS]"))) {
              setIsLoginComplete(true);
              setIsLoginSuccess(true);
              setWizardStep(4);
              fetchAccounts(); // Fetch immediately to show the new account
            } else if (data.logs.some((l: string) => l.includes("[ERROR]") || l.includes("[CRITICAL]"))) {
              setIsLoginComplete(true);
              setIsLoginSuccess(false);
              setWizardStep(4);
            }
          }
        } catch(e) {}
      }, 1500);
    }
    return () => clearInterval(logInterval);
  }, [wizardStep, newName]);

  async function fetchAccounts() {
    try {
      // 1. Fetch Primary Account Data
      const res = await fetch("/api/gpay-accounts");
      const data = await res.json();
      const rawAccounts = data.data || [];
      
      if (rawAccounts.length === 0) {
        setAccounts([]);
        return;
      }

      // 2. Fetch Secondary Data (Non-blocking)
      let statusData: any = { bots: {} };
      try {
        const statusRes = await fetch("/api/bots/control", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" })
        });
        statusData = await statusRes.json();
      } catch (e) { console.warn("PM2 Status Sync Failed", e); }

      let allLogs: any[] = [];
      try {
        const logRes = await fetch("/api/logs");
        const logData = await logRes.json();
        allLogs = logData.data || [];
      } catch (e) { console.warn("Log Stream Sync Failed", e); }
      
      const merged = rawAccounts.map((acc: GPayAccount) => {
        const accountLogs = allLogs.filter((l: any) => 
          l.message.toLowerCase().includes(acc.name.toLowerCase()) && 
          (l.message.includes("sweep completed") || l.message.includes("process completed"))
        );
        
        const latestLog = accountLogs[0]; 

        return {
          ...acc,
          pm2Status: statusData.bots?.[acc.name] || "stopped",
          lastAction: latestLog ? latestLog.message.split(' - ').pop() : "Waiting for first cycle...",
          lastActionTime: latestLog ? new Date(latestLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
        };
      });
      
      setAccounts(merged);
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

  async function deleteAccount(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone and the PM2 bot will be removed.`)) return;
    
    // Attempt to delete PM2 bot
    try {
      await fetch("/api/bots/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, action: "delete" }),
      });
    } catch(e) {}

    // Delete from DB
    await fetch(`/api/gpay-accounts?id=${id}`, { method: "DELETE" });
    fetchAccounts();
  }

  async function botAction(name: string, action: string) {
    if (action === 'start' || action === 'restart') {
      setActiveLogBot(name);
    }
    await fetch("/api/bots/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, action }),
    });
    fetchAccounts();
  }

  async function startAutoLogin() {
    // 1. Create DB Record first so it exists
    await fetch("/api/gpay-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, upiId: newUpiId, minTicket: newMinTicket, maxTicket: newMaxTicket, proxyConfig: newProxy }),
    });

    // 2. Trigger auto login
    await fetch("/api/bots/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, action: "auto", email: newEmail, password: newPassword }),
    });
    
    setWizardStep(3);
  }

  async function manualLogin(name: string) {
    await fetch("/api/bots/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, action: "manual" }),
    });
    setWizardStep(3); // Go to sync step to see logs
    alert("Manual handshake initiated. Please switch to your VNC viewer (TigerVNC) to see the browser and complete the login.");
  }

  function resetWizard() {
    setShowWizard(false);
    setWizardStep(1);
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewUpiId(""); setNewMinTicket(""); setNewMaxTicket(""); setNewProxy("");
    setAutoLoginLogs([]);
    setIsLoginComplete(false);
    setIsLoginSuccess(false);
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
    <div className="space-y-8 pb-12 font-sans max-w-5xl mx-auto">
      {/* Existing Wizard & Account List code... */}
      {/* ... keeping the existing structure but adding the new modal and button ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Merchant Fleet</h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium">Configure and monitor your Google Pay automated nodes.</p>
        </div>
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className="w-full md:w-auto px-6 py-3.5 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            disabled={accounts.length >= 10}
          >
            <Plus className="w-4 h-4" /> Add New Node
          </button>
        )}
      </div>

      {showWizard && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mx-2 md:mx-0">
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
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">Mandatory Security Step</h3>
                  <p className="text-sm md:text-base text-slate-500 leading-relaxed px-4">
                    To automate verification, you <strong>must disable 2FA</strong> and phone prompts on the Google Account. This ensures the headless engine can verify sessions autonomously.
                  </p>
                </div>
                <div className="pt-4 flex flex-col md:flex-row items-center justify-center gap-3">
                  <button onClick={resetWizard} className="w-full md:w-auto px-8 py-3.5 bg-slate-50 text-slate-500 rounded-xl font-black uppercase text-[11px] tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors order-2 md:order-1">Cancel</button>
                  <button onClick={() => setWizardStep(2)} className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-all order-1 md:order-2 shadow-lg shadow-blue-600/20">I Understand</button>
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="grid gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Internal Alias</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value.replace(/\s+/g, '-'))} placeholder="e.g. gpay-primary" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Google Identity (Email)</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="merchant@gmail.com" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Access Token (Password)</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Business UPI Endpoint</label>
                    <input value={newUpiId} onChange={(e) => setNewUpiId(e.target.value)} placeholder="merchant@okaxis" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Proxy Configuration (Optional)</label>
                    <input value={newProxy} onChange={(e) => setNewProxy(e.target.value)} placeholder="http://user:pass@ip:port" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Min Ticket</label>
                      <input type="number" value={newMinTicket} onChange={(e) => setNewMinTicket(e.target.value)} placeholder="0" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Ticket</label>
                      <input type="number" value={newMaxTicket} onChange={(e) => setNewMaxTicket(e.target.value)} placeholder="100000" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 text-slate-900" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
                  <button onClick={() => setWizardStep(1)} className="w-full md:w-auto px-6 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors order-2 md:order-1">Previous</button>
                  <button onClick={startAutoLogin} disabled={!newName || !newEmail || !newPassword || !newUpiId} className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 order-1 md:order-2 shadow-lg shadow-blue-600/20 active:scale-95">
                    <Key className="w-4 h-4" /> Start Synchronization
                  </button>
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                   <div className="relative">
                     <Loader2 className="w-10 h-10 animate-spin" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                     </div>
                   </div>
                </div>
                <h3 className="text-xl font-black text-slate-900">Synchronizing Node</h3>
                <p className="text-sm text-slate-500 px-4 font-medium">Establishing a high-integrity session with Google Business API.</p>
                <div className="mt-6 bg-slate-900 rounded-xl p-5 text-left h-56 md:h-64 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-2 border border-slate-800 shadow-2xl">
                  {autoLoginLogs.length === 0 && <p className="text-slate-500 italic">Initializing automation engine...</p>}
                  {autoLoginLogs.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('ERROR') || log.includes('WARNING') || log.includes('🔧') ? 'text-amber-400' : ''}`}>
                      <span className="opacity-20 select-none">[{i+1}]</span> 
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
                {autoLoginLogs.length > 0 && !isLoginComplete && (
                  <div className="pt-4">
                    <button 
                      onClick={() => manualLogin(newName)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"
                    >
                      Switch to Manual VNC Handshake
                    </button>
                  </div>
                )}
              </div>
            )}
            {wizardStep === 4 && (
              <div className="max-md mx-auto text-center space-y-8 py-4 md:py-8">
                {isLoginSuccess ? (
                  <>
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Node Established</h3>
                      <p className="text-sm md:text-base text-slate-500 px-6 font-medium">Your node is authorized and ready for real-time verification traffic.</p>
                    </div>
                    <button onClick={resetWizard} className="w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                      View Deployment
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Verification Interrupted</h3>
                      <p className="text-sm text-slate-500 px-8 leading-relaxed font-medium">Google requires a manual authentication handshake. Launch the secure browser to proceed.</p>
                    </div>
                    <div className="space-y-3 pt-4 px-4">
                      <button onClick={() => manualLogin(newName)} className="w-full px-8 py-4 bg-amber-500 text-white rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3">
                        <TerminalIcon className="w-4 h-4" /> Launch Manual Handshake
                      </button>
                      <button onClick={resetWizard} className="w-full px-8 py-3.5 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-slate-600 transition-all">
                        Abort Onboarding
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account List */}
      {!showWizard && (
        <div className="grid gap-3 md:gap-6 px-2 md:px-0 pb-12">
          {accounts.map(acc => {
            const isOnline = acc.pm2Status === "online";
            const isActive = acc.status === "ACTIVE";
            return (
              <div key={acc.id} className={`bg-white rounded-2xl border transition-all ${isActive ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-70 grayscale-[0.5]'}`}>
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-5">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${isActive ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">{acc.name}</h4>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {isOnline ? 'Active' : 'Offline'}
                        </div>
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
                  <div className="flex items-center justify-between md:justify-end gap-6 bg-slate-50/50 md:bg-transparent -mx-5 -mb-5 md:m-0 p-5 md:p-0 border-t md:border-0 border-slate-100 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Node Status</label>
                      <button onClick={() => updateAccount(acc.id, { status: isActive ? "PAUSED" : "ACTIVE" })} className={`w-11 h-6 rounded-full relative transition-all duration-300 ${isActive ? 'bg-blue-600' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${isActive ? 'left-6' : 'left-1'}`} /></button>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-grow max-w-[140px] md:w-32">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Quota (₹)</label>
                      <input type="number" defaultValue={acc.monthlyLimit || 0} onBlur={(e) => updateAccount(acc.id, { monthlyLimit: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-black focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" />
                    </div>
                  </div>
                </div>
                
                {acc.desiredStatus === "WAITING_OTP" && (
                  <div className="bg-amber-50 border-t border-amber-100 p-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                           <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-amber-900">Security Checkpoint</p>
                          <p className="text-[11px] font-bold text-amber-700/70">Google is asking for an SMS/Email code.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter 6-digit code" 
                          value={otpInputs[acc.name] || ""}
                          onChange={(e) => setOtpInputs({...otpInputs, [acc.name]: e.target.value})}
                          className="px-4 py-2 border border-amber-200 bg-white rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <button 
                          onClick={() => submitOtp(acc.name)}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-sm shadow-amber-500/20 active:scale-95"
                        >
                          Submit OTP
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50/30 border-t border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-2 w-full md:w-auto">
                    {isOnline ? (
                      <button onClick={() => botAction(acc.name, 'stop')} className="flex-1 md:flex-none px-4 py-2 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"><Square className="w-3 h-3 fill-current" /> Stop</button>
                    ) : (
                      <button onClick={() => botAction(acc.name, 'start')} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95"><Play className="w-3 h-3 fill-current" /> Start</button>
                    )}
                    <button onClick={() => botAction(acc.name, 'restart')} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all active:rotate-180 duration-500" title="Restart"><RefreshCw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setActiveLogBot(acc.name)} className="p-2 bg-slate-900 text-white rounded-lg transition-all hover:bg-black active:scale-95 shadow-md shadow-slate-900/10" title="View Stream"><TerminalIcon className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex items-center justify-around md:justify-end gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <button onClick={() => manualLogin(acc.name)} className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><TerminalIcon className="w-3 h-3" /> Manual Handshake</button>
                    <button onClick={() => deleteAccount(acc.id, acc.name)} className="hover:text-rose-500 transition-colors flex items-center gap-1.5 text-rose-400"><X className="w-3 h-3" /> Purge</button>
                  </div>
                </div>
                {acc.monthlyLimit > 0 && (<div className="h-1 bg-slate-100 w-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${acc.usedAmount >= acc.monthlyLimit ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${Math.min((acc.usedAmount / acc.monthlyLimit) * 100, 100)}%` }} /></div>)}
              </div>
            );
          })}
          {accounts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 px-8 mx-2">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100"><Smartphone className="w-8 h-8 text-slate-300" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Fleet Empty</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto mb-8 font-medium">Provision your first Google Pay node to begin automated payment orchestration.</p>
              <button onClick={() => setShowWizard(true)} className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Onboard First Node</button>
            </div>
          )}
        </div>
      )}

      {/* Live Console Modal */}
      {activeLogBot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveLogBot(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-200 shadow-sm">
                  <TerminalIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Stream Monitor: {activeLogBot}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">High-Frequency Verification Node</p>
                </div>
              </div>
              <button onClick={() => setActiveLogBot(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Stats Dashboard (Top Half) */}
            {botStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-slate-50/50 border-b border-slate-200">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime</p>
                  <p className="text-sm font-black text-slate-900">{formatUptime(botStats.uptime)}</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sweeps</p>
                  <p className="text-sm font-black text-emerald-600">{botStats.totalSweeps || 0}</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Relay Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-emerald-600">{botStats.webhookStats?.success || 0} OK</span>
                    <span className="text-[10px] font-black text-rose-500">{botStats.webhookStats?.failure || 0} ERR</span>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine Load</p>
                  <p className="text-sm font-black text-blue-600">{Math.round(botStats.memory / 1024 / 1024)} MB</p>
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

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Node Healthy</span>
                  </div>
               </div>
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ESC to Close Monitor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
