"use client";

import { useState, useEffect } from "react";
import { 
  Users, CheckCircle2, AlertTriangle, Key, Loader2, Play, Square, Settings, Link as LinkIcon, Unlink, Edit
} from "lucide-react";

export default function PoolManagementPage() {
  const [data, setData] = useState<any>({ poolAccounts: [], pendingRequests: [], summary: {} });
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [allocateModal, setAllocateModal] = useState<{ merchant: any, accountId?: string } | null>(null);
  const [editModal, setEditModal] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);

  // Form State for Allocation & Creation
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [totalQuota, setTotalQuota] = useState("500000");
  const [minTicket, setMinTicket] = useState("0");
  const [maxTicket, setMaxTicket] = useState("100000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/staff/pool");
      const json = await res.json();
      if (json.status === "success") {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/staff/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
          upiId: formData.get("upiId")
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        setCreateModal(false);
        fetchData();
      } else {
        alert(json.error || "Failed to create pool account");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAllocate() {
    if (!allocateModal || !selectedAccountId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staff/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          merchantId: allocateModal.merchant.id,
          totalQuota,
          minTicket,
          maxTicket
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        setAllocateModal(null);
        fetchData();
      } else {
        alert(json.error || "Failed to allocate");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(accountId: string, action: string, updates: any = {}) {
    if (action === "detach" && !confirm("Are you sure you want to detach this account? The merchant will revert to own-account mode.")) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staff/pool", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, action, ...updates })
      });
      const json = await res.json();
      if (json.status === "success") {
        setEditModal(null);
        fetchData();
      } else {
        alert(json.error || "Failed to update");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Platform Pool</h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium">Manage shared Google Pay accounts and merchant allocations.</p>
        </div>
        <button 
          onClick={() => setCreateModal(true)}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
        >
          + Add Pool Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Pool</p>
          <p className="text-2xl font-black text-slate-900">{data.summary.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Allocated</p>
          <p className="text-2xl font-black text-blue-600">{data.summary.allocated || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Available</p>
          <p className="text-2xl font-black text-emerald-600">{data.summary.available || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Requests</p>
          <p className="text-2xl font-black text-amber-500">{data.summary.pendingRequests || 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Pool Accounts */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Pool Inventory</h2>
          
          {data.poolAccounts.map((acc: any) => {
            const isAssigned = acc.allocationStatus !== "UNASSIGNED";
            const isExhausted = acc.allocationStatus === "EXHAUSTED";
            const isOnline = acc.sessionStatus === "ONLINE";

            return (
              <div key={acc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row gap-6">
                {/* Account Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900 truncate">{acc.name}</h3>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {acc.sessionStatus}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-500 font-mono mb-3">{acc.upiId}</p>
                  
                  {isAssigned ? (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Allocated to: {acc.allocatedToMerchant?.name || "Unknown"}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isExhausted ? 'bg-rose-100 text-rose-600' : acc.allocationStatus === 'PAUSED' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                          {acc.allocationStatus}
                        </span>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-1">
                          <span>₹{(Number(acc.usedQuota)).toLocaleString()} used</span>
                          <span>₹{(Number(acc.totalQuota)).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isExhausted ? 'bg-rose-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((Number(acc.usedQuota) / Number(acc.totalQuota)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                        <button onClick={() => setEditModal(acc)} className="text-[10px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1">
                          <Edit className="w-3 h-3" /> Edit Quota
                        </button>
                        <button onClick={() => handleUpdate(acc.id, acc.allocationStatus === 'PAUSED' ? 'resume' : 'pause')} className="text-[10px] font-black text-slate-500 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1">
                          {acc.allocationStatus === 'PAUSED' ? <Play className="w-3 h-3" /> : <Square className="w-3 h-3" />} 
                          {acc.allocationStatus === 'PAUSED' ? 'Resume' : 'Pause'}
                        </button>
                        <button onClick={() => handleUpdate(acc.id, 'detach')} className="text-[10px] font-black text-slate-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1 ml-auto">
                          <Unlink className="w-3 h-3" /> Detach
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Ready for allocation
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {data.poolAccounts.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-500 font-medium">No platform pool accounts found.</p>
              <p className="text-xs text-slate-400 mt-1">Add accounts with "accountType: PLATFORM_POOL" in the database.</p>
            </div>
          )}
        </div>

        {/* Right Column: Merchant Requests */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Pending Requests</h2>
          
          {data.pendingRequests.map((req: any) => (
            <div key={req.id} className="bg-amber-50 rounded-2xl border border-amber-100 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">{req.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{req.email}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Requested: {new Date(req.poolRequestedAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setAllocateModal({ merchant: req })}
                className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-sm"
              >
                Review & Allocate
              </button>
            </div>
          ))}

          {data.pendingRequests.length === 0 && (
            <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">All caught up</p>
              <p className="text-xs text-slate-400">No pending pool requests.</p>
            </div>
          )}
        </div>
      </div>

      {/* Allocate Modal */}
      {allocateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Allocate Pool Account</h2>
              <p className="text-xs text-slate-500 mt-1">Assign an account to {allocateModal.merchant.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Select Pool Account</label>
                <select 
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Select an available account --</option>
                  {data.poolAccounts.filter((a: any) => a.allocationStatus === "UNASSIGNED").map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.upiId}) - {a.sessionStatus}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Total Quota (₹)</label>
                <input 
                  type="number" 
                  value={totalQuota}
                  onChange={(e) => setTotalQuota(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Min Ticket</label>
                  <input type="number" value={minTicket} onChange={(e) => setMinTicket(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Ticket</label>
                  <input type="number" value={maxTicket} onChange={(e) => setMaxTicket(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setAllocateModal(null)} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleAllocate} disabled={!selectedAccountId || isSubmitting} className="px-6 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center gap-2">
                {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quota Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Update Quota</h2>
              <p className="text-xs text-slate-500 mt-1">{editModal.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Total Quota (₹)</label>
                <input 
                  type="number" 
                  defaultValue={editModal.totalQuota}
                  id="edit-total-quota"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Min Ticket</label>
                  <input type="number" defaultValue={editModal.minTicket} id="edit-min-ticket" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Ticket</label>
                  <input type="number" defaultValue={editModal.maxTicket} id="edit-max-ticket" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-between gap-3 border-t border-slate-100">
              <button onClick={() => handleUpdate(editModal.id, 'reset_quota')} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">Reset Used</button>
              <div className="flex gap-2">
                <button onClick={() => setEditModal(null)} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button 
                  onClick={() => {
                    const tq = (document.getElementById('edit-total-quota') as HTMLInputElement).value;
                    const min = (document.getElementById('edit-min-ticket') as HTMLInputElement).value;
                    const max = (document.getElementById('edit-max-ticket') as HTMLInputElement).value;
                    handleUpdate(editModal.id, 'update_quota', { totalQuota: tq, minTicket: min, maxTicket: max });
                  }} 
                  disabled={isSubmitting} 
                  className="px-6 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Pool Account Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Add Platform Pool Account</h2>
              <p className="text-xs text-slate-500 mt-1">This account will be available for allocation</p>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Alias / Name</label>
                  <input name="name" required placeholder="e.g. pool-primary" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Google Email</label>
                  <input name="email" type="email" required placeholder="pool1@gmail.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Google Password</label>
                  <input name="password" type="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">UPI ID</label>
                  <input name="upiId" required placeholder="pool1@okaxis" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setCreateModal(false)} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg disabled:opacity-50 hover:bg-slate-800 transition-colors flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
