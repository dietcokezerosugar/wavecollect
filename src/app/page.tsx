"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Menu, X, Terminal, Server, Lock, Globe2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { status } = useSession();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">PayxMint</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#infrastructure" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Infrastructure</Link>
            <Link href="/docs" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Developers</Link>
            
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />

            {status === "authenticated" ? (
              <Link href="/dashboard" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-md hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                Command Center
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                  Get API Key
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 left-0 right-0 bg-white border-b border-slate-200 p-6 md:hidden shadow-2xl flex flex-col gap-6"
            >
              <nav className="flex flex-col gap-4">
                {["Features", "Infrastructure", "Developers"].map((item) => (
                  <Link 
                    key={item}
                    href={`#${item.toLowerCase()}`} 
                    className="text-lg font-black text-slate-900 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
              </nav>

              <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                {status === "authenticated" ? (
                  <Link 
                    href="/dashboard" 
                    className="w-full py-4 bg-slate-900 text-white rounded-md text-center font-black shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Command Center <ArrowRight size={18} />
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/register" 
                      className="w-full py-4 bg-blue-600 text-white rounded-md text-center font-black shadow-lg shadow-blue-600/20"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Create Free Account
                    </Link>
                    <Link 
                      href="/login" 
                      className="w-full py-4 bg-slate-100 text-slate-900 rounded-md text-center font-black"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </>
                )}
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                   <Lock className="w-3 h-3" /> Secured by 256-bit AES
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow pt-32 md:pt-40">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
             PayxMint API v2.0 is Live
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700">
            Financial infrastructure <br className="hidden md:block" />
            for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">internet.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 delay-200 duration-700 leading-relaxed px-4">
            Automate high-volume UPI payment collection, verification, and settlement with our enterprise-grade headless API. Built for modern digital businesses.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 delay-300 duration-700 px-4">
            {status === "authenticated" ? (
              <Link href="/dashboard" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-md text-lg font-black flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20">
                Command Center <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-md text-lg font-black flex items-center justify-center gap-3 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/20">
                  Start Building Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/docs" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-md text-lg font-black hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Terminal className="w-5 h-5 text-slate-400" /> Read the Docs
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Technical Features */}
        <section id="features" className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">Enterprise-grade architecture.</h2>
              <p className="text-slate-500 font-bold max-w-2xl mx-auto">Everything you need to scale your revenue operations without the technical overhead.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">Headless Fleet Engines</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Our proprietary Puppeteer-driven node clusters run 24/7 on private IP space to capture merchant app notifications in real-time, completely bypassing traditional gateway lag.
                </p>
              </div>
              
              <div className="p-8 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">Cryptographic Webhooks</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Every settlement event is fired to your servers with an HMAC-SHA256 cryptographically signed payload, ensuring complete protection against spoofing attacks.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Globe2 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">Edge-Optimized APIs</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Create intents and verify payments via our low-latency edge network. Idempotency keys prevent duplicate charges out-of-the-box.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 relative overflow-hidden bg-slate-900">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" />
           <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">Ready to scale?</h2>
              <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-10">Join the businesses processing millions of rupees daily with PayxMint's automated settlement engine.</p>
              <Link href="/register" className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-md text-lg font-black hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10">
                Create Free Account
              </Link>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900">
            <Zap className="w-5 h-5 fill-current text-blue-600" />
            <span className="font-black tracking-tight text-xl">PayxMint</span>
          </div>
          <p className="text-sm font-bold text-slate-400">
            © {new Date().getFullYear()} PayxMint Infrastructure. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900">Terms</Link>
            <Link href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900">Privacy</Link>
            <Link href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900">Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
