"use client";

import { useState, useEffect } from "react";
import { Key, Copy, ShieldAlert, Plus, Check } from "lucide-react";

interface ApiKeyData {
  id: string;
  key: string;
  merchantId: string;
  monthlyLimit: number;
  usedAmount: number;
  isBlocked: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.data || []);
  }

  async function generateKey() {
    setLoading(true);
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthly_limit: 100000 }),
    });
    await fetchKeys();
    setLoading(false);
  }

  async function toggleBlock(id: string, currentBlocked: boolean) {
    await fetch("/api/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isBlocked: !currentBlocked }),
    });
    await fetchKeys();
  }

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground text-sm md:text-base">Authenticate your payment requests.</p>
        </div>
        <button
          onClick={generateKey}
          disabled={loading}
          className="w-full md:w-auto px-6 py-4 md:py-3 bg-primary text-white rounded-2xl md:rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" /> {loading ? "Generating..." : "New API Key"}
        </button>
      </div>

      <div className="grid gap-3 md:gap-4 px-2 md:px-0">
        {keys.map((key) => (
          <div key={key.id} className="bg-white rounded-[32px] md:rounded-2xl border border-slate-200 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                <Key className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black font-mono tracking-tight text-slate-900 truncate max-w-[140px] md:max-w-none">{key.key}</p>
                  <button onClick={() => copyKey(key.key, key.id)} className="p-1 text-primary active:scale-90 transition-transform">
                    {copiedId === key.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      key.isBlocked ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {key.isBlocked ? "Blocked" : "Active"}
                  </span>
                  <span className="text-[10px] md:text-xs text-slate-400 font-medium">
                    {new Date(key.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6 text-left md:text-right border-t md:border-0 pt-5 md:pt-0 border-slate-50">
              <div className="flex-grow">
                <div className="flex items-center justify-between md:justify-end gap-4 mb-2">
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Monthly Limit Usage</p>
                  <p className="text-[10px] md:text-xs font-black text-slate-900">
                    ₹{key.usedAmount.toLocaleString()} / ₹{key.monthlyLimit.toLocaleString()}
                  </p>
                </div>
                <div className="w-full md:w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${Math.min((key.usedAmount / key.monthlyLimit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3">
                <button
                  onClick={() => toggleBlock(key.id, key.isBlocked)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-4 py-3 md:py-2 rounded-xl text-xs font-black transition-all border shadow-sm ${
                    key.isBlocked
                      ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                      : "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{key.isBlocked ? "Unblock Key" : "Revoke Key"}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
