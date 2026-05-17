"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Key, 
  Link as LinkIcon, 
  History, 
  Terminal, 
  Webhook, 
  Settings,
  Zap,
  ChevronRight,
  Menu,
  X,
  MoreHorizontal,
  BarChart3,
  Plus,
  Search,
  Book,
  ShieldCheck,
  Wallet,
  LogOut
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

  const mainNavItems = [
    { label: "Home", icon: LayoutDashboard, href: "/dashboard", shortcut: "H" },
    { label: "Accounts", icon: Key, href: "/dashboard/merchant-accounts", shortcut: "C" },
    { label: "Collection", icon: History, href: "/dashboard/transactions", shortcut: "T" },
    { label: "Wallet", icon: Wallet, href: "/dashboard/recharge", shortcut: "W" },
    { label: "Links", icon: LinkIcon, href: "/dashboard/payment-links", shortcut: "P" },
  ];

  const secondaryNavItems = [
    { label: "Quick Setup", icon: Zap, href: "/dashboard/quick-setup", shortcut: "Q" },
    { label: "IP Whitelist", icon: ShieldCheck, href: "/dashboard/ip-whitelist", shortcut: "I" },
    { label: "API Keys", icon: Key, href: "/dashboard/api-keys", shortcut: "K" },
    { label: "API Logs", icon: Terminal, href: "/dashboard/logs", shortcut: "L" },
    { label: "Docs", icon: Book, href: "/docs", shortcut: "D" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings", shortcut: "S" },
  ];

  const actions = [
    { label: "Create Payment Link", icon: Plus, href: "/dashboard/payment-links?action=new", shortcut: "N" },
    { label: "Add Merchant Account", icon: Key, href: "/dashboard/merchant-accounts?action=new", shortcut: "M" },
  ];

  const allItems = [
    ...mainNavItems,
    ...secondaryNavItems,
    ...actions,
    { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", shortcut: "A" }
  ];

  const [systemStatus, setSystemStatus] = useState<"online" | "idle" | "error">("idle");

  // Handle Command Palette & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }

      // Quick Nav: G + [Key]
      if (e.key.toLowerCase() === 'g' && !isCommandPaletteOpen && !(e.target instanceof HTMLInputElement)) {
        const nextKeyHandler = (nextE: KeyboardEvent) => {
          const item = allItems.find(i => i.shortcut?.toLowerCase() === nextE.key.toLowerCase());
          if (item) {
            router.push(item.href);
            window.removeEventListener('keydown', nextKeyHandler);
          }
        };
        window.addEventListener('keydown', nextKeyHandler, { once: true });
        setTimeout(() => window.removeEventListener('keydown', nextKeyHandler), 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, isCommandPaletteOpen]);

  // Real-time System Health Polling
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
    const interval = setInterval(checkStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredItems = allItems.filter(item => 
    item.label.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const getPageTitle = () => {
    return allItems.find(i => i.href === pathname)?.label || "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      {/* Command Palette Modal */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-300/40 backdrop-blur-sm"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="relative w-full max-w-xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center px-5 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  autoFocus
                  placeholder="Type a command or search..."
                  className="w-full px-4 py-5 text-sm outline-none font-medium text-slate-700 placeholder:text-slate-400 bg-transparent"
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded-md">
                   <span className="text-[10px] font-black text-slate-500">ESC</span>
                </div>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredItems.length > 0 ? (
                  <div className="space-y-4">
                    {/* Navigation Section */}
                    <div>
                      <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Navigation</p>
                      {filteredItems.filter(i => !actions.some(a => a.label === i.label)).map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            router.push(item.href);
                            setIsCommandPaletteOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors border border-slate-100">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[13px] font-bold text-slate-750">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-[10px] font-black text-slate-350 tracking-widest">G + {item.shortcut}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Actions Section */}
                    {filteredItems.filter(i => actions.some(a => a.label === i.label)).length > 0 && (
                      <div>
                        <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</p>
                        {filteredItems.filter(i => actions.some(a => a.label === i.label)).map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              router.push(item.href);
                              setIsCommandPaletteOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50/50 rounded-lg transition-all group border border-transparent hover:border-blue-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                <item.icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[13px] font-bold text-slate-700">{item.label}</span>
                            </div>
                            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                               Action
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-slate-400 font-medium">No commands found for "{commandQuery}"</p>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 bg-white border border-slate-200 rounded flex items-center justify-center text-[9px] font-black text-slate-400 shadow-sm">↑</div>
                       <div className="w-4 h-4 bg-white border border-slate-200 rounded flex items-center justify-center text-[9px] font-black text-slate-400 shadow-sm">↓</div>
                       <span className="text-[10px] font-bold text-slate-400">Navigate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="px-1.5 h-4 bg-white border border-slate-200 rounded flex items-center justify-center text-[9px] font-black text-slate-400 shadow-sm">ENTER</div>
                       <span className="text-[10px] font-bold text-slate-400">Select</span>
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-slate-350 uppercase tracking-tighter">Command Palette v1.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-300/40 z-[60] backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sleek Minimalist Sidebar - Desktop & Mobile */}
      <aside className={`flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-[70] transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-14 px-6 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <Zap className="text-blue-600 w-4 h-4 fill-current" />
            <span className="text-sm font-black tracking-tight text-slate-700">PayxMint</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-grow p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Intelligence Section */}
          <div className="space-y-1">
            <Link
              href="/dashboard/analytics"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                pathname === "/dashboard/analytics" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Intelligence Dashboard
            </Link>
          </div>

          {/* Main Sections */}
          <div className="space-y-4">
             <div>
               <p className="px-3 text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Operations</p>
               <div className="space-y-0.5">
                 {mainNavItems.map((item) => (
                   <Link
                     key={item.label}
                     href={item.href}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                       pathname === item.href 
                         ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                         : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                     }`}
                   >
                     <item.icon className="w-4 h-4" />
                     {item.label}
                   </Link>
                 ))}
               </div>
             </div>

             <div>
               <p className="px-3 text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Dev</p>
               <div className="space-y-0.5">
                 {secondaryNavItems.map((item) => (
                   <Link
                     key={item.label}
                     href={item.href}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                       pathname === item.href 
                         ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                         : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                     }`}
                   >
                     <item.icon className="w-4 h-4" />
                     {item.label}
                   </Link>
                 ))}
               </div>
             </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-50 space-y-2">
           <button 
             onClick={() => signOut({ callbackUrl: "/login" })}
             className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
           >
             <LogOut className="w-4 h-4" />
             Sign Out
           </button>
           <div className="px-3 py-2.5 rounded-md bg-slate-50 flex items-center justify-between border border-slate-100 shadow-inner">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                systemStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 
                systemStatus === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
              }`} />
           </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Minimalist Desktop Header */}
        <header className="hidden md:flex items-center justify-between h-14 px-8 bg-white border-b border-slate-100 sticky top-0 z-40">
           <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="text-slate-400">Main</span>
              <ChevronRight className="w-3 h-3 text-slate-200" />
              <span className="text-slate-700">{getPageTitle()}</span>
           </div>
           
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                systemStatus === 'online' ? 'bg-emerald-50/50 border-emerald-100/50' : 
                systemStatus === 'error' ? 'bg-rose-50/50 border-rose-100/50' : 'bg-slate-50 border-slate-100'
              }`}>
                 <div className={`w-1 h-1 rounded-full ${
                   systemStatus === 'online' ? 'bg-emerald-500' : 
                   systemStatus === 'error' ? 'bg-rose-500' : 'bg-slate-400'
                 }`} />
                 <span className={`text-[9px] font-black uppercase ${
                   systemStatus === 'online' ? 'text-emerald-600' : 
                   systemStatus === 'error' ? 'text-rose-600' : 'text-slate-500'
                 }`}>
                   {systemStatus === 'online' ? 'Secure Node: Active' : 
                    systemStatus === 'error' ? 'Action Required' : 'Engine Idle'}
                 </span>
              </div>
              <button className="text-slate-400 hover:text-slate-700 transition-colors">
                 <Settings className="w-4 h-4" />
              </button>
           </div>
        </header>

        {/* Premium Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-40 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center shadow-md">
              <Zap className="text-white w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-black tracking-tight text-slate-700 leading-none">PayxMint</span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${systemStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[9px] font-bold text-slate-500 uppercase">{systemStatus === 'online' ? 'Active' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50 text-slate-600 rounded-full border border-slate-200 active:scale-95 transition-transform">
                <Menu className="w-4 h-4" />
              </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow pt-16 pb-20 md:pt-0 md:pb-12 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto w-full p-4 md:p-8">
            {children}
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
