"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCcw, 
  UserX, 
  Fingerprint,
  TrendingUp,
  Activity
} from "lucide-react";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      setCustomers(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateRisk = async (id: string, tier: string) => {
    await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "UPDATE_RISK", riskTier: tier })
    });
    fetchData();
  };

  const filtered = customers.filter(c => 
    c.fingerprint.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" size={32} /> Risk Entities
          </h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Customer Fingerprinting & Blacklisting</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 transition-all shadow-sm">
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Search by fingerprint or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-md pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fingerprint / Node</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Tier</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Metrics</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-white group-hover:text-blue-600 transition-all">
                       <Fingerprint size={20} />
                    </div>
                    <div>
                      <p className="text-[13px] font-mono font-bold text-slate-900 leading-tight truncate max-w-[200px]">{c.fingerprint}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{c.phone || "No Phone"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                   <select 
                     value={c.riskTier} 
                     onChange={(e) => updateRisk(c.id, e.target.value)}
                     className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all
                       ${c.riskTier === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                         c.riskTier === 'MID' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                         'bg-emerald-50 text-emerald-700 border-emerald-200'}
                     `}
                   >
                     <option value="HIGH">High Risk / Blacklisted</option>
                     <option value="MID">Mid Risk / Monitored</option>
                     <option value="LOW">Low Risk / Whitelisted</option>
                   </select>
                </td>
                <td className="p-6 text-right">
                  <div className="space-y-1">
                    <p className="text-[13px] font-black text-slate-900">₹{c.totalVolume.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{c.successfulTxnCount} Successes</p>
                  </div>
                </td>
                <td className="p-6 text-right">
                   <button className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all">
                      <UserX size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center animate-pulse text-[11px] font-black text-slate-400 uppercase tracking-widest">Scanning Risk Nodes...</div>}
      </div>
    </div>
  );
}
