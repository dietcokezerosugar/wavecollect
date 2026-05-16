"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Clock, 
  Network, 
  Plus, 
  Server,
  FileText,
  Webhook,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MerchantIpWhitelistPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [currentIps, setCurrentIps] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [ipAddress, setIpAddress] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/dashboard/ip-whitelist");
      const data = await res.json();
      if (data.status === "success") {
        setRequests(data.data);
        setCurrentIps(data.currentIps);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function submitRequest() {
    if (!acceptedTerms) return setError("You must accept the terms of service");
    
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/ip-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl, acceptedTerms }), // IP is detected server-side
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to submit request.");
      } else {
        setIsModalOpen(false);
        fetchRequests();
      }
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 font-sans max-w-5xl mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Security & Whitelist</h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Manage IP access and webhook legal compliance</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-blue-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/10 flex items-center gap-3"
        >
          <Plus size={18} /> New Whitelist Request
        </button>
      </div>

      {/* Whitelist Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Security Access Request</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">IP & Webhook Legal Compliance</p>
                </div>

                <div className="space-y-4">
                  {/* IP Display (Auto-detect) */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-blue-600 shadow-sm">
                      <Network size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Source IP Detection</p>
                      <p className="text-xs font-bold text-blue-900">Your server IP will be automatically detected and verified upon submission.</p>
                    </div>
                  </div>

                  {/* Webhook Input */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Webhook Endpoint (Destination)</label>
                    <div className="relative mt-1">
                      <Webhook className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                      <input 
                        type="url" 
                        placeholder="https://your-site.com/api/webhook"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-md py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Legal Terms Scrollable Box */}
                  <div className="p-5 bg-slate-50 rounded-md border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-amber-600">
                      <ShieldAlert size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Legal Disclosure</span>
                    </div>
                    <div className="h-32 overflow-y-auto text-[11px] text-slate-500 font-medium leading-relaxed pr-2 custom-scrollbar">
                      <p className="mb-2">1. You authorize PayxMint to access and automate your Google Pay Business account via headless browser technology on your behalf.</p>
                      <p className="mb-2">2. You confirm that all account credentials and data shared are your own, and you have the legal right to use this automation service.</p>
                      <p className="mb-2">3. You agree that PayxMint is not responsible for any Google account suspensions, blocks, or restrictions that may occur as a result of using this automation.</p>
                      <p className="mb-2">4. You acknowledge that transaction data is processed in real-time and you are responsible for maintaining secure webhook endpoints.</p>
                      <p>5. PayxMint acts only as a technology facilitator and does not hold your funds.</p>
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 transition-all">
                       <input 
                         type="checkbox" 
                         checked={acceptedTerms}
                         onChange={(e) => setAcceptedTerms(e.target.checked)}
                         className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                       />
                       <span className="text-[11px] font-black text-slate-900 uppercase">I Accept All Terms & Conditions</span>
                    </label>
                  </div>
                </div>

                {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-md flex items-center gap-2 animate-shake"><AlertTriangle size={14} /> {error}</div>}

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={submitRequest}
                    disabled={submitting}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-md font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? "Processing..." : <>Submit for Approval <ArrowRight size={16} /></>}
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-4 bg-slate-100 text-slate-600 rounded-md font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* History Section */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Request History</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <Clock size={12} /> Live Updates
              </div>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-md animate-pulse" />)}
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 space-y-3">
                   <ShieldCheck className="mx-auto text-slate-200" size={40} />
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No active requests found</p>
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-5 rounded-md border border-slate-100 bg-white hover:border-blue-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-md ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Network size={18} />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-sm text-slate-900">{req.ipAddress}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] text-slate-400 uppercase font-black">{new Date(req.createdAt).toLocaleDateString()}</span>
                          {req.webhookUrl && <span className="text-[9px] text-blue-500 uppercase font-black flex items-center gap-1"><Webhook size={10} /> Webhook Active</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                        req.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-600/5" :
                        req.status === "REJECTED" ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-lg p-6 shadow-2xl text-white space-y-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-white/10 rounded-md text-white border border-white/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/50">Production Status</h3>
                <p className="text-sm font-black text-white mt-0.5">Active Whitelist</p>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {currentIps ? (
                <div className="flex flex-col gap-2">
                  {currentIps.split(",").map(ip => (
                    <div key={ip} className="flex items-center justify-between p-3 bg-white/5 rounded-md border border-white/10 group hover:bg-white/10 transition-all">
                      <span className="text-xs font-mono font-bold text-blue-300">{ip.trim()}</span>
                      <ShieldCheck size={14} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-[10px] font-black uppercase tracking-widest text-center">
                   Critical: IP Whitelist Empty
                </div>
              )}
            </div>
            
            <p className="text-[9px] font-bold text-white/30 uppercase leading-relaxed relative z-10">
               ⚠️ All API calls originating from IPs not listed above will be automatically rejected by the security layer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
