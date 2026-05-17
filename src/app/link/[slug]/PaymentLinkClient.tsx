"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2 } from "lucide-react";

interface PaymentLinkClientProps {
  slug: string;
  merchantName: string;
  linkTitle: string;
  linkDescription: string | null;
  linkAmount: number;
}

export default function PaymentLinkClient({
  slug,
  merchantName,
  linkTitle,
  linkDescription,
  linkAmount,
}: PaymentLinkClientProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(linkAmount > 0 ? linkAmount.toString() : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAmountFixed = linkAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setError("Please enter a payment amount.");
      return;
    }

    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/payment-links/${slug}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          amount: finalAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to initiate payment. Please try again.");
      }

      // Smooth redirection to gateway checkout screen
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your network connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-8 md:p-10 space-y-6">
        {/* Header Block */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100/50 shadow-inner">
            <Store className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-[17px] font-black text-slate-800 tracking-tight leading-tight">
              {merchantName}
            </h2>
            {linkTitle && (
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                {linkTitle}
              </p>
            )}
          </div>
        </div>

        {/* Description if present */}
        {linkDescription && (
          <p className="text-slate-500 text-xs leading-relaxed border-l-2 border-slate-200 pl-3">
            {linkDescription}
          </p>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 text-rose-600 text-xs font-semibold py-3 px-4 rounded-xl border border-rose-100/50 leading-relaxed shadow-sm">
            {error}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider block">
              First name <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              disabled={loading}
              placeholder="Your first name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider block">
              Last name <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              disabled={loading}
              placeholder="Your last name (optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider block">
              Phone <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="tel"
              disabled={loading}
              placeholder="Your phone number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider block">
              Email <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="email"
              disabled={loading}
              placeholder="Your email address (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider block">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                disabled={isAmountFixed || loading}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm font-black transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
              {isAmountFixed && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                  Fixed
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Proceed</span>
            )}
          </button>
        </form>

        {/* Footer Sub-agreement */}
        <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">
          By continuing you agree to the{" "}
          <a href="#" className="text-blue-500 hover:underline">
            terms of service
          </a>{" "}
          &{" "}
          <a href="#" className="text-blue-500 hover:underline">
            privacy policy
          </a>
        </p>
      </div>
    </div>
  );
}
