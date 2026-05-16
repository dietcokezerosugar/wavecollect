"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Percent,
  Globe,
  CheckCircle2,
  XCircle,
  ZapOff,
  Zap,
  Edit2,
  Save,
  X,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [ipRequests, setIpRequests] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // New Merchant State
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<any>({
    name: "",
    email: "",
    walletBalance: 0,
    commissionRate: 2,
    disableWallet: false,
    agentId: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchMerchants(), fetchIpRequests(), fetchAgents()]);
    setLoading(false);
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/referrals");
      const data = await res.json();
      setAgents(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchMerchants = async () => {
    const res = await fetch("/api/admin/merchants");
    const data = await res.json();
    setMerchants(data.data || []);
  };

  const fetchIpRequests = async () => {
    try {
      const res = await fetch("/api/admin/ip-whitelist");
      const data = await res.json();
      setIpRequests(data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (id: string, updates: any) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
      setEditingId(null);
      await fetchMerchants();
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddMerchant = async () => {
    if (!addForm.name || !addForm.email) return alert("Name and Email are required");
    setLoading(true);
    try {
      await fetch("/api/admin/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      setIsAdding(false);
      fetchMerchants();
    } finally {
      setLoading(false);
    }
  };

  const handleIpRequest = async (id: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(`ip-${id}`);
    await fetch("/api/admin/ip-whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    await Promise.all([fetchIpRequests(), fetchMerchants()]);
    setActionLoading(null);
  };

  const startEditing = (m: any) => {
    setEditingId(m.id);
    setEditForm({
      walletBalance: m.walletBalance,
      commissionRate: m.commissionRate,
      disableWallet: m.disableWallet,
      status: m.status
    });
  };

  const pendingIpRequests = ipRequests.filter(r => r.status === "PENDING");

  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="p-4 px-6"><div className="w-40 h-10 bg-slate-100 rounded-md"></div></td>
      <td className="p-4 px-6"><div className="w-24 h-6 bg-slate-50 rounded-lg"></div></td>
      <td className="p-4 px-6"><div className="w-20 h-6 bg-slate-50 rounded-lg"></div></td>
      <td className="p-4 px-6"><div className="w-24 h-8 bg-slate-100 rounded-full"></div></td>
      <td className="p-4 px-6 text-right"><div className="w-8 h-8 bg-slate-100 rounded-lg ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight"
          >
            Merchant Fleet
          </motion.h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Full Control & Wallet Management</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black border border-emerald-100 flex items-center gap-2">
                <Wallet size={12} /> Total Float: ₹{merchants.reduce((acc, m) => acc + m.walletBalance, 0).toLocaleString()}
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold shadow-md shadow-blue-600/10 active:scale-95 transition-all"
            >
              + Add New Merchant
            </button>
        </div>
      </div>

      {/* Add Merchant Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsAdding(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">New Merchant Onboarding</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">SaaS Configuration</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Merchant Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                      onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                      onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Initial Balance</label>
                      <input 
                        type="number" 
                        defaultValue="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                        onChange={(e) => setAddForm({...addForm, walletBalance: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fee Rate (%)</label>
                      <input 
                        type="number" 
                        defaultValue="2"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                        onChange={(e) => setAddForm({...addForm, commissionRate: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Referral Agent (Optional)</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                      onChange={(e) => setAddForm({...addForm, agentId: e.target.value})}
                      value={addForm.agentId || ""}
                    >
                      <option value="">No Agent (Direct Sign-up)</option>
                      {agents.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.referralCode})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                     <div className="flex items-center gap-3">
                        <ZapOff size={18} className="text-amber-500" />
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Wallet Bypass</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Allow zero balance</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => setAddForm({...addForm, disableWallet: !addForm.disableWallet})}
                       className={`w-12 h-6 rounded-full relative transition-all ${addForm.disableWallet ? 'bg-amber-500' : 'bg-slate-300'}`}
                     >
                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${addForm.disableWallet ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleAddMerchant()} className="flex-1 py-4 bg-blue-600 text-white rounded-md font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all">
                    Create Account
                  </button>
                  <button onClick={() => setIsAdding(false)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-md font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IP Whitelist Requests */}
      <AnimatePresence>
        {pendingIpRequests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-md border border-amber-200 overflow-hidden shadow-sm"
          >
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center gap-3">
              <Globe className="text-amber-600 w-5 h-5" />
              <h3 className="text-sm font-black text-amber-900">Pending IP Whitelist Requests</h3>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-md">{pendingIpRequests.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingIpRequests.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-black text-slate-900">{req.ipAddress}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">Merchant: <span className="text-slate-700">{req.merchant?.name}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleIpRequest(req.id, "APPROVE")}
                      disabled={actionLoading === `ip-${req.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[11px] font-black transition-all border border-emerald-100 disabled:opacity-50"
                    >
                      {actionLoading === `ip-${req.id}` ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merchants Table */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallet Control</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">SaaS Config</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enforcement</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              merchants.map((m, idx) => {
                const isEditing = editingId === m.id;
                const isProcessing = actionLoading === m.id;
                return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={m.id} 
                    className={`hover:bg-slate-50/80 transition-all group ${isProcessing ? 'opacity-50' : ''}`}
                  >
                    <td className="p-4 px-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black border border-slate-800">
                            {m.name[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900 leading-tight">{m.name}</p>
                            <p className="text-[11px] font-medium text-slate-500">{m.email}</p>
                          </div>
                       </div>
                    </td>
                    
                    <td className="p-4 px-6">
                      {isEditing ? (
                        <div className="relative max-w-[120px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">₹</span>
                          <input 
                            type="number" 
                            value={editForm.walletBalance}
                            onChange={(e) => setEditForm({...editForm, walletBalance: parseFloat(e.target.value)})}
                            className="w-full bg-slate-100 border-none rounded-lg py-2 pl-6 pr-3 text-[11px] font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Wallet size={14} />
                          <span className="text-[12px] font-black">₹{m.walletBalance.toLocaleString()}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 px-6">
                      {isEditing ? (
                        <div className="relative max-w-[80px]">
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">%</span>
                          <input 
                            type="number" 
                            value={editForm.commissionRate}
                            onChange={(e) => setEditForm({...editForm, commissionRate: parseFloat(e.target.value)})}
                            className="w-full bg-slate-100 border-none rounded-lg py-2 pl-3 pr-7 text-[11px] font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Percent size={14} />
                          <span className="text-[12px] font-bold">{m.commissionRate}% Fee</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 px-6">
                      <button 
                        onClick={() => isEditing ? setEditForm({...editForm, disableWallet: !editForm.disableWallet}) : handleUpdate(m.id, { disableWallet: !m.disableWallet })}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${
                          (isEditing ? editForm.disableWallet : m.disableWallet) 
                            ? "bg-amber-50 text-amber-600 border-amber-200 shadow-inner" 
                            : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}
                      >
                        {(isEditing ? editForm.disableWallet : m.disableWallet) ? (
                          <><ZapOff size={12} /> Bypass Active</>
                        ) : (
                          <><Zap size={12} /> Enforcing</>
                        )}
                      </button>
                    </td>

                    <td className="p-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={() => handleUpdate(m.id, editForm)}
                              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md"
                            >
                              <Save size={16} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEditing(m)}
                              className="p-2 bg-white text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all shadow-sm"
                            >
                              <Edit2 size={16} />
                            </button>
                            <StatusBadge status={m.status} />
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && merchants.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <Users className="mx-auto text-slate-200" size={48} />
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Merchants Found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-100",
    PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    SUSPENDED: "bg-rose-50 text-rose-600 border-rose-100",
  };
  return <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border inline-block ${styles[status] || styles.PENDING}`}>{status}</span>;
}
