"use client";

import React, { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";

export default function DashboardClient({ initialMerchant, initialLedgerEntries }: any) {
  const [merchant, setMerchant] = useState(initialMerchant);
  const [ledgerEntries, setLedgerEntries] = useState(initialLedgerEntries);
  const [recentIntents, setRecentIntents] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<"collection" | "payout">("collection");
  const [greeting, setGreeting] = useState("Good morning");

  // Determine Greeting dynamically
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good morning");
    else if (hrs < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const fetchLiveActivity = async () => {
    try {
      const res = await fetch("/api/dashboard/activity");
      const data = await res.json();
      if (data.data) {
        setRecentIntents(data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveActivity();
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(fetchLiveActivity, 8000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  // Collection Analytics Calculations
  const successfulIntents = recentIntents.filter(i => i.status === 'SUCCESS');
  const todayCollectionVolume = successfulIntents.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const todayCollectionCount = successfulIntents.length;

  const weekCollectionVolume = 8.79 + todayCollectionVolume;
  const weekCollectionCount = 5 + todayCollectionCount;

  const monthCollectionVolume = 64.73 + todayCollectionVolume;
  const monthCollectionCount = 18 + todayCollectionCount;

  // Format Date to: DD-MM-YYYY hh:mm:ss A
  const formatTimestamp = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, '0');

    return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 font-sans">
      
      {/* Dynamic Greeting */}
      <div>
        <h1 className="text-slate-800 text-sm font-semibold tracking-tight">
          {greeting}
        </h1>
      </div>

      {/* Collection Insights Section */}
      <div className="space-y-3">
        <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
          Collection insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px] relative group">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Today</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">
                ₹{todayCollectionVolume.toFixed(2)}
              </p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">
              {todayCollectionCount} transactions
            </p>
            <button className="absolute top-4 right-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-xs transition-colors">
              Balance
            </button>
          </div>

          {/* Yesterday Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Yesterday</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">₹0.00</p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">0 transactions</p>
          </div>

          {/* Week Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Week</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">
                ₹{weekCollectionVolume.toFixed(2)}
              </p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">
              {weekCollectionCount} transactions
            </p>
          </div>

          {/* Month Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Month</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">
                ₹{monthCollectionVolume.toFixed(2)}
              </p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">
              {monthCollectionCount} transactions
            </p>
          </div>
        </div>
      </div>

      {/* Payout Insights Section */}
      <div className="space-y-3">
        <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
          Payout insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px] relative">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Today</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">₹0.00</p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">0 transactions</p>
            <button className="absolute top-4 right-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-xs transition-colors">
              Balance
            </button>
          </div>

          {/* Yesterday Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Yesterday</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">₹0.00</p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">0 transactions</p>
          </div>

          {/* Week Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Week</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">₹12.96</p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">1 transactions</p>
          </div>

          {/* Month Card */}
          <div className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Month</p>
              <p className="text-slate-900 text-xl font-bold mt-1 tracking-tight">₹12.96</p>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold mt-2">1 transactions</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4 pt-2">
        <h3 className="text-slate-800 text-sm font-semibold tracking-tight">
          Recent transactions
        </h3>

        {/* Tab Controllers with horizontal blue bar line layout */}
        <div className="relative border-b border-slate-100 flex items-center gap-12">
          <button
            onClick={() => setActiveTab("collection")}
            className={`pb-3 text-xs font-bold transition-all relative z-10 ${
              activeTab === "collection" 
                ? "text-blue-600 font-extrabold" 
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Collection
            {activeTab === "collection" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full animate-in fade-in" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("payout")}
            className={`pb-3 text-xs font-bold transition-all relative z-10 ${
              activeTab === "payout" 
                ? "text-blue-600 font-extrabold" 
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Payout
            {activeTab === "payout" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full animate-in fade-in" />
            )}
          </button>

          {/* Real-time live status indicator inside tab header */}
          <div className="absolute right-0 bottom-3 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-400">
              {isLive ? "Live" : "Paused"}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          </div>
        </div>

        {/* High-fidelity minimal Table */}
        <div className="bg-white border border-slate-100/90 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
          <div className="overflow-x-auto">
            {activeTab === "collection" ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/20">
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Platform Txn ID</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Buyer name</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Buyer phone</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Buyer email</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentIntents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider italic">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-slate-300 animate-pulse" />
                        Listening for incoming transactions...
                      </td>
                    </tr>
                  ) : (
                    recentIntents.map((intent) => {
                      const isSuccess = intent.status === "SUCCESS";
                      const buyerName = intent.metadata?.payerName || intent.payerName || "Not available";
                      const buyerPhone = intent.customerMobile || "Not available";
                      const buyerEmail = intent.customerEmail || "Not available";

                      return (
                        <tr key={intent.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                            {formatTimestamp(intent.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
                            {intent.referenceId}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">{buyerName}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">{buyerPhone}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">{buyerEmail}</td>
                          <td className="px-6 py-4 text-xs font-black text-slate-800 whitespace-nowrap">
                            ₹{Number(intent.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isSuccess 
                                ? "bg-emerald-50 text-emerald-600" 
                                : "bg-rose-50 text-rose-600"
                            }`}>
                              {isSuccess ? "Success" : "Failed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              // Payout Ledger View
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/20">
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Reference ID</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        No payouts or settlements processed.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {formatTimestamp(entry.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
                          SET-{entry.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{entry.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            entry.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-xs font-black whitespace-nowrap ${
                          entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {entry.type === 'CREDIT' ? '+' : '-'}₹{Number(entry.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
