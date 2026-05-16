"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Search,
  RefreshCcw,
  ToggleRight,
  ToggleLeft,
  AlertTriangle,
  Activity,
  User,
  Save,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function GlobalFleetMonitor() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTickets, setEditingTickets] = useState<Record<string, { min: string; max: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    fetchGateways();
    const interval = setInterval(fetchGateways, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchGateways = async () => {
    try {
      const res = await fetch("/api/admin/gateways");
      const data = await res.json();
      setGateways(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await fetch("/api/admin/gateways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "TOGGLE_STATUS", status: newStatus }),
    });
    fetchGateways();
  };

  const setCooldown = async (id: string) => {
    if (!confirm("Are you sure you want to put this account in a 4-hour cooldown?")) return;
    await fetch("/api/admin/gateways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "SET_COOLDOWN" }),
    });
    fetchGateways();
  };

  const updateRiskTier = async (id: string, newTier: string) => {
    await fetch("/api/admin/gateways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "UPDATE_RISK_TIER", riskTier: newTier }),
    });
    fetchGateways();
  };

  const saveTicketSize = async (id: string) => {
    const edits = editingTickets[id];
    if (!edits) return;
    setSavingId(id);
    try {
      await fetch("/api/admin/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "UPDATE_TICKETS",
          minTicket: edits.min,
          maxTicket: edits.max,
        }),
      });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
      setEditingTickets((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchGateways();
    } finally {
      setSavingId(null);
    }
  };

  const handleTicketEdit = (id: string, field: "min" | "max", value: string, original: { min: number; max: number }) => {
    setEditingTickets((prev) => ({
      ...prev,
      [id]: {
        min: field === "min" ? value : (prev[id]?.min ?? String(original.min)),
        max: field === "max" ? value : (prev[id]?.max ?? String(original.max)),
      },
    }));
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Global Fleet Monitor</h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mt-1">Cross-merchant gateway oversight</p>
        </div>
        <button onClick={fetchGateways} className="p-3 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm w-fit">
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Fleet Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FleetStat label="Total Accounts" value={gateways.length} icon={<Smartphone size={16} />} color="blue" />
        <FleetStat label="Active Engines" value={gateways.filter((g) => g.status === "ACTIVE").length} icon={<Activity size={16} />} color="emerald" />
        <FleetStat label="Limit Warnings" value={gateways.filter((g) => g.currentDaily > g.dailyLimit * 0.8 && g.dailyLimit > 0).length} icon={<AlertTriangle size={16} />} color="amber" />
        <FleetStat label="Offline/Suspended" value={gateways.filter((g) => g.status !== "ACTIVE").length} icon={<AlertTriangle size={16} />} color="rose" />
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway / Merchant</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Limits & Health</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Pool</th>
              <th className="p-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gateways.map((g) => {
              const isEditing = editingTickets[g.id] !== undefined;
              const isSaving = savingId === g.id;
              const justSaved = savedId === g.id;
              
              return (
                <tr key={g.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black border ${g.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                        <Smartphone size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 leading-tight">{g.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                          <User size={10} className="text-blue-500" /> {g.merchant?.name || "Unknown Merchant"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 px-6">
                    <div className="w-full max-w-[200px] space-y-3">
                      <div>
                        <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1">
                          <span className="text-slate-500">Volume: ₹{g.currentDaily.toLocaleString()}</span>
                          <span className="text-slate-400">/ ₹{g.dailyLimit === 0 ? "∞" : g.dailyLimit.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-1000 ${g.currentDaily >= g.dailyLimit && g.dailyLimit > 0 ? "bg-rose-500" : "bg-blue-600"}`}
                            style={{ width: `${g.dailyLimit === 0 ? 0 : Math.min((g.currentDaily / g.dailyLimit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] font-black uppercase gap-2">
                        <span className={`px-2 py-0.5 rounded border ${g.healthScore < 70 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                          Health: {g.healthScore}/100
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${g.successfulTxn >= 100 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          Txns: {g.successfulTxn}/100
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 px-6">
                    <div className="flex flex-col gap-2">
                      <select 
                        value={g.riskTier} 
                        onChange={(e) => updateRiskTier(g.id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all
                          ${g.riskTier === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                            g.riskTier === 'MID' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-emerald-50 text-emerald-700 border-emerald-200'}
                        `}
                      >
                        <option value="HIGH">High Risk Pool</option>
                        <option value="MID">Mid Risk Pool</option>
                        <option value="LOW">Low/VIP Pool</option>
                      </select>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold text-slate-400">Tickets:</span>
                        <span className="text-[10px] font-black text-slate-700">₹{g.minTicket} - ₹{g.maxTicket}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setCooldown(g.id)}
                        title="Set 4-hour Cooldown"
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      >
                        <Clock size={18} />
                      </button>
                      <button
                        onClick={() => toggleStatus(g.id, g.status)}
                        className={`p-1.5 rounded-lg transition-all ${g.status === "ACTIVE" ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                      >
                        {g.status === "ACTIVE" ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-16 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse text-[11px]">Scanning Fleet...</div>}
      </div>
    </div>
  );
}

function FleetStat({ label, value, icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
  };

  return (
    <div className="bg-white p-5 rounded-md border border-slate-200 flex items-center gap-3 shadow-sm">
      <div className={`p-2.5 rounded-md border ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
