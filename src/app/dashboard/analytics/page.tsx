"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  Activity,
  RefreshCw,
  BarChart3,
  Layers,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [livePulse, setLivePulse] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/dashboard/analytics");
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        if (json.data.recentIntents) {
           setLivePulse(json.data.recentIntents);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 8000); // Pulse refresh every 8s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="p-20 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-32 font-sans max-w-7xl mx-auto px-4 md:px-0 animate-in fade-in duration-500">
      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600 rounded-md shadow-xl shadow-blue-600/20">
                <BarChart3 className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-700">Intelligence Dashboard</h1>
                <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest leading-none mt-1">Cross-Platform Throughput Telemetry</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Core Analytics: Live
          </div>
        </div>
      </div>

      {/* Primary Analytics Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Processing Volume Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-705 tracking-tight">Processing Volume Chart</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consolidated Intent & Link Volume</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Aggregate</p>
                       <p className="text-2xl font-black text-slate-705">₹{data.summary.totalWeeklyVolume.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueByDay}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                        dy={15}
                      />
                      <YAxis hide />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white text-slate-700 p-4 rounded-md border border-slate-200 shadow-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].payload.fullDate}</p>
                                <p className="text-base font-black">₹{Number(payload[0].value || 0).toLocaleString()}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#2563eb" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#volumeGradient)" 
                        animationDuration={2500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white rounded-lg border border-slate-200 p-8 text-slate-700 space-y-6 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center border border-emerald-100">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight">System Integrity</h4>
                   <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">All transaction intents are cryptographic verified across the distributed GPay node network.</p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                      <p className="text-lg font-black text-slate-700">99.98%</p>
                   </div>
                   <div className="w-px h-8 bg-slate-200" />
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency</p>
                      <p className="text-lg font-black text-slate-700">2.4ms</p>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-lg border border-slate-200 p-8 space-y-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100">
                   <Activity className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight text-slate-705">Platform Health</h4>
                   <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">Current processing capacity remains stable with 12 active listener nodes operational.</p>
                </div>
                <div className="space-y-3 pt-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Load</span>
                      <span className="text-[11px] font-black text-slate-705">14.2%</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[14.2%] rounded-full" />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Real-time Pulse Sidebar */}
        <div className="space-y-6">
           <div className="bg-white border border-slate-200 rounded-lg p-8 text-slate-700 min-h-[600px] flex flex-col shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#3b82f605,transparent)]" />
              
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                       <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Real-time Pulse</h3>
                    </div>
                    <Layers className="w-4 h-4 text-slate-400" />
                 </div>
                 
                 <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {livePulse.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 opacity-20 space-y-4">
                           <RefreshCw className="w-8 h-8 animate-spin" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting Incoming Signal...</p>
                        </div>
                      ) : livePulse.map((p) => (
                        <motion.div 
                          key={p.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-5 bg-slate-50 border border-slate-150 rounded-md backdrop-blur-md hover:bg-slate-100/50 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                   <Zap className="w-3 h-3 text-blue-600" />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                   {p.apiKeyId ? "API Integration" : "Payment Link"}
                                </span>
                             </div>
                             <span className="text-[10px] font-black text-emerald-600">+{p.amount}</span>
                          </div>
                          <div className="flex items-end justify-between">
                             <div>
                                <p className="text-[11px] font-black text-slate-700 tracking-tight">{p.referenceId || "REF_UNK"}</p>
                                <p className="text-[9px] text-slate-450 font-bold uppercase mt-1">{new Date(p.createdAt).toLocaleTimeString()}</p>
                             </div>
                             <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-80" />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>

                 <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Velocity</p>
                          <p className="text-2xl font-black text-slate-700">42 tx<span className="text-blue-500 text-sm ml-1">/min</span></p>
                       </div>
                       <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
