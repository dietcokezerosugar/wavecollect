"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Smartphone,
  Globe,
  Zap,
  ChevronRight,
  Filter,
  Activity,
  Map as MapIcon,
  Wifi
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [livePulse, setLivePulse] = useState<{id: number, amount: number, time: string}[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(prev => [
        { id: Date.now(), amount: Math.floor(Math.random() * 2000) + 100, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4)
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    totalRevenue: 124500,
    revenueGrowth: 12.5,
    successRate: 98.2,
    avgTransaction: 450,
    activeLinks: 24,
    newCustomers: 156
  };

  const revenueByDay = [
    { day: "Mon", amount: 12000, height: "60%" },
    { day: "Tue", amount: 15000, height: "75%" },
    { day: "Wed", amount: 9000, height: "45%" },
    { day: "Thu", amount: 18000, height: "90%" },
    { day: "Fri", amount: 22000, height: "100%" },
    { day: "Sat", amount: 14000, height: "70%" },
    { day: "Sun", amount: 11000, height: "55%" }
  ];

  const hourlyHeatmap = Array.from({ length: 24 }).map((_, i) => ({
    hour: i,
    intensity: Math.random()
  }));

  return (
    <div className="space-y-8 pb-32 font-sans max-w-7xl mx-auto px-2 md:px-0">
      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">Intelligence</h1>
          </div>
          <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-[0.2em] ml-1">Real-time business analytics engine</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Engine Online
          </div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {["24h", "7d", "30d", "YTD"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === range ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Activity Pulse (Crazy Detail 1) */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100/50 transition-colors" />
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-slate-900">Revenue Growth</h3>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected EOM</p>
                    <p className="text-lg font-black text-indigo-600">₹4.2L</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                    <ArrowUpRight className="w-4 h-4" /> 18.4%
                  </div>
                </div>
              </div>

              <div className="h-72 flex items-end justify-between gap-3 md:gap-6 px-2">
                {revenueByDay.map((data, idx) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-4 group/bar">
                    <div className="relative w-full flex flex-col items-center h-full justify-end">
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: data.height }}
                         transition={{ duration: 1.2, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                         className="w-full max-w-[50px] bg-indigo-50 group-hover/bar:bg-indigo-600 rounded-t-2xl md:rounded-t-3xl transition-all cursor-pointer relative"
                       >
                         <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                       </motion.div>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover/bar:text-indigo-600 transition-colors">{data.day}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#4f46e522,transparent)]" />
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-6">
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Live Pulse</h3>
             </div>
             
             <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {livePulse.map((p) => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                         </div>
                         <div>
                            <p className="text-xs font-black">₹{p.amount}</p>
                            <p className="text-[9px] text-slate-500 font-bold">{p.time}</p>
                         </div>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
           </div>

           <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System Status</p>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                   100% Uptime
                 </div>
                 <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </div>
           </div>
        </div>
      </div>

      {/* Hourly Heatmap & Distribution (Crazy Detail 2) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900">Activity Heatmap</h3>
                <p className="text-xs text-slate-400 font-medium">Hourly transaction density (24h)</p>
              </div>
              <Clock className="w-6 h-6 text-slate-300" />
           </div>

           <div className="grid grid-cols-12 gap-2 h-40">
              {hourlyHeatmap.map((h) => (
                <div key={h.hour} className="flex flex-col gap-1">
                   <div 
                     className="flex-1 rounded-lg transition-all hover:scale-110 cursor-help"
                     style={{ 
                        backgroundColor: `rgba(79, 70, 229, ${0.1 + h.intensity * 0.9})`,
                        boxShadow: h.intensity > 0.8 ? '0 0 15px rgba(79, 70, 229, 0.3)' : 'none'
                     }}
                     title={`Hour ${h.hour}: ${Math.floor(h.intensity * 100)}% Load`}
                   />
                </div>
              ))}
           </div>
           <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
           </div>
        </div>

        <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900">Device Mastery</h3>
                <p className="text-xs text-slate-400 font-medium">Native platform distribution</p>
              </div>
              <Smartphone className="w-6 h-6 text-slate-300" />
           </div>

           <div className="flex items-end gap-2 h-48 mb-6">
              {[
                { name: "Android", val: 52, color: "bg-emerald-500" },
                { name: "iOS", val: 32, color: "bg-slate-900" },
                { name: "Windows", val: 10, color: "bg-blue-500" },
                { name: "Mac", val: 6, color: "bg-indigo-400" },
              ].map((plat) => (
                <div key={plat.name} className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full flex flex-col items-center justify-end h-full">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${plat.val}%` }}
                        className={`w-full max-w-[60px] ${plat.color} rounded-2xl group-hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-black/5`}
                      />
                   </div>
                   <div className="text-center">
                     <p className="text-xs font-black text-slate-900 leading-none">{plat.val}%</p>
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{plat.name}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Projection Card (Crazy Detail 3) */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
         <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 80 Q 25 20 50 60 T 100 40" fill="none" stroke="white" strokeWidth="2" />
               <path d="M0 90 Q 30 40 60 70 T 100 50" fill="none" stroke="white" strokeWidth="1" />
            </svg>
         </div>

         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="max-w-md space-y-4">
               <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-white/20">
                  <TrendingUp className="w-4 h-4" /> Smart Projection
               </div>
               <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">Predicted Growth: <span className="text-indigo-200">+34%</span></h2>
               <p className="text-indigo-100/70 text-sm md:text-lg font-medium leading-relaxed">
                  Based on current velocity, your volume is expected to cross <span className="text-white font-bold">₹2.4L</span> by the end of next month.
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
               <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 text-center">
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-2">Daily Peak</p>
                  <p className="text-2xl font-black">₹22K</p>
               </div>
               <div className="bg-indigo-500/30 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 text-center">
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-2">Churn Risk</p>
                  <p className="text-2xl font-black">0.2%</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
