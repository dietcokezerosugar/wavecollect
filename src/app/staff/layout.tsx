"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Key, 
  Settings,
  ShieldCheck,
  LogOut,
  Zap,
  Menu,
  X,
  ChevronRight,
  Monitor,
  FileSpreadsheet
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/staff" },
    { label: "Merchant Reviews", icon: ShieldCheck, href: "/staff/accounts" },
    { label: "Pool Management", icon: Users, href: "/staff/pool" },
    { label: "Reconciliation", icon: FileSpreadsheet, href: "/staff/reconciliation" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-[60] transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Zap className="text-emerald-600 w-5 h-5 fill-current" />
            <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">Operations</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                pathname === item.href 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Exit Portal
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 md:hidden text-slate-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Ops Control</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900">{navItems.find(i => i.href === pathname)?.label || "Dashboard"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Systems Nominal</span>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}
