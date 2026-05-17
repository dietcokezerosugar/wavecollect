"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<string>('start');
  const [logMode, setLogMode] = useState<string>('combined');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportIdValue, setReportIdValue] = useState("");

  const getBatchCommand = () => {
    if (selectedIds.length === 0) return "# Select accounts below to generate batch commands...";
    
    if (batchAction === 'logs') {
      const names = selectedIds.map(id => {
        const acc = accounts.find(a => a.id === id);
        return acc ? `bot-${acc.name}` : '';
      }).filter(Boolean);

      if (logMode === 'combined') {
        return `pm2 logs ${names.map(n => `'${n}'`).join(" ")}`;
      }
      
      if (logMode === 'tmux') {
        if (names.length === 1) return `pm2 logs '${names[0]}'`;
        let cmd = `tmux new-session -d -s bot-logs "pm2 logs '${names[0]}'"`;
        for (let i = 1; i < names.length; i++) {
          const splitFlag = i % 2 === 0 ? '-v' : '-h';
          cmd += ` \\; split-window ${splitFlag} "pm2 logs '${names[i]}'"`;
        }
        cmd += ` \\; attach-session -d -t bot-logs`;
        return cmd;
      }

      if (logMode === 'screen') {
        return names.map(n => `screen -S 'logs-${n}' -d -m pm2 logs '${n}'`).join("\n") + 
          `\n# To view a session, run: screen -r 'logs-${names[0]}'`;
      }

      if (logMode === 'raw') {
        return names.map((n, idx) => `# Terminal Window ${idx + 1}:\npm2 logs '${n}'`).join("\n\n");
      }
    }

    if (batchAction === 'stop') {
      const names = selectedIds.map(id => {
        const acc = accounts.find(a => a.id === id);
        return acc ? `'bot-${acc.name}'` : '';
      }).filter(Boolean).join(" ");
      return `pm2 stop ${names}`;
    }

    if (batchAction === 'restart') {
      const names = selectedIds.map(id => {
        const acc = accounts.find(a => a.id === id);
        return acc ? `'bot-${acc.name}'` : '';
      }).filter(Boolean).join(" ");
      return `pm2 restart ${names}`;
    }
    
    return selectedIds.map(id => {
      const acc = accounts.find(a => a.id === id);
      if (!acc) return "";
      
      switch (batchAction) {
        case 'handshake':
          return `cd ~/wavecollect && node src/bot/auto-login.js '${acc.name}' '${acc.email}' '${acc.botPassword}' '${acc.proxyConfig || ''}' --terminal`;
        case 'start':
          return `cd ~/wavecollect && pm2 start src/bot/bot.js --name 'bot-${acc.name}' -- '${acc.name}'`;
        default:
          return "";
      }
    }).filter(Boolean).join("\n");
  };

  const copyToClipboard = (text: string, id: string) => {
    try {
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

  const saveReportId = async (id: string) => {
    try {
      const res = await fetch("/api/staff/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: 'set_report_id', reportId: reportIdValue }),
      });
      const json = await res.json();
      if (json.status === "success") {
        fetchAccounts();
        setEditingReportId(null);
      }
    } catch (e) {
      console.error("Failed to save report ID", e);
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
       <Loader2 className="w-10 h-10 text-slate-350 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-slate-705 tracking-tighter">Security Gate</h1>
          <p className="text-slate-500 font-medium text-sm">Review credentials and activate remote browser sessions.</p>
        </div>
        <button 
          onClick={() => setShowPoolModal(true)}
          className="w-full md:w-auto px-6 py-3.5 bg-blue-600 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
        >
           <Plus className="w-4 h-4" /> Create Pool Account
        </button>
      </div>

      {/* Interactive Batch Command Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
               <h3 className="text-slate-700 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" /> Multi-Account Batch Terminal
               </h3>
               <p className="text-[10px] text-slate-550 font-bold uppercase tracking-tight">
                  Select multiple nodes below to generate a single-block copyable execution command.
               </p>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => {
                   if (selectedIds.length === accounts.length) {
                     setSelectedIds([]);
                   } else {
                     setSelectedIds(accounts.map(a => a.id));
                   }
                 }}
                 className="text-[10px] font-black text-slate-500 hover:text-slate-750 uppercase transition-colors mr-2 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50"
               >
                  {selectedIds.length === accounts.length ? 'Deselect All' : 'Select All'}
               </button>
               <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  {selectedIds.length} Nodes Selected
               </span>
               {selectedIds.length > 0 && (
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase transition-colors"
                  >
                     Clear Selection
                  </button>
               )}
            </div>
         </div>

         {/* Command Purpose Selector */}
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
            {[
              { id: 'start', label: 'Start Engines', desc: 'pm2 start' },
              { id: 'handshake', label: 'Handshake', desc: 'node auto-login' },
              { id: 'logs', label: 'View Logs', desc: 'pm2 logs' },
              { id: 'stop', label: 'Stop Engines', desc: 'pm2 stop' },
              { id: 'restart', label: 'Restart Engines', desc: 'pm2 restart' }
            ].map(act => (
              <button
                key={act.id}
                onClick={() => setBatchAction(act.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  batchAction === act.id 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10' 
                    : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100/50'
                }`}
              >
                 <span className="text-[10px] font-black uppercase tracking-wider">{act.label}</span>
                 <span className={`text-[8px] font-mono mt-0.5 ${batchAction === act.id ? 'text-blue-100' : 'text-slate-400'}`}>{act.desc}</span>
              </button>
            ))}
         </div>

          {/* Log Window Mode Sub-Selector */}
          {batchAction === 'logs' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                    Log Window Mode
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      { id: 'combined', label: 'Single Consolidated Window', desc: 'Space separated logs' },
                      { id: 'tmux', label: 'tmux Splits (Side-by-Side Windows)', desc: 'Beautiful split panels' },
                      { id: 'screen', label: 'Background Sessions (screen)', desc: 'Virtual screens' },
                      { id: 'raw', label: 'Separate Shell Windows', desc: 'Raw separate commands' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setLogMode(mode.id)}
                        className={`text-left px-3.5 py-2.5 rounded border transition-all flex flex-col justify-center ${
                          logMode === mode.id
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-605/10'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-700 hover:border-slate-350 shadow-sm'
                        }`}
                      >
                         <span className="text-[10px] font-black uppercase tracking-wider">{mode.label}</span>
                         <span className={`text-[8px] mt-0.5 font-medium leading-tight ${logMode === mode.id ? 'text-blue-100' : 'text-slate-450'}`}>{mode.desc}</span>
                      </button>
                    ))}
                 </div>
              </div>
          )}

         {/* Generated Terminal Block */}
         <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
               <span className="text-[9px] font-mono text-slate-500 uppercase">GENERATED SHELL COMMAND BLOCK</span>
               {selectedIds.length > 0 && (
                  <button 
                    onClick={() => {
                      copyToClipboard(getBatchCommand(), 'batch-copy');
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                      copiedId === 'batch-copy' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                     {copiedId === 'batch-copy' ? '✓ Copied!' : 'Copy Command Block'}
                  </button>
               )}
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-600 min-h-[64px] max-h-48 whitespace-pre font-semibold">
               {getBatchCommand()}
            </pre>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Account List */}
        <div className="xl:col-span-2 space-y-4">
           {accounts.length === 0 ? (
             <div className="bg-white border border-dashed border-slate-300 rounded-md p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Queue Empty</p>
             </div>
           ) : (
             accounts.map((account) => (
               <div key={account.id} className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-all">
                  <div className="p-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           {/* Checkbox selector */}
                           <button
                             onClick={() => {
                               if (selectedIds.includes(account.id)) {
                                 setSelectedIds(selectedIds.filter(id => id !== account.id));
                               } else {
                                 setSelectedIds([...selectedIds, account.id]);
                               }
                             }}
                             className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                               selectedIds.includes(account.id)
                                 ? 'bg-blue-600 border-blue-500 text-white'
                                 : 'bg-white border-slate-350 hover:border-slate-400 text-transparent hover:bg-slate-50'
                             }`}
                           >
                              <span className="text-[10px] font-bold">✓</span>
                           </button>

                           <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 border ${
                             account.reviewStatus === 'PENDING_REVIEW' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                             account.reviewStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                             'bg-slate-50 border-slate-100 text-slate-400'
                           }`}>
                              <User className="w-6 h-6" />
                           </div>
                           <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                 <h3 className="font-black text-slate-700 text-sm md:text-base">{account.name}</h3>
                                 <StatusBadge status={account.reviewStatus} type="review" />
                                 <StatusBadge status={account.sessionStatus} type="session" />
                              </div>
                              <p className="text-xs text-slate-400 font-mono truncate">{account.email}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-bold text-slate-500 uppercase">
                                 <span className="flex items-center gap-1 truncate"><Building className="w-3 h-3 shrink-0" /> {account.merchant?.businessName || account.merchant?.name}</span>
                                 <span className="hidden md:inline">•</span>
                                 <span>Added {format(new Date(account.createdAt), 'MMM dd, HH:mm')}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                           {account.reviewStatus === 'PENDING_REVIEW' && (
                             <>
                                <button 
                                  onClick={() => handleAction(account.id, 'approve')}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                                >
                                   <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button 
                                  onClick={() => handleAction(account.id, 'reject')}
                                  className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all shadow-sm"
                                >
                                   Reject
                                </button>
                             </>
                           )}

                           {account.reviewStatus === 'APPROVED' && account.sessionStatus !== 'ONLINE' && (
                             <button 
                               onClick={() => handleAction(account.id, 'activate')}
                               className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                             >
                                <Monitor className="w-3.5 h-3.5" /> Start Handshake
                             </button>
                           )}

                           {account.sessionStatus === 'ONLINE' && (
                              <button 
                                onClick={() => setActiveHandshake(account)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                              >
                                 <Monitor className="w-3.5 h-3.5" /> Open Browser
                              </button>
                           )}
                        </div>
                     </div>

                     {/* Credential Reveal Section */}
                     <div className="mt-4 md:mt-6 p-4 bg-slate-50/50 rounded-md border border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Account</p>
                              <p className="text-xs font-bold text-slate-700 truncate">{account.email}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</p>
                              <div className="flex items-center gap-2">
                                 <span className="text-xs font-mono font-bold text-slate-700">
                                    {showPassword === account.id ? account.botPassword : '••••••••••••'}
                                 </span>
                                 <button 
                                   onClick={() => setShowPassword(showPassword === account.id ? null : account.id)}
                                   className="text-slate-400 hover:text-slate-705 transition-colors"
                                 >
                                    {showPassword === account.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                 </button>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UPI ID</p>
                              <p className="text-xs font-bold text-slate-700">{account.upiId}</p>
                           </div>
                        </div>

                        {/* Merchant ID (Report ID) */}
                        <div className="space-y-1.5 pt-3 border-t border-slate-200">
                           <div className="flex items-center justify-between">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                 <Terminal className="w-3 h-3" /> Merchant ID (BCR)
                              </p>
                              {account.reportId && (
                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Auto-Discovered</span>
                              )}
                           </div>
                           {editingReportId === account.id ? (
                             <div className="flex items-center gap-2">
                                 <input
                                   value={reportIdValue}
                                   onChange={(e) => setReportIdValue(e.target.value.trim())}
                                   placeholder="BCR2DN5T7OGZNGQJ"
                                   className="flex-1 px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-mono font-bold outline-none focus:ring-4 focus:ring-blue-600/10"
                                   autoFocus
                                 />
                                 <button
                                   onClick={() => saveReportId(account.id)}
                                   disabled={!reportIdValue}
                                   className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
                                 >
                                   Save
                                 </button>
                                 <button
                                   onClick={() => setEditingReportId(null)}
                                   className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase"
                                 >
                                   ✕
                                 </button>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                                 <p className={`text-xs font-mono font-bold ${account.reportId ? 'text-slate-705' : 'text-rose-600 italic'}`}>
                                    {account.reportId || 'Not set — bot will auto-discover on login'}
                                 </p>
                                 <button
                                   onClick={() => { setEditingReportId(account.id); setReportIdValue(account.reportId || ''); }}
                                   className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[8px] font-black uppercase hover:bg-slate-300 transition-all"
                                 >
                                   {account.reportId ? 'Edit' : 'Set Manually'}
                                 </button>
                              </div>
                           )}
                           {!account.reportId && (
                             <p className="text-[9px] text-amber-600 font-medium mt-1">⚠ If auto-discovery fails after login, find the BCR ID from pay.google.com/g4b/transactions/BCR... URL</p>
                           )}
                        </div>
                        {account.proxyConfig && (
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proxy Route</p>
                             <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 truncate">
                                <ShieldCheck className="w-3 h-3 shrink-0" /> {account.proxyConfig}
                             </p>
                          </div>
                        )}
                        <div className="w-full grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 pt-4 border-t border-slate-200">
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                 <Terminal className="w-3 h-3 text-slate-400" /> 1. Manual Handshake
                              </p>
                              <button 
                                onClick={() => {
                                  const cmd = `cd ~/wavecollect && node src/bot/auto-login.js '${account.name}' '${account.email}' '${account.botPassword}' '${account.proxyConfig || ''}' --terminal`;
                                  copyToClipboard(cmd, `hs-${account.id}`);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[9px] font-mono transition-all ${
                                  copiedId === `hs-${account.id}` ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
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
                                  const cmd = `cd ~/wavecollect && pm2 start src/bot/bot.js --name 'bot-${account.name}' -- '${account.name}'`;
                                  copyToClipboard(cmd, `pm-${account.id}`);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[9px] font-mono transition-all ${
                                  copiedId === `pm-${account.id}` ? 'bg-emerald-600 text-white shadow-lg' : 'bg-blue-650 text-white hover:bg-blue-700 shadow-md'
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
                                  const cmd = `pm2 logs 'bot-${account.name}'`;
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
                         <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Live Handshake: {activeHandshake.name}</h3>
                      </div>
                      <button 
                        onClick={() => setActiveHandshake(null)}
                        className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-600"
                      >
                         Close
                      </button>
                   </div>
                   <CloudBrowser name={activeHandshake.name} />
                   <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-[10px] text-slate-500 font-mono space-y-1">
                      <p className="text-emerald-600 font-bold">[SYSTEM] Connection Established</p>
                      <p>[INFO] Target: {activeHandshake.email}</p>
                      <p>[INFO] Waiting for manual Google login completion...</p>
                   </div>
                </div>
              ) : (
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <Monitor className="w-8 h-8" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Handshake Monitor</p>
                      <p className="text-xs text-slate-400 font-medium">Select an account to start remote browser session.</p>
                   </div>
                </div>
              )}
              
              <div className="bg-amber-50 border border-amber-100 rounded-md p-6 space-y-3">
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
           <div className="absolute inset-0 bg-slate-300/40 backdrop-blur-sm" onClick={() => setShowPoolModal(false)} />
           <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100">
                       <Globe className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-700">Create Pool Account</h2>
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
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-700" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPI Endpoint</label>
                          <input 
                            value={newPoolAccount.upiId} 
                            onChange={(e) => setNewPoolAccount({...newPoolAccount, upiId: e.target.value})}
                            placeholder="pool@okaxis" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-700" 
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Google Email</label>
                       <input 
                         value={newPoolAccount.email} 
                         onChange={(e) => setNewPoolAccount({...newPoolAccount, email: e.target.value})}
                         placeholder="gpay-pool-1@gmail.com" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-700" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                       <input 
                         type="password"
                         value={newPoolAccount.password} 
                         onChange={(e) => setNewPoolAccount({...newPoolAccount, password: e.target.value})}
                         placeholder="••••••••" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-700" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proxy Configuration (Optional)</label>
                       <input 
                         value={newPoolAccount.proxy} 
                         onChange={(e) => setNewPoolAccount({...newPoolAccount, proxy: e.target.value})}
                         placeholder="http://user:pass@ip:port" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-700" 
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex items-center gap-3">
                    <button 
                      onClick={() => setShowPoolModal(false)}
                      className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                      onClick={createPoolAccount}
                      disabled={isCreating || !newPoolAccount.name || !newPoolAccount.email || !newPoolAccount.password || !newPoolAccount.upiId}
                      className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
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
      OFFLINE: 'bg-slate-100 text-slate-650',
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
        className="relative bg-slate-50 rounded-md overflow-hidden border border-slate-200 shadow-sm cursor-crosshair aspect-[1280/800] w-full group outline-none"
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
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
          className="flex-grow px-4 py-2.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 placeholder:text-slate-400 outline-none"
        />
        <button 
          onClick={sendText}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20"
        >
          Send
        </button>
      </div>
    </div>
  );
}
