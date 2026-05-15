"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Eye, 
  EyeOff,
  User,
  Building,
  Terminal,
  Loader2,
  Monitor,
  AlertTriangle,
  Plus,
  Globe
} from "lucide-react";
import { format } from "date-fns";

export default function StaffAccountReview() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHandshake, setActiveHandshake] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [newPoolAccount, setNewPoolAccount] = useState({ name: '', email: '', password: '', upiId: '', proxy: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    try {
      // Modern fallback for non-secure HTTP origins
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/staff/accounts");
      const json = await res.json();
      if (json.status === "success") setAccounts(json.data);
    } catch (e) {
      console.error("Failed to fetch accounts", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string, note?: string) => {
    try {
      const res = await fetch("/api/staff/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note }),
      });
      const json = await res.json();
      if (json.status === "success") {
        fetchAccounts();
        if (action === 'activate') {
           const account = accounts.find(a => a.id === id);
           setActiveHandshake(account);
        }
      }
    } catch (e) {
      console.error(`Failed to ${action} account`, e);
    }
  };

  const createPoolAccount = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPoolAccount,
          accountType: 'PLATFORM_POOL'
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        setShowPoolModal(false);
        setNewPoolAccount({ name: '', email: '', password: '', upiId: '', proxy: '' });
        fetchAccounts();
      } else {
        alert(json.message || "Failed to create pool account");
      }
    } catch (e) {
      alert("Error creating pool account");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
       <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Security Gate</h1>
          <p className="text-slate-500 font-medium text-sm">Review credentials and activate remote browser sessions.</p>
        </div>
        <button 
          onClick={() => setShowPoolModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
           <Plus className="w-4 h-4" /> Create Platform Pool Account
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Account List */}
        <div className="xl:col-span-2 space-y-4">
           {accounts.length === 0 ? (
             <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Queue Empty</p>
             </div>
           ) : (
             accounts.map((account) => (
               <div key={account.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-all">
                  <div className="p-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex gap-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                             account.reviewStatus === 'PENDING_REVIEW' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                             account.reviewStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                             'bg-slate-50 border-slate-100 text-slate-400'
                           }`}>
                              <User className="w-6 h-6" />
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                 <h3 className="font-black text-slate-900">{account.name}</h3>
                                 <StatusBadge status={account.reviewStatus} type="review" />
                                 <StatusBadge status={account.sessionStatus} type="session" />
                              </div>
                              <p className="text-xs text-slate-400 font-mono">{account.email}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase">
                                 <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {account.merchant?.businessName || account.merchant?.name}</span>
                                 <span>•</span>
                                 <span>Added {format(new Date(account.createdAt), 'MMM dd, HH:mm')}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                           {account.reviewStatus === 'PENDING_REVIEW' && (
                             <>
                                <button 
                                  onClick={() => handleAction(account.id, 'approve')}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
                                >
                                   <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button 
                                  onClick={() => handleAction(account.id, 'reject')}
                                  className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                >
                                   Reject
                                </button>
                             </>
                           )}

                           {account.reviewStatus === 'APPROVED' && account.sessionStatus !== 'ONLINE' && (
                             <button 
                               onClick={() => handleAction(account.id, 'activate')}
                               className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                             >
                                <Monitor className="w-3.5 h-3.5" /> Start Handshake
                             </button>
                           )}

                           {account.sessionStatus === 'ONLINE' && (
                              <button 
                                onClick={() => setActiveHandshake(account)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                              >
                                 <Monitor className="w-3.5 h-3.5" /> Open Browser
                              </button>
                           )}
                        </div>
                     </div>

                     {/* Credential Reveal Section */}
                     <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center gap-6">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Account</p>
                           <p className="text-xs font-bold text-slate-700">{account.email}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</p>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-900">
                                 {showPassword === account.id ? account.botPassword : '••••••••••••'}
                              </span>
                              <button 
                                onClick={() => setShowPassword(showPassword === account.id ? null : account.id)}
                                className="text-slate-400 hover:text-slate-900 transition-colors"
                              >
                                 {showPassword === account.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UPI ID</p>
                           <p className="text-xs font-bold text-slate-700">{account.upiId}</p>
                        </div>
                        {account.proxyConfig && (
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proxy Route</p>
                             <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> {account.proxyConfig}
                             </p>
                          </div>
                        )}
                        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                 <Terminal className="w-3 h-3 text-slate-400" /> 1. Manual Handshake
                              </p>
                              <button 
                                onClick={() => {
                                  const cmd = `node src/bot/auto-login.js "${account.name}" "${account.email}" "${account.botPassword}" "${account.proxyConfig || ''}" --terminal`;
                                  copyToClipboard(cmd, `hs-${account.id}`);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[9px] font-mono transition-all border ${
                                  copiedId === `hs-${account.id}` ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
                                }`}
                              >
                                 <span className="truncate">{copiedId === `hs-${account.id}` ? 'READY TO PASTE' : 'node auto-login.js...'}</span>
                                 <span className="bg-white/10 px-1 rounded uppercase">{copiedId === `hs-${account.id}` ? '✓' : 'Copy'}</span>
                              </button>
                           </div>

                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                 <Monitor className="w-3 h-3 text-slate-400" /> 2. Start Engine
                              </p>
                              <button 
                                onClick={() => {
                                  const cmd = `pm2 start src/bot/bot.js --name "bot-${account.name}" -- "${account.name}"`;
                                  copyToClipboard(cmd, `pm-${account.id}`);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[9px] font-mono transition-all ${
                                  copiedId === `pm-${account.id}` ? 'bg-emerald-600 text-white shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                }`}
                              >
                                 <span className="truncate">{copiedId === `pm-${account.id}` ? 'READY TO PASTE' : 'pm2 start bot.js...'}</span>
                                 <span className="bg-white/10 px-1 rounded uppercase">{copiedId === `pm-${account.id}` ? '✓' : 'Copy'}</span>
                              </button>
                           </div>

                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                 <Terminal className="w-3 h-3 text-slate-400" /> 3. View Logs
                              </p>
                              <button 
                                onClick={() => {
                                  const cmd = `pm2 logs bot-${account.name}`;
                                  copyToClipboard(cmd, `lg-${account.id}`);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[9px] font-mono transition-all border ${
                                  copiedId === `lg-${account.id}` ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                 <span className="truncate">{copiedId === `lg-${account.id}` ? 'READY TO PASTE' : 'pm2 logs bot-...'}</span>
                                 <span className="bg-slate-300/50 px-1 rounded uppercase">{copiedId === `lg-${account.id}` ? '✓' : 'Copy'}</span>
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Handshake Monitor (Sticky) */}
        <div className="xl:col-span-1">
           <div className="sticky top-24 space-y-6">
              {activeHandshake ? (
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                         <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Live Handshake: {activeHandshake.name}</h3>
                      </div>
                      <button 
                        onClick={() => setActiveHandshake(null)}
                        className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-600"
                      >
                         Close
                      </button>
                   </div>
                   <CloudBrowser name={activeHandshake.name} />
                   <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono space-y-1">
                      <p className="text-emerald-500 font-bold">[SYSTEM] Connection Established</p>
                      <p>[INFO] Target: {activeHandshake.email}</p>
                      <p>[INFO] Waiting for manual Google login completion...</p>
                   </div>
                </div>
              ) : (
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <Monitor className="w-8 h-8" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Handshake Monitor</p>
                      <p className="text-xs text-slate-400 font-medium">Select an account to start remote browser session.</p>
                   </div>
                </div>
              )}
              
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-3">
                 <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol Notice</span>
                 </div>
                 <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Merchant account eligibility is tied directly to session health. Ensure the browser context is verified before marking as Online.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Pool Account Modal */}
      {showPoolModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPoolModal(false)} />
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                       <Globe className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900">Create Pool Account</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared Platform Infrastructure</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Alias</label>
                          <input 
                            value={newPoolAccount.name} 
                            onChange={(e) => setNewPoolAccount({...newPoolAccount, name: e.target.value.replace(/\s+/g, '-')})}
                            placeholder="pool-node-01" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPI Endpoint</label>
                          <input 
                            value={newPoolAccount.upiId} 
                            onChange={(e) => setNewPoolAccount({...newPoolAccount, upiId: e.target.value})}
                            placeholder="pool@okaxis" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all" 
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Google Email</label>
                       <input 
                         value={newPoolAccount.email} 
                         onChange={(e) => setNewPoolAccount({...newPoolAccount, email: e.target.value})}
                         placeholder="gpay-pool-1@gmail.com" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                       <input 
                         type="password"
                         value={newPoolAccount.password} 
                         onChange={(e) => setNewPoolAccount({...newPoolAccount, password: e.target.value})}
                         placeholder="••••••••" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proxy Configuration (Optional)</label>
                       <input 
                         value={newPoolAccount.proxy} 
                         onChange={(e) => setNewPoolAccount({...newPoolAccount, proxy: e.target.value})}
                         placeholder="http://user:pass@ip:port" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all" 
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex items-center gap-3">
                    <button 
                      onClick={() => setShowPoolModal(false)}
                      className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                      onClick={createPoolAccount}
                      disabled={isCreating || !newPoolAccount.name || !newPoolAccount.email || !newPoolAccount.password || !newPoolAccount.upiId}
                      className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                       {isCreating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Initialize Pool Node'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, type }: { status: string, type: 'review' | 'session' }) {
  const styles: any = {
    review: {
      PENDING_REVIEW: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-rose-100 text-rose-700',
      SUSPENDED: 'bg-slate-200 text-slate-700'
    },
    session: {
      ONLINE: 'bg-emerald-100 text-emerald-700',
      OFFLINE: 'bg-slate-100 text-slate-600',
      ERROR: 'bg-rose-100 text-rose-700',
      EXPIRED: 'bg-amber-100 text-amber-700',
      STARTING: 'bg-blue-100 text-blue-700'
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${styles[type][status] || 'bg-slate-100'}`}>
       {status.replace('_', ' ')}
    </span>
  );
}

// Reusing CloudBrowser component (simplified for staff)
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
        className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl cursor-crosshair aspect-[1280/800] w-full group outline-none"
        onClick={handleClick}
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
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Context...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={typingText}
          onChange={(e) => setTypingText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendText(); }}
          placeholder="Type credential..."
          className="flex-grow px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 outline-none"
        />
        <button 
          onClick={sendText}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
