"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCcw, Link as LinkIcon, AlertCircle, CheckCircle2, User, CreditCard, Clock } from "lucide-react";

export default function ReconciliationPanel() {
  const [floating, setFloating] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reconciliation");
      const json = await res.json();
      setFloating(json.floatingTransactions || []);
      setPending(json.pendingIntents || []);
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (!selectedTxn || !selectedIntentId) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MANUAL_MATCH",
          transactionId: selectedTxn.id,
          intentId: selectedIntentId
        })
      });
      if (res.ok) {
        setSelectedTxn(null);
        setSelectedIntentId("");
        fetchData();
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LinkIcon className="text-blue-600" size={32} /> Manual Reconciliation
          </h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Match Floating Transactions to Pending Intents</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Floating Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" /> Floating Payments
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase">{floating.length} Unmatched</span>
          </div>
          
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar">
            {floating.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400 font-black text-[11px] uppercase tracking-widest">No floating transactions</div>
            )}
            <div className="divide-y divide-slate-100">
              {floating.map((txn) => (
                <div 
                  key={txn.id} 
                  onClick={() => setSelectedTxn(txn)}
                  className={`p-4 cursor-pointer transition-all ${selectedTxn?.id === txn.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-lg font-black text-slate-900">₹{txn.amount.toLocaleString()}</p>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">UTR: {txn.utr || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] font-bold text-slate-600">{txn.payerName || 'Unknown Payer'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(txn.timestamp).toLocaleString()}</p>
                    </div>
                    {txn.note && <p className="text-[9px] font-black text-blue-600 uppercase italic">Note: {txn.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reconciliation Controls */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-lg p-8 text-white shadow-xl relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] -mr-10 -mt-10" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Match Action</h3>
              
              {!selectedTxn ? (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-md text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase">Select a floating transaction to match</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white/5 p-4 rounded-md border border-white/10">
                    <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Selected Transaction</p>
                    <div className="flex justify-between items-end">
                      <p className="text-2xl font-black">₹{selectedTxn.amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400">{selectedTxn.payerName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Select Destination Intent</label>
                    <select 
                      value={selectedIntentId}
                      onChange={(e) => setSelectedIntentId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none"
                    >
                      <option value="" disabled className="text-slate-900">Choose pending intent...</option>
                      {pending.map(intent => (
                        <option key={intent.id} value={intent.id} className="text-slate-900">
                          ₹{intent.amount} - {intent.merchant.name} ({intent.referenceId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={handleManualMatch}
                    disabled={!selectedIntentId || processing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    {processing ? <RefreshCcw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Confirm Manual Match
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" /> Recent Activity
            </h4>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
              Manual reconciliation overrides the matching engine rules. Use only when customers pay incorrect amounts or forget to include the reference note.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
