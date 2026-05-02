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

  const [autoLoginLogs, setAutoLoginLogs] = useState<string[]>([]);
  const [isLoginComplete, setIsLoginComplete] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);

  const [activeLogBot, setActiveLogBot] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [botStats, setBotStats] = useState<any>(null);

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
      const res = await fetch("/api/gpay-accounts");
      const data = await res.json();
      
      const statusRes = await fetch("/api/bots/control", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" })
      });
      const statusData = await statusRes.json();

      const logRes = await fetch("/api/logs");
      const logData = await logRes.json();
      const allLogs = logData.data || [];
      
      const merged = (data.data || []).map((acc: GPayAccount) => {
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
      console.error(e);
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
      body: JSON.stringify({ name: newName, email: newEmail, upiId: newUpiId }),
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
      body: JSON.stringify({ name }),
    });
    alert("Manual login browser launched on the server. Please complete the login there.");
  }

  function resetWizard() {
    setShowWizard(false);
    setWizardStep(1);
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewUpiId("");
    setAutoLoginLogs([]);
    setIsLoginComplete(false);
    setIsLoginSuccess(false);
  }

  return (
    <div className="space-y-8 pb-12 font-sans max-w-5xl mx-auto">
      {/* Existing Wizard & Account List code... */}
      {/* ... keeping the existing structure but adding the new modal and button ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Merchant Accounts</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-base">Configure Google Pay accounts for verification.</p>
        </div>
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className="w-full md:w-auto px-6 py-4 md:py-3 bg-primary text-white rounded-2xl md:rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            disabled={accounts.length >= 10}
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" /> Add Account
          </button>
        )}
      </div>

      {showWizard && (
        <div className="bg-white rounded-[32px] md:rounded-[24px] shadow-sm border border-slate-200 overflow-hidden mx-2 md:mx-0">
          {/* Wizard Content (Unchanged) */}
          <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 gap-3">
            <h2 className="text-lg font-bold">New Account Setup</h2>
            <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm font-medium text-slate-400 overflow-x-auto whitespace-nowrap pb-1 md:pb-0 scrollbar-hide">
              <span className={`${wizardStep >= 1 ? 'text-primary' : ''}`}>1. Info</span>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
              <span className={`${wizardStep >= 2 ? 'text-primary' : ''}`}>2. Data</span>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
              <span className={`${wizardStep >= 3 ? 'text-primary' : ''}`}>3. Link</span>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {wizardStep === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-100">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black">Security Step</h3>
                  <p className="text-sm md:text-base text-slate-500 leading-relaxed px-4">
                    To automate verification, you <strong>must disable 2FA</strong> and phone prompts on the Google Account.
                  </p>
                </div>
                <div className="pt-4 flex flex-col md:flex-row items-center justify-center gap-3">
                  <button onClick={resetWizard} className="w-full md:w-auto px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors order-2 md:order-1">Cancel</button>
                  <button onClick={() => setWizardStep(2)} className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-600 transition-all order-1 md:order-2 shadow-md shadow-blue-600/10">I Understand</button>
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Internal Name</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value.replace(/\s+/g, '-'))} placeholder="e.g. gpay-primary" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Google Email</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="merchant@gmail.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Business UPI ID</label>
                    <input value={newUpiId} onChange={(e) => setNewUpiId(e.target.value)} placeholder="merchant@okaxis" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-300" />
                  </div>
                </div>
                <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
                  <button onClick={() => setWizardStep(1)} className="w-full md:w-auto px-6 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors order-2 md:order-1">Back</button>
                  <button onClick={startAutoLogin} disabled={!newName || !newEmail || !newPassword || !newUpiId} className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 order-1 md:order-2 shadow-lg shadow-blue-600/20">
                    <Key className="w-5 h-5" /> Start Link Process
                  </button>
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="max-w-2xl mx-auto space-y-6 text-center">
                <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/10">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h3 className="text-xl font-black">Connecting...</h3>
                <p className="text-sm text-slate-500 px-4">Establishing a secure session with Google Pay Business.</p>
                <div className="mt-6 bg-slate-950 rounded-2xl p-5 text-left h-56 md:h-64 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-2 border border-slate-800 shadow-inner">
                  {autoLoginLogs.length === 0 && <p className="text-slate-500 italic">Initializing automation engine...</p>}
                  {autoLoginLogs.map((log, i) => (
                    <div key={i} className={`${log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('ERROR') || log.includes('WARNING') ? 'text-rose-400' : ''}`}>
                      <span className="opacity-30 mr-2">[{i+1}]</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {wizardStep === 4 && (
              <div className="max-md mx-auto text-center space-y-8 py-4 md:py-8">
                {isLoginSuccess ? (
                  <>
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mx-auto border border-emerald-100 shadow-sm shadow-emerald-500/10">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Successfully Linked!</h3>
                      <p className="text-sm md:text-base text-slate-500 px-6">Your account is now ready for automated payment verification.</p>
                    </div>
                    <button onClick={resetWizard} className="w-full px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/20">
                      Go to Dashboard
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[40px] flex items-center justify-center mx-auto border border-rose-100 shadow-sm shadow-rose-500/10">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Action Required</h3>
                      <p className="text-sm text-slate-500 px-8 leading-relaxed">Google requested a manual step. Please launch the server browser to finish.</p>
                    </div>
                    <div className="space-y-3 pt-4 px-4">
                      <button onClick={() => manualLogin(newName)} className="w-full px-8 py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3">
                        <TerminalIcon className="w-5 h-5" /> Launch Manual Login
                      </button>
                      <button onClick={resetWizard} className="w-full px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 transition-all rounded-2xl">
                        Try Again Later
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
              <div key={acc.id} className={`bg-white rounded-[32px] md:rounded-2xl border transition-all ${isActive ? 'border-slate-200 shadow-sm' : 'border-slate-200 opacity-80 shadow-none'}`}>
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-5">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm border ${isActive ? 'bg-blue-50 text-primary border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      <Smartphone className="w-7 h-7 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0 flex-grow pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base md:text-lg font-black text-slate-900 truncate">{acc.name}</h4>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                          {isOnline ? 'Live' : 'Paused'}
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5 truncate font-medium">{acc.email}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[10px] md:text-xs text-slate-400 font-mono">{acc.upiId}</p>
                        {acc.lastAction && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded text-[9px] font-bold text-slate-500 border border-slate-100/50">
                             <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                             {acc.lastAction}
                             {acc.lastActionTime && <span className="opacity-40">@{acc.lastActionTime}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 bg-slate-50/50 md:bg-transparent -mx-5 -mb-5 md:m-0 p-5 md:p-0 border-t md:border-0 border-slate-100 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verification</label>
                      <button onClick={() => updateAccount(acc.id, { status: isActive ? "PAUSED" : "ACTIVE" })} className={`w-12 h-7 rounded-full relative transition-all duration-300 ${isActive ? 'bg-primary' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${isActive ? 'left-6' : 'left-1'}`} /></button>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-grow max-w-[140px] md:w-32">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Monthly Limit (₹)</label>
                      <input type="number" defaultValue={acc.monthlyLimit || 0} onBlur={(e) => updateAccount(acc.id, { monthlyLimit: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white md:bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-right font-black focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/30 border-t border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-2 w-full md:w-auto">
                    {isOnline ? (
                      <button onClick={() => botAction(acc.name, 'stop')} className="flex-1 md:flex-none px-4 py-3 md:py-2 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-[11px] md:text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"><Square className="w-3 h-3 fill-current" /> Stop Bot</button>
                    ) : (
                      <button onClick={() => botAction(acc.name, 'start')} className="flex-1 md:flex-none px-4 py-3 md:py-2 bg-primary text-white rounded-xl text-[11px] md:text-xs font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/10 active:scale-95"><Play className="w-3 h-3 fill-current" /> Resume Bot</button>
                    )}
                    <button onClick={() => botAction(acc.name, 'restart')} className="p-3 md:p-2 bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl transition-all active:rotate-180 duration-500" title="Restart"><RefreshCw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setActiveLogBot(acc.name)} className="p-3 md:p-2 bg-slate-900 text-white rounded-xl transition-all hover:bg-black active:scale-95 shadow-lg shadow-slate-900/20" title="View Live Console"><TerminalIcon className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex items-center justify-around md:justify-end gap-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-tighter">
                    <button onClick={() => manualLogin(acc.name)} className="hover:text-primary transition-colors flex items-center gap-1.5"><TerminalIcon className="w-3 h-3" /> Manual Login</button>
                    <button onClick={() => deleteAccount(acc.id, acc.name)} className="hover:text-rose-500 transition-colors flex items-center gap-1.5 text-rose-400"><X className="w-3 h-3" /> Delete</button>
                  </div>
                </div>
                {acc.monthlyLimit > 0 && (<div className="h-1.5 bg-slate-100 w-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${acc.usedAmount >= acc.monthlyLimit ? 'bg-rose-500' : 'bg-primary shadow-[0_0_8px_rgba(0,102,255,0.4)]'}`} style={{ width: `${Math.min((acc.usedAmount / acc.monthlyLimit) * 100, 100)}%` }} /></div>)}
              </div>
            );
          })}
          {accounts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 px-8 mx-2">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Smartphone className="w-10 h-10 text-slate-300" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Ready to start?</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto mb-8">Link your first Google Pay account to automate UPI verification.</p>
              <button onClick={() => setShowWizard(true)} className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Add My First Account</button>
            </div>
          )}
        </div>
      )}

      {/* Live Console Modal */}
      {activeLogBot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveLogBot(null)} />
          <div className="relative w-full max-w-4xl bg-slate-950 rounded-[32px] md:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-500">
                  <TerminalIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Live Console: {activeLogBot}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GPay 9 Engine v2.0</p>
                </div>
              </div>
              <button onClick={() => setActiveLogBot(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Stats Dashboard (Top Half) */}
            {botStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-slate-900/40 border-b border-slate-800/50">
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Uptime</p>
                  <p className="text-sm font-black text-white">{formatUptime(botStats.uptime)}</p>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Sweeps</p>
                  <p className="text-sm font-black text-emerald-400">{botStats.totalSweeps || 0}</p>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Webhook Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-emerald-500">{botStats.webhookStats?.success || 0} OK</span>
                    <span className="text-[10px] font-bold text-rose-500">{botStats.webhookStats?.failure || 0} ERR</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Engine Load</p>
                  <p className="text-sm font-black text-blue-400">{Math.round(botStats.memory / 1024 / 1024)} MB</p>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50 col-span-2">
                   <div className="flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Engine-A (XHR)</p>
                        <p className="text-xs font-bold text-slate-300">{botStats.engineA?.captured || 0} Captured</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Engine-B (CSV)</p>
                        <p className="text-xs font-bold text-slate-300">{botStats.engineB?.captured || 0} Captured</p>
                     </div>
                   </div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50 col-span-2 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col items-center">
                         <span className="text-[8px] font-black text-slate-500 uppercase">Engine Health</span>
                         <div className="flex gap-1 mt-1">
                            {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-3 rounded-full ${i <= (botStats.totalSweeps % 5 + 1) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />)}
                         </div>
                       </div>
                    </div>
                </div>
              </div>
            )}

            <div className="flex-grow overflow-y-auto p-6 font-mono text-xs md:text-sm text-slate-300 space-y-1.5 custom-scrollbar bg-black/20">
              {liveLogs.length === 0 && <p className="text-slate-600 italic">Waiting for bot process to pipe logs...</p>}
              {liveLogs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-slate-700 shrink-0 select-none">[{i+1}]</span>
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

            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Stream Active</span>
                  </div>
               </div>
               <span className="text-[10px] font-bold text-slate-600 uppercase">Press ESC to Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
