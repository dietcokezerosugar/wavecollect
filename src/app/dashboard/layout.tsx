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
  Search
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
    { label: "Activity", icon: History, href: "/dashboard/transactions", shortcut: "T" },
    { label: "Links", icon: LinkIcon, href: "/dashboard/payment-links", shortcut: "P" },
  ];

  const secondaryNavItems = [
    { label: "API Keys", icon: Key, href: "/dashboard/api-keys", shortcut: "K" },
    { label: "API Logs", icon: Terminal, href: "/dashboard/logs", shortcut: "L" },
    { label: "Webhooks", icon: Webhook, href: "/dashboard/webhooks", shortcut: "W" },
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
    const interval = setInterval(checkStatus, 10000);
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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center px-5 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  autoFocus
                  placeholder="Type a command or search..."
                  className="w-full px-4 py-5 text-sm outline-none font-medium text-slate-900"
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
                   <span className="text-[10px] font-black text-slate-400">ESC</span>
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
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-[9px] font-black text-slate-300">G + {item.shortcut}</span>
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
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-indigo-50/50 rounded-xl transition-all group border border-transparent hover:border-indigo-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <item.icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-900">{item.label}</span>
                            </div>
                            <div className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
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
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Command Palette v1.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sleek Minimalist Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-50">
        <div className="h-14 px-6 flex items-center gap-2.5 border-b border-slate-50">
          <Zap className="text-primary w-4 h-4 fill-current" />
          <span className="text-sm font-black tracking-tight text-slate-900">Wave Collect</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Intelligence Section */}
          <div className="space-y-1">
            <Link
              href="/dashboard/analytics"
              className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                pathname === "/dashboard/analytics" 
                  ? "bg-slate-900 text-white" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
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
                     className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                       pathname === item.href 
                         ? "bg-slate-900 text-white" 
                         : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                     }`}
                   >
                     <item.icon className="w-4 h-4" />
                     {item.label}
                   </Link>
                 ))}
               </div>
             </div>

             <div>
               <p className="px-3 text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Platform</p>
               <div className="space-y-0.5">
                 {secondaryNavItems.map((item) => (
                   <Link
                     key={item.label}
                     href={item.href}
                     className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                       pathname === item.href 
                         ? "bg-slate-900 text-white" 
                         : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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

        <div className="p-4 border-t border-slate-50">
           <div className="px-3 py-2 rounded-lg bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">System Health</span>
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
              <span className="text-slate-900">{getPageTitle()}</span>
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
              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                 <Settings className="w-4 h-4" />
              </button>
           </div>
        </header>

        {/* Mobile Header (Untouched) */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-primary w-5 h-5 fill-current" />
            <span className="text-base font-bold tracking-tight">Wave Collect</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-primary font-bold text-xs border border-blue-100">WC</div>
          </div>
        </header>

        {/* Mobile Bottom Navigation (Untouched) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50 px-2 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "fill-current/10" : ""}`} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-muted-foreground"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">More</span>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow pt-14 md:pt-0 pb-20 md:pb-12">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer (Untouched) */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="md:hidden fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[32px] p-6 pb-12 animate-in slide-in-from-bottom duration-400">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">More Options</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{item.label}</span>
                </Link>
              ))}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}


