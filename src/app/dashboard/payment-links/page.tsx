"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Plus, ExternalLink, Copy, Trash2, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  description: string | null;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    const res = await fetch("/api/payment-links");
    const data = await res.json();
    setLinks(data.data || []);
  }

  async function createLink() {
    if (!title || !amount) return;
    setLoading(true);
    await fetch("/api/payment-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount, description }),
    });
    setTitle(""); setAmount(""); setDescription(""); setShowCreate(false);
    await fetchLinks();
    setLoading(false);
  }

  async function deleteLink(id: string) {
    await fetch(`/api/payment-links?id=${id}`, { method: "DELETE" });
    await fetchLinks();
  }

  function copyUrl(slug: string) {
    const url = `${window.location.origin}/link/${slug}`;
    navigator.clipboard.writeText(url);
  }

  const filteredLinks = links.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-24 font-sans px-2 md:px-0 max-w-5xl mx-auto">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-700">Payment Gateways</h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">Deployable checkout surfaces</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`flex items-center gap-2 px-6 py-3 rounded-md shadow-lg transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest ${
            showCreate ? 'bg-slate-50 text-slate-500 border border-slate-200 shadow-none' : 'bg-blue-600 text-white shadow-blue-600/20'
          }`}
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Dismiss' : 'New Link'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-2 md:px-0">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text"
            placeholder="Search by title or descriptor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-md text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-sm placeholder:text-slate-350"
          />
        </div>
      </div>

      {/* Create Form Overlay */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-md border border-slate-200 p-6 md:p-8 space-y-8 shadow-xl relative z-20"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-black text-slate-700">Link Provisioning</h3>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure payment surface parameters</p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Label</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Digital Goods"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-750 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Price Point (₹)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  placeholder="99.00"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 text-slate-750"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Product Context</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional brief description"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 text-slate-750"
                />
              </div>
            </div>
            <div className="flex gap-4 bg-slate-50 -mx-6 -mb-6 md:-mx-8 md:-mb-8 p-6 md:p-8 border-t border-slate-100">
              <button
                onClick={createLink}
                disabled={loading || !title || !amount}
                className="w-full py-4 bg-blue-600 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-95"
              >
                {loading ? "Provisioning..." : "Generate Payment surface"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Links List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredLinks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-md border-2 border-dashed border-slate-100 p-16 text-center"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-center mx-auto mb-6">
                 <LinkIcon className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Vault is empty</p>
            </motion.div>
          ) : (
            filteredLinks.map((link) => (
               <motion.div 
                 layout
                 key={link.id}
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 className="bg-white rounded-md border border-slate-200 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm hover:border-slate-300 transition-all"
               >
                 <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                   <div className="w-14 h-14 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 border border-blue-100 shrink-0 shadow-sm">
                     <LinkIcon className="w-6 h-6" />
                   </div>
                   <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-black text-slate-700 tracking-tight leading-none truncate">{link.title}</p>
                        <div className={`w-1.5 h-1.5 rounded-full ${link.isActive ? "bg-emerald-500" : "bg-rose-500"} shadow-[0_0_5px_rgba(16,185,129,0.5)]`} />
                     </div>
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[200px]">{link.description || "Active Payment Interface"}</p>
                   </div>
                   <div className="text-right shrink-0 px-4 py-2 bg-slate-50 rounded-md border border-slate-100">
                     <p className="text-lg font-black text-slate-700 leading-none">₹{link.amount.toLocaleString()}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Fixed Value</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-2 border-t md:border-0 pt-4 md:pt-0">
                   <button onClick={() => copyUrl(link.slug)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 hover:bg-slate-50 active:scale-95 shadow-sm">
                     <Copy className="w-3.5 h-3.5" />
                     <span>Copy</span>
                   </button>
                   <a href={`/link/${link.slug}`} target="_blank" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-600/20 active:scale-95">
                     <ExternalLink className="w-3.5 h-3.5" />
                     <span>View</span>
                   </a>
                   <button onClick={() => deleteLink(link.id)} className="p-3 text-rose-500 bg-rose-50 border border-rose-100 rounded-md hover:bg-rose-100 transition-colors active:scale-95" title="Delete">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
