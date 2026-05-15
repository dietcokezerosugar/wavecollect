"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, Code, Globe, Shield, Zap, Terminal, FileText, ChevronRight } from "lucide-react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">W</div>
            <span className="font-black text-slate-900 tracking-tight">PayxMint <span className="text-blue-600">Docs</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all uppercase tracking-widest">Dashboard</Link>
            <Link href="/api-reference" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all uppercase tracking-widest">Reference</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-200 transition-all">
            <SearchIcon />
            Search docs...
          </button>
          <Link href="/login" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
            Log In
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex max-w-[1440px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 p-6 hidden lg:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar bg-white/50 backdrop-blur-sm">
          <div className="space-y-8">
            <DocsNavSection title="Getting Started">
              <DocsNavLink href="/docs" icon={<Globe size={16} />} label="Introduction" active={pathname === "/docs"} />
              <DocsNavLink href="/docs/quick-start" icon={<Zap size={16} />} label="Quick Start" active={pathname === "/docs/quick-start"} />
              <DocsNavLink href="/docs/authentication" icon={<Shield size={16} />} label="Authentication" active={pathname === "/docs/authentication"} />
            </DocsNavSection>

            <DocsNavSection title="Integration">
              <DocsNavLink href="/docs/create-intent" icon={<Code size={16} />} label="Create Intent" active={pathname === "/docs/create-intent"} />
              <DocsNavLink href="/docs/checkout-page" icon={<Terminal size={16} />} label="Checkout Flow" active={pathname === "/docs/checkout-page"} />
              <DocsNavLink href="/docs/custom-checkout" icon={<Zap size={16} />} label="Custom SDK (Headless)" active={pathname === "/docs/custom-checkout"} />
              <DocsNavLink href="/docs/webhooks" icon={<FileText size={16} />} label="Webhooks" active={pathname === "/docs/webhooks"} />
            </DocsNavSection>

            <DocsNavSection title="Resources">
              <DocsNavLink href="/docs/error-codes" icon={<ChevronRight size={16} />} label="Error Codes" active={pathname === "/docs/error-codes"} />
              <DocsNavLink href="/docs/best-practices" icon={<ChevronRight size={16} />} label="Best Practices" active={pathname === "/docs/best-practices"} />
            </DocsNavSection>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 lg:p-16 max-w-4xl min-w-0">
          {children}
        </main>

        {/* Right TOC Sidebar (Optional/Hidden on mobile) */}
        <aside className="w-64 p-8 hidden xl:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">On this page</h4>
          <ul className="space-y-3">
            <li><a href="#overview" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Overview</a></li>
            <li><a href="#workflow" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">How it works</a></li>
            <li><a href="#security" className="text-[12px] font-bold text-slate-500 hover:text-blue-600 transition-all">Security</a></li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function DocsNavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">{title}</h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function DocsNavLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-bold transition-all
        ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
      `}
    >
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      {label}
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  );
}

