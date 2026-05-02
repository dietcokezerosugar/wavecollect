"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 glass border-b border-gray-200">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Wave Collect</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/dashboard" className="px-4 py-2 bg-primary text-white rounded-full hover:bg-blue-600 transition-all">
              Dashboard
            </Link>
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
                  <span className="text-xl font-bold tracking-tight">Wave Collect</span>
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
                <Link 
                  href="/dashboard" 
                  className="w-full py-5 bg-primary text-white rounded-[24px] text-center font-black text-lg shadow-xl shadow-blue-600/20"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Open Dashboard
                </Link>
                <p className="text-center text-sm text-slate-400 font-medium">Secured by 256-bit AES encryption</p>
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
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full text-lg font-semibold flex items-center justify-center gap-2 hover:gap-3 transition-all shadow-lg shadow-blue-200">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-secondary text-foreground rounded-full text-lg font-semibold hover:bg-gray-200 transition-all">
              View Features
            </Link>
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
            <span className="font-bold tracking-tight">Wave Collect</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Wave Collect. All rights reserved. Built for high-performance fintech.
          </p>
        </div>
      </footer>
    </div>
  );
}
