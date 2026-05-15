"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  CreditCard, 
  BarChart3,
  LogOut,
  Settings,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  RefreshCcw,
  Webhook,
  Terminal,
  Menu,
  X,
  Zap
} from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/merchants", icon: Users, label: "Merchants & IPs" },
  { href: "/admin/ip-whitelist", icon: ShieldCheck, label: "IP Whitelist" },
  { href: "/admin/gateways", icon: Smartphone, label: "Global Fleet" },
  { href: "/admin/customers", icon: ShieldAlert, label: "Risk Entities" },
  { href: "/admin/staff", icon: ShieldCheck, label: "Staff Hub" },
  { href: "/admin/transactions", icon: CreditCard, label: "Transactions" },
  { href: "/admin/settlements", icon: Wallet, label: "Settlement Custody" },
  { href: "/admin/reconciliation", icon: RefreshCcw, label: "Reconciliation" },
  { href: "/admin/webhooks", icon: Webhook, label: "Webhooks Queue" },
  { href: "/admin/logs", icon: Terminal, label: "System Logs" },
  { href: "/admin/referrals", icon: Users, label: "Referral Hub" },
  { href: "/admin/analytics", icon: BarChart3, label: "System Health" },
  { href: "/admin/calculator", icon: Calculator, label: "Cost Planner" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-900 font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slide-in */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-[70] transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600 w-5 h-5 fill-current/10" />
            <h1 className="text-sm font-black tracking-tight text-slate-900">
              PayxMint Admin
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-1 text-slate-400 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold rounded-lg transition-all ${
                pathname === item.href 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-rose-50 transition-all text-[11px] font-bold text-rose-500 hover:text-rose-600 active:scale-95"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#FDFDFD] md:ml-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-slate-200 px-8 items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Platform Administration</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">All Systems Normal</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black border border-blue-100 text-xs shadow-sm">
              AD
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-40 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
              <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-black tracking-tight text-slate-900 leading-none">Admin Panel</span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Systems Normal</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 bg-slate-50 text-slate-600 rounded-full border border-slate-200 active:scale-95 transition-transform"
          >
            <Menu className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
