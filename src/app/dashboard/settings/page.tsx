"use client";

import { useState, useEffect } from "react";
import { Globe, Bell, Smartphone, Plus, CheckCircle2, Save, Trash2, Zap } from "lucide-react";

interface GPayAccount {
  id: string;
  name: string;
  email: string;
  upiId: string;
  status: string;
  lastSync: string | null;
}

export default function SettingsPage() {
  const [redirectUrl, setRedirectUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [accounts, setAccounts] = useState<GPayAccount[]>([]);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUpiId, setNewUpiId] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setRedirectUrl(d.data.redirectUrl || "");
          setWebhookUrl(d.data.webhookUrl || "");
        }
      });
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const res = await fetch("/api/gpay-accounts");
    const data = await res.json();
    setAccounts(data.data || []);
  }

  async function saveConfig() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUrl, webhookUrl }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function addAccount() {
    if (!newName || !newEmail || !newUpiId) return;
    await fetch("/api/gpay-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, upiId: newUpiId }),
    });
    setNewName(""); setNewEmail(""); setNewUpiId(""); setShowAdd(false);
    await fetchAccounts();
  }

  async function removeAccount(id: string) {
    await fetch(`/api/gpay-accounts?id=${id}`, { method: "DELETE" });
    await fetchAccounts();
  }

  return (
    <div className="space-y-8 pb-20 font-sans max-w-4xl mx-auto px-2 md:px-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-xs md:text-base mt-1">Configure your platform preferences.</p>
      </div>

      <div className="space-y-6">
        {/* API Section */}
        <section className="space-y-3">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">API & Webhooks</h3>
           <div className="bg-white rounded-[32px] md:rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-6 md:p-8 space-y-6">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 px-1">
                     <Globe className="w-4 h-4 text-primary" />
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Redirect URL</label>
                   </div>
                   <input
                     type="text"
                     value={redirectUrl}
                     onChange={(e) => setRedirectUrl(e.target.value)}
                     placeholder="https://app.yoursite.com/payment-success"
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm md:text-base focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 px-1">
                     <Zap className="w-4 h-4 text-primary" />
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Webhook Endpoint</label>
                   </div>
                   <input
                     type="text"
                     value={webhookUrl}
                     onChange={(e) => setWebhookUrl(e.target.value)}
                     placeholder="https://api.yoursite.com/webhooks/wave"
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm md:text-base focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                   />
                 </div>
               </div>

               <button
                 onClick={saveConfig}
                 className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
               >
                 {saved ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Changes Saved</> : <><Save className="w-4 h-4" /> Save Configuration</>}
               </button>
             </div>
           </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-3">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Preferences</h3>
           <div className="bg-white rounded-[32px] md:rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
             
             <div className="p-5 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary border border-blue-100">
                   <Bell className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-sm font-black text-slate-900">Email Notifications</p>
                   <p className="text-[10px] md:text-xs text-slate-500 font-medium">Daily transaction summaries</p>
                 </div>
               </div>
               <div className="w-12 h-7 bg-primary rounded-full relative transition-all shadow-inner">
                  <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
               </div>
             </div>

             <div className="p-5 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                   <Smartphone className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-sm font-black text-slate-900">Push Alerts</p>
                   <p className="text-[10px] md:text-xs text-slate-500 font-medium">Instant mobile notifications</p>
                 </div>
               </div>
               <div className="w-12 h-7 bg-slate-200 rounded-full relative transition-all">
                  <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
               </div>
             </div>

           </div>
        </section>

      </div>
    </div>
  );
}
