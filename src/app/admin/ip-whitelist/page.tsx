"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Search, Clock, Network } from "lucide-react";

export default function AdminIpWhitelistPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/admin/ip-whitelist");
      const data = await res.json();
      if (data.status === "success") {
        setRequests(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(id: string, action: "APPROVE" | "REJECT") {
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/ip-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note: `Admin ${action.toLowerCase()}d via dashboard.` }),
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 font-sans max-w-7xl mx-auto px-4 md:px-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">IP Whitelist Requests</h1>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Review and manage merchant network access</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pending & History</h2>
              <p className="text-[11px] text-slate-500 font-medium">All IP access requests</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                <th className="px-6 py-4">Merchant</th>
                <th className="px-6 py-4">Requested IP</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm font-bold">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm font-bold">
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{req.merchant.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{req.merchant.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold text-[12px]">
                        {req.ipAddress}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        req.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" :
                        req.status === "REJECTED" ? "bg-red-50 text-red-600" :
                        "bg-amber-50 text-amber-600"
                      }`}>
                        {req.status === "APPROVED" && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {req.status === "PENDING" && <Clock className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRequest(req.id, "APPROVE")}
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequest(req.id, "REJECT")}
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Processed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
