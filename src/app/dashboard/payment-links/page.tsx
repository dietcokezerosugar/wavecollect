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
    <div className="space-y-6 pb-24 font-sans px-2 md:px-0 max-w-5xl mx-auto">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900">Links</h1>
          <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">Shareable Checkouts</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
        >
          {showCreate ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-2 md:px-0">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search your links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-[24px] text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Create Form Overlay */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] border border-slate-200 p-6 md:p-10 space-y-8 shadow-2xl relative z-20"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">Generate New Link</h3>
              <p className="text-sm text-slate-500">Payments collected through this link will be verified instantly.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. VIP Pass"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Price (INR)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  placeholder="999"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief note for customer"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={createLink}
                disabled={loading || !title || !amount}
                className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-base font-black hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10 active:scale-[0.98]"
              >
                {loading ? "Creating..." : "Confirm & Create"}
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
              className="bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-16 text-center"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <LinkIcon className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Zero Links Found</p>
            </motion.div>
          ) : (
            filteredLinks.map((link) => (
              <motion.div 
                layout
                key={link.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-[32px] border border-slate-200 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm active:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-primary border border-indigo-100 shrink-0 shadow-sm">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                       <p className="text-base font-black text-slate-900 truncate">{link.title}</p>
                       <span className={`w-1.5 h-1.5 rounded-full ${link.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{link.description || "Hosted checkout link"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-slate-900 leading-none">₹{link.amount.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Amount</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-0 pt-4 md:pt-0">
                  <button onClick={() => copyUrl(link.slug)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-black transition-all border border-slate-200 active:scale-95">
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  <a href={`/link/${link.slug}`} target="_blank" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-white rounded-xl text-[11px] font-black transition-all shadow-md shadow-blue-600/10 active:scale-95">
                    <ExternalLink className="w-4 h-4" />
                    <span>View</span>
                  </a>
                  <button onClick={() => deleteLink(link.id)} className="p-3.5 text-rose-400 bg-rose-50/50 rounded-xl active:bg-rose-50 transition-colors">
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
