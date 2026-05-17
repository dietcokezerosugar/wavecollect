"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Link as LinkIcon, 
  Send, 
  Coins, 
  AlertCircle, 
  RefreshCw, 
  CreditCard, 
  Layers, 
  FileText, 
  Code, 
  Sliders, 
  User, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Search
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Unified Menu Items exactly matching the user's minimal screenshot
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", shortcut: "D" },
    { label: "Create staff", icon: UserPlus, href: "/staff/pool", shortcut: "C" },
    { label: "All staffs", icon: Users, href: "/staff/accounts", shortcut: "S" },
    { label: "Payment link", icon: LinkIcon, href: "/dashboard/payment-links", shortcut: "P" },
    { label: "Telegram collect", icon: Send, href: "/dashboard/quick-setup", shortcut: "T" },
    { label: "Collections", icon: Coins, href: "/dashboard/transactions", shortcut: "O" },
    { label: "Disputes", icon: AlertCircle, href: "/dashboard/settings", shortcut: "I" },
    { label: "Settlements", icon: RefreshCw, href: "/dashboard/recharge", shortcut: "E" },
    { label: "Payouts", icon: CreditCard, href: "/dashboard/merchant-accounts", shortcut: "A" },
    { label: "Bulk payout", icon: Layers, href: "/dashboard/merchant-accounts", shortcut: "B" },
    { label: "Reports", icon: FileText, href: "/dashboard/analytics", shortcut: "R" },
    { label: "Developer", icon: Code, href: "/dashboard/api-keys", shortcut: "V" },
    { label: "Management", icon: Sliders, href: "/dashboard/settings", shortcut: "M" },
    { label: "Profile", icon: User, href: "/dashboard/settings", shortcut: "F" },
  ];

  const [systemStatus, setSystemStatus] = useState<"online" | "idle" | "error">("idle");

  // Handle Command Palette & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Node Health Check
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/bots/control?action=status", { method: "POST" });
        const data = await res.json();
        const bots = data.bots || {};
        const statuses = Object.values(bots);
        
        if (statuses.includes("online")) setSystemStatus("online");
        else if (statuses.includes("errored")) setSystemStatus("error");
        else setSystemStatus("idle");
      } catch (e) {
        setSystemStatus("idle");
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredItems = navItems.filter(item => 
    item.label.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const getPageTitle = () => {
    return navItems.find(i => i.href === pathname)?.label || "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-[#FCFCFC] text-slate-800 font-sans antialiased">
      {/* Command Palette */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center px-5 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  autoFocus
                  placeholder="Search dashboard navigation..."
                  className="w-full px-4 py-5 text-sm outline-none font-medium text-slate-900 placeholder:text-slate-400 bg-transparent"
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                />
                <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">ESC</span>
              </div>
              
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {filteredItems.length > 0 ? (
                  <div className="p-1 space-y-1">
                    {filteredItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          router.push(item.href);
                          setIsCommandPaletteOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-3 hover:bg-slate-50 rounded-xl transition-all group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-800" />
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    No results match "{commandQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/30 z-[60] backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Side Navigation panel - Desktop & Mobile */}
      <aside className={`flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100/80 z-[70] transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* BloomxPe Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-sm">
              B
            </div>
            <span className="text-sm font-black text-slate-900 tracking-tight">BloomxPe</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Navigation list */}
        <nav className="flex-grow py-4 px-3 overflow-y-auto space-y-0.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 ${
                  isActive 
                    ? "bg-slate-50 text-slate-900 font-bold" 
                    : "text-slate-500 hover:text-slate-950 hover:bg-slate-50/50"
                }`}
              >
                <item.icon className={`w-4 h-4 stroke-[1.8] ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Sign Out Button directly inside sidebar menu list */}
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-tight text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all duration-200 text-left"
          >
            <LogOut className="w-4 h-4 stroke-[1.8] text-slate-400 group-hover:text-rose-500" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* Top Header Bar for Desktop only */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-slate-100 sticky top-0 z-40">
           <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400">Main</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-200" />
              <span className="text-slate-900 font-bold">{getPageTitle()}</span>
           </div>
           
           <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                systemStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${systemStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                 <span>{systemStatus === 'online' ? 'Engine Online' : 'System Idle'}</span>
              </div>
           </div>
        </header>

        {/* Top Header Bar for Mobile only */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-black">
              B
            </div>
            <span className="text-sm font-black text-slate-900 tracking-tight">BloomxPe</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-150">
            <Menu className="w-4 h-4" />
          </button>
        </header>

        {/* Content Wrapper */}
        <main className="flex-grow pt-16 md:pt-0 pb-16 overflow-x-hidden">
          <div className="max-w-[1240px] mx-auto w-full p-4 md:p-8">
            {children}
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
