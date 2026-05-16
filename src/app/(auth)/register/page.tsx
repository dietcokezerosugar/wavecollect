"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Loader2, ShieldCheck, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 md:p-6 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[30px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 border border-emerald-100">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome to the Fleet</h1>
            <p className="text-slate-500 font-medium">Your merchant profile has been provisioned. Redirecting to login...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 md:p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 bg-slate-900 rounded-[22px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-900/20"
          >
            <Zap className="text-white w-7 h-7 fill-current" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Join PayxMint</h1>
          <p className="text-slate-500 font-medium">Start automating your payment verification today</p>
        </div>

        <div className="bg-white rounded-[24px] md:rounded-lg border border-slate-100 p-6 md:p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-md text-rose-600 text-xs font-bold flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">!</div>
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name / Business</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={16} />
                  </div>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-md outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold text-slate-900"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={16} />
                  </div>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-md outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold text-slate-900"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={16} />
                  </div>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-md outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="px-1">
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                By signing up, you agree to our <Link href="#" className="text-blue-600">Terms of Service</Link> and <Link href="#" className="text-blue-600">Privacy Policy</Link>.
              </p>
            </div>

            <button 
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-md font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-slate-900/10"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Merchant Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 md:mt-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 opacity-40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">7-Day Free Trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Instant Provisioning</span>
          </div>
        </div>

        <p className="mt-12 text-center text-xs font-bold text-slate-400">
          Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-700">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
