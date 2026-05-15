"use client";

import React, { useState } from "react";
import { Wallet, ArrowRight, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RechargeClient() {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const presets = ["500", "1000", "2000", "5000", "10000"];

  const handleRecharge = async () => {
    if (!amount || parseFloat(amount) < 1) {
      setError("Please enter a valid amount (Min ₹1)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/recharge", {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      const data = await res.json();

      if (data.success && data.paymentToken) {
        // Redirect to the hosted payment page
        router.push(`/pay/${data.paymentToken}`);
      } else {
        setError(data.error || "Failed to create recharge intent");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Wallet size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recharge Wallet</h1>
        <p className="text-slate-500 font-medium">Add balance to cover your transaction fees</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-8">
        {/* Amount Input */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Amount</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className={`py-3 rounded-xl text-xs font-black transition-all border ${
                  amount === p 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" 
                    : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-200"
                }`}
              >
                ₹{p}
              </button>
            ))}
          </div>
          
          <div className="relative mt-4">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-5 text-2xl font-black text-slate-900 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3">
            <ShieldCheck size={16} className="shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleRecharge}
          disabled={loading}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Generate Recharge Link <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3">
            <Zap className="text-amber-500 shrink-0" size={18} />
            <div>
              <p className="text-[11px] font-black uppercase text-slate-900">Instant Credit</p>
              <p className="text-[10px] text-slate-500 font-medium">Balance added immediately after UPI verification</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
            <div>
              <p className="text-[11px] font-black uppercase text-slate-900">Secure Payment</p>
              <p className="text-[10px] text-slate-500 font-medium">Billed through our secure admin gateway</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        🛡️ PCI-DSS COMPLIANT | 🔒 256-BIT ENCRYPTION
      </p>
    </div>
  );
}
