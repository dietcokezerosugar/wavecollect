"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  History, 
  Wallet, 
  Settings,
  PlusCircle
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Activity", icon: History, href: "/dashboard/transactions" },
    { label: "Pay", icon: PlusCircle, href: "/dashboard/payment-links", isPrimary: true },
    { label: "Wallet", icon: Wallet, href: "/dashboard/recharge" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 px-2 pt-2 pb-1 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          if (item.isPrimary) {
            return (
              <Link 
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6 group"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 border-4 border-white transition-transform active:scale-95">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-indigo-950 mt-1">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link 
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-12 transition-all active:scale-95"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-xl mb-0.5 transition-colors ${
                isActive ? "bg-blue-50 text-blue-650" : "text-slate-400"
              }`}>
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              </div>
              <span className={`text-[9px] font-bold ${
                isActive ? "text-indigo-950" : "text-slate-400"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
