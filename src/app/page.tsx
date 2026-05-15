"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { status } = useSession();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">PayxMint</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Pricing</Link>
            
            {status === "authenticated" ? (
              <Link href="/dashboard" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[60] bg-white flex flex-col p-8 md:hidden"
            >
              <div className="flex items-center justify-between mb-20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="text-white w-5 h-5 fill-current" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">PayxMint</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <nav className="flex flex-col gap-8">
                {["Features", "Pricing", "API Docs", "Changelog"].map((item) => (
                  <Link 
                    key={item}
                    href={`#${item.toLowerCase()}`} 
                    className="text-4xl font-black text-slate-900 tracking-tighter hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto space-y-4">
                {status === "authenticated" ? (
                  <Link 
                    href="/dashboard" 
                    className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-center font-black text-lg shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Go to Dashboard <ArrowRight size={20} />
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/register" 
                      className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-center font-black text-lg shadow-xl shadow-blue-600/20 block"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Create Free Account
                    </Link>
                    <Link 
                      href="/login" 
                      className="w-full py-5 bg-slate-50 text-slate-900 rounded-[24px] text-center font-black text-lg block"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </>
                )}
                <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">Secured by 256-bit AES encryption</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center mb-24">
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Payment verification, <br />
            <span className="text-primary">reimagined.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 delay-200 duration-1000 px-4">
            Automate UPI payment collection and verification with deep links and browser-level capture. Production-grade reliability for modern businesses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 delay-300 duration-1000 px-4">
            {status === "authenticated" ? (
              <Link href="/dashboard" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-slate-200">
                Open Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-3 hover:bg-blue-700 hover:scale-105 transition-all shadow-2xl shadow-blue-200">
                  Get Started for Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl text-lg font-black hover:bg-slate-50 transition-all">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-6 py-24 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Instant Setup</h3>
              <p className="text-muted-foreground leading-relaxed">
                Port your existing UPI merchant accounts and start collecting payments in minutes. No complex KYC.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Secure Verification</h3>
              <p className="text-muted-foreground leading-relaxed">
                Uses GPay9 browser automation to verify transactions directly from the source. 100% accuracy.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Real-time Webhooks</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get notified instantly when a payment is verified. Integrated matching logic ensures idempotency.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="container mx-auto px-6 flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Zap className="text-primary w-5 h-5 fill-current" />
            <span className="font-bold tracking-tight">PayxMint</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 PayxMint. All rights reserved. Built for high-performance fintech.
          </p>
        </div>
      </footer>
    </div>
  );
}
