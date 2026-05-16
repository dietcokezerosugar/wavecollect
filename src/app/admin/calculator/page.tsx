"use client";

import React, { useState, useMemo } from "react";
import { Calculator, AlertTriangle, Info, TrendingUp, Cpu, Users, HardDrive } from "lucide-react";

export default function BusinessCalculator() {
  const [targetVolume, setTargetVolume] = useState(5000000); // 50 Lakhs
  const [avgTicketSize, setAvgTicketSize] = useState(1500);
  
  // Costs
  const [costPerSim, setCostPerSim] = useState(299);
  const [costPerVps, setCostPerVps] = useState(1500); // per 10 bots
  const [vpsCapacity, setVpsCapacity] = useState(10);
  const [costPerManpower, setCostPerManpower] = useState(15000); // per month
  const [manpowerCapacity, setManpowerCapacity] = useState(50); // VPAs managed per person

  const [coolingBuffer, setCoolingBuffer] = useState(30); // % buffer for cooling periods
  const [failureBuffer, setFailureBuffer] = useState(20); // % buffer for failures

  // Calculations
  const results = useMemo(() => {
    // Limits: Max 100 txns OR Max ₹1 Lakh per day per VPA
    const txnsToHit1Lakh = Math.ceil(100000 / avgTicketSize);
    
    // Which limit hits first?
    const actualDailyCapacityPerVPA = txnsToHit1Lakh > 100 
      ? 100 * avgTicketSize // Limited by 100 txns
      : 100000;             // Limited by 1 Lakh volume

    // Raw VPAs needed
    const rawVpasNeeded = Math.ceil(targetVolume / actualDailyCapacityPerVPA);

    // Apply buffers
    const totalBufferMultiplier = 1 + (coolingBuffer / 100) + (failureBuffer / 100);
    const finalVpasNeeded = Math.ceil(rawVpasNeeded * totalBufferMultiplier);

    // Cost Calculations (Monthly)
    const totalSimCost = finalVpasNeeded * costPerSim;
    const vpsNeeded = Math.ceil(finalVpasNeeded / vpsCapacity);
    const totalVpsCost = vpsNeeded * costPerVps;
    
    const manpowerNeeded = Math.ceil(finalVpasNeeded / manpowerCapacity);
    const totalManpowerCost = manpowerNeeded * costPerManpower;

    const totalMonthlyCost = totalSimCost + totalVpsCost + totalManpowerCost;
    
    // Unit Economics
    const totalMonthlyVolume = targetVolume * 30;
    const costPerLakh = (totalMonthlyCost / (totalMonthlyVolume / 100000));
    const costPerTransaction = totalMonthlyCost / ((targetVolume / avgTicketSize) * 30);

    return {
      actualDailyCapacityPerVPA,
      limitingFactor: txnsToHit1Lakh > 100 ? "Transaction Count (100 cap)" : "Volume Cap (₹1 Lakh)",
      rawVpasNeeded,
      finalVpasNeeded,
      vpsNeeded,
      manpowerNeeded,
      monthlyCosts: {
        sim: totalSimCost,
        vps: totalVpsCost,
        manpower: totalManpowerCost,
        total: totalMonthlyCost
      },
      unitEconomics: {
        costPerLakh,
        costPerTransaction
      }
    };
  }, [targetVolume, avgTicketSize, costPerSim, costPerVps, vpsCapacity, costPerManpower, manpowerCapacity, coolingBuffer, failureBuffer]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Calculator className="text-blue-600" size={32} />
            Capacity & Cost Planner
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Infrastructure Scaling Model</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Target Parameters</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Daily Volume Target (₹)</label>
              <input 
                type="number" 
                value={targetVolume} 
                onChange={e => setTargetVolume(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Average Ticket Size (₹)</label>
              <input 
                type="number" 
                value={avgTicketSize} 
                onChange={e => setAvgTicketSize(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Risk Engine Cooling Buffer (%)</label>
              <input 
                type="range" min="0" max="100" 
                value={coolingBuffer} 
                onChange={e => setCoolingBuffer(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-right text-xs font-black text-blue-600">{coolingBuffer}%</div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Failure/Ban Buffer (%)</label>
              <input 
                type="range" min="0" max="100" 
                value={failureBuffer} 
                onChange={e => setFailureBuffer(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-right text-xs font-black text-rose-600">{failureBuffer}%</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Operational Costs</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cost/SIM (₹/mo)</label>
                <input type="number" value={costPerSim} onChange={e => setCostPerSim(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cost/VPS (₹/mo)</label>
                <input type="number" value={costPerVps} onChange={e => setCostPerVps(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">VPS Capacity (Bots per VPS)</label>
              <input type="number" value={vpsCapacity} onChange={e => setVpsCapacity(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Staff Salary (₹/mo)</label>
                <input type="number" value={costPerManpower} onChange={e => setCostPerManpower(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">VPAs / Staff</label>
                <input type="number" value={manpowerCapacity} onChange={e => setManpowerCapacity(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Output */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main KPI */}
          <div className="bg-slate-900 rounded-lg p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/30 blur-[100px] -mr-20 -mt-20" />
             <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
               <div>
                 <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <AlertTriangle size={16}/> Active VPAs Required
                 </p>
                 <div className="flex items-baseline gap-2">
                   <h1 className="text-6xl md:text-8xl font-black tracking-tighter">{results.finalVpasNeeded}</h1>
                   <span className="text-xl font-bold text-slate-400">VPAs</span>
                 </div>
               </div>
               
               <div className="bg-white/10 p-6 rounded-md border border-white/10 backdrop-blur-md min-w-[200px]">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cost per ₹1 Lakh Collected</p>
                 <p className="text-3xl font-black text-emerald-400">₹{results.unitEconomics.costPerLakh.toFixed(2)}</p>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logic Breakdown */}
            <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Info className="text-blue-500" size={16}/> Capacity Bottleneck Analysis
               </h3>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
                   <span className="text-xs font-bold text-slate-500">Max Capacity per VPA</span>
                   <span className="text-sm font-black text-slate-900">₹{results.actualDailyCapacityPerVPA.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
                   <span className="text-xs font-bold text-slate-500">Limiting Factor</span>
                   <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-800 rounded font-black uppercase">{results.limitingFactor}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
                   <span className="text-xs font-bold text-slate-500">Raw VPAs Needed</span>
                   <span className="text-sm font-black text-slate-900">{results.rawVpasNeeded}</span>
                 </div>
                 <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase mt-4">
                   Buffer adds {results.finalVpasNeeded - results.rawVpasNeeded} extra VPAs to handle automated Risk Engine rotation, cooling periods, and unexpected bans.
                 </p>
               </div>
            </div>

            {/* Monthly OPEX */}
            <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <TrendingUp className="text-emerald-500" size={16}/> Monthly OPEX Breakdown
               </h3>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md group hover:border-blue-200 border border-transparent transition-all">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><HardDrive size={14}/></div>
                     <span className="text-xs font-bold text-slate-600">Mobile SIMs</span>
                   </div>
                   <span className="text-sm font-black text-slate-900">₹{results.monthlyCosts.sim.toLocaleString()}</span>
                 </div>

                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md group hover:border-purple-200 border border-transparent transition-all">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Cpu size={14}/></div>
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-600">VPS Infrastructure</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase">{results.vpsNeeded} Servers Needed</span>
                     </div>
                   </div>
                   <span className="text-sm font-black text-slate-900">₹{results.monthlyCosts.vps.toLocaleString()}</span>
                 </div>

                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md group hover:border-amber-200 border border-transparent transition-all">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Users size={14}/></div>
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-600">Staff Payroll</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase">{results.manpowerNeeded} Handlers Needed</span>
                     </div>
                   </div>
                   <span className="text-sm font-black text-slate-900">₹{results.monthlyCosts.manpower.toLocaleString()}</span>
                 </div>

                 <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-end">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Total Monthly OPEX</span>
                   <span className="text-xl font-black text-emerald-600">₹{results.monthlyCosts.total.toLocaleString()}</span>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
