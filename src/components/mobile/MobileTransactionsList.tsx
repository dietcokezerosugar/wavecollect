"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Search,
  Download,
  Filter
} from "lucide-react";
import { exportToCSV } from "@/lib/csv";

interface MobileTransactionsListProps {
  transactions: any[];
  onApprove: (intent: any) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
}

export function MobileTransactionsList({
  transactions,
  onApprove,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery
}: MobileTransactionsListProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleExport = () => {
    const dataToExport = transactions.map(t => ({
      Reference: t.referenceId,
      Amount: t.amount,
      Status: t.status,
      Payer: t.payerName || t.transaction?.payerName,
      UTR: t.transaction?.utr,
      Date: new Date(t.createdAt).toLocaleString()
    }));
    exportToCSV(`PayxMint_Activity_${new Date().toISOString().slice(0,10)}.csv`, dataToExport);
  };

  function statusIcon(status: string) {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="w-5 h-5" />;
      case "PENDING": return <Clock className="w-5 h-5" />;
      default: return <ShieldAlert className="w-5 h-5" />;
    }
  }

  return (
    <div className="md:hidden space-y-4 pb-20">
      {/* Mobile Header & Search */}
      <div className="bg-white sticky top-16 z-30 pt-2 pb-4 px-1 shadow-sm border-b border-slate-100">
        <div className="flex gap-2">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search reference..."
               className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
             />
           </div>
           <button 
             onClick={() => setIsFiltersOpen(!isFiltersOpen)}
             className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-colors ${
               isFiltersOpen || statusFilter !== 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500'
             }`}
           >
             <Filter className="w-4 h-4" />
           </button>
        </div>

        {isFiltersOpen && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {['ALL', 'SUCCESS', 'PENDING', 'DETECTED_UNMATCHED', 'FAILED'].map(s => (
               <button
                 key={s}
                 onClick={() => setStatusFilter(s)}
                 className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                   statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
                 }`}
               >
                 {s.replace('_', ' ')}
               </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
         <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
         <button onClick={handleExport} className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
            <Download className="w-3.5 h-3.5" /> Export
         </button>
      </div>

      {/* Transaction Cards */}
      <div className="space-y-3">
         {transactions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
               <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                 <Search className="w-5 h-5" />
               </div>
               <p className="text-[12px] font-bold text-slate-900">No transactions found</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Try adjusting your filters</p>
            </div>
         ) : (
           transactions.map((intent) => (
              <div key={intent.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${
                         intent.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                         intent.status === "DETECTED_UNMATCHED" ? "bg-amber-50 text-amber-600 border-amber-100" :
                         intent.status === "PENDING" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-200"
                       }`}>
                         {statusIcon(intent.status)}
                       </div>
                       <div>
                          <p className="text-[15px] font-black text-slate-900 leading-none">₹{intent.amount.toLocaleString()}</p>
                          <p className="text-[11px] font-bold text-slate-500 mt-1.5 leading-none">{intent.payerName || intent.transaction?.payerName || "Payment"}</p>
                       </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border ${
                       intent.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                       intent.status === "DETECTED_UNMATCHED" ? "bg-amber-50 text-amber-600 border-amber-100" :
                       intent.status === "PENDING" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}>
                      {intent.status.replace('DETECTED_UNMATCHED', 'UNMATCHED')}
                    </span>
                 </div>
                 
                 <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-1 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</p>
                      <p className="text-[11px] font-mono font-bold text-slate-900 mt-0.5">{intent.referenceId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                      <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                        {new Date(intent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                 </div>

                 {intent.status === "PENDING" && (
                   <button 
                     onClick={() => onApprove(intent)}
                     className="w-full mt-1 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md shadow-slate-900/20 active:scale-95 transition-transform"
                   >
                      Review & Settle
                   </button>
                 )}
              </div>
           ))
         )}
      </div>
    </div>
  );
}
