"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Clock, BarChart3, RefreshCw } from "lucide-react";

type ResultStatus = "ALREADY_EXISTS" | "MATCHED" | "UNMATCHED" | "SKIPPED" | "ERROR";

interface ReconciliationResult {
  row: number;
  externalId: string;
  amount: number;
  status: ResultStatus;
  detail: string;
}

interface ReconciliationSummary {
  totalRows: number;
  matched: number;
  alreadyExists: number;
  unmatched: number;
  skipped: number;
  errors: number;
}

const STATUS_CONFIG: Record<ResultStatus, { label: string; color: string; bg: string; icon: any }> = {
  MATCHED: { label: "Matched", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  ALREADY_EXISTS: { label: "Already Exists", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock },
  UNMATCHED: { label: "Unmatched", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
  SKIPPED: { label: "Skipped", color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: XCircle },
  ERROR: { label: "Error", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
};

export default function ReconciliationPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResultStatus | "ALL">("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setError(null);
    setSummary(null);
    setResults([]);
    setFilter("ALL");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/staff/reconciliation", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server error: Expected JSON but got ${contentType || "unknown format"}. Status: ${res.status}`);
      }

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setSummary(data.summary);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const filteredResults = filter === "ALL" ? results : results.filter((r) => r.status === filter);

  const reset = () => {
    setFileName(null);
    setSummary(null);
    setResults([]);
    setError(null);
    setFilter("ALL");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manual Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload transaction CSV reports for backup verification and auto-matching
          </p>
        </div>
        {summary && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Upload
          </button>
        )}
      </div>

      {/* Drop Zone */}
      {!summary && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragging
              ? "border-blue-400 bg-blue-50 scale-[1.01]"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <div>
                <p className="text-sm font-bold text-slate-900">Processing {fileName}</p>
                <p className="text-xs text-slate-500 mt-1">Parsing CSV and running reconciliation...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? "bg-blue-100" : "bg-slate-100"
                }`}
              >
                {isDragging ? (
                  <FileSpreadsheet className="w-7 h-7 text-blue-600" />
                ) : (
                  <Upload className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {isDragging ? "Drop CSV file here" : "Drag & drop your CSV file here"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  or click to browse • Supports Google Pay, PhonePe, Paytm CSV exports
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Rows", value: summary.totalRows, color: "bg-slate-50 border-slate-200", text: "text-slate-900" },
            { label: "Matched", value: summary.matched, color: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
            { label: "Already Exists", value: summary.alreadyExists, color: "bg-blue-50 border-blue-200", text: "text-blue-700" },
            { label: "Unmatched", value: summary.unmatched, color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
            { label: "Skipped/Errors", value: summary.skipped + summary.errors, color: "bg-red-50 border-red-200", text: "text-red-700" },
          ].map((card) => (
            <div
              key={card.label}
              className={`p-4 rounded-xl border ${card.color}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className={`text-2xl font-black mt-1 ${card.text}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results Table */}
      {summary && results.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Filter Tabs */}
          <div className="px-4 pt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Filter:</span>
            {(["ALL", "MATCHED", "UNMATCHED", "ALREADY_EXISTS", "SKIPPED", "ERROR"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                  filter === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {f === "ALL" ? `All (${results.length})` : `${f.replace("_", " ")} (${results.filter((r) => r.status === f).length})`}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Row</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, idx) => {
                  const cfg = STATUS_CONFIG[r.status];
                  const IconComp = cfg.icon;
                  return (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{r.row}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[200px] truncate">{r.externalId}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">₹{r.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${cfg.bg} ${cfg.color}`}>
                          <IconComp className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[250px] truncate">{r.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredResults.length === 0 && (
            <div className="p-12 text-center">
              <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">No results matching this filter</p>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      {!summary && !isUploading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            How It Works
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", title: "Download CSV", desc: "Export the transaction report from Google Pay Business / PhonePe Merchant / Paytm Dashboard" },
              { step: "2", title: "Drop the file here", desc: "Drag and drop the CSV file onto this page. The system will automatically parse all rows." },
              { step: "3", title: "Auto Reconciliation", desc: "Each transaction is compared against pending payment intents. Matches are automatically confirmed and webhooks are fired." },
              { step: "4", title: "Review Results", desc: "See which transactions were matched, which already existed, and which remain unmatched for manual review." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-slate-500">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
