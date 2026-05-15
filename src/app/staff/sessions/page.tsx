"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Terminal, 
  Maximize2, 
  Minimize2, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Server
} from "lucide-react";
import { format } from "date-fns";

interface BotSession {
  name: string;
  email: string;
  status: string;
  lastHeartbeat: string;
  reviewStatus: string;
}

export default function StaffSessionsPage() {
  const [sessions, setSessions] = useState<BotSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedBot) {
      const eventSource = new EventSource(`/api/staff/logs/stream?botName=${selectedBot}`);
      setLogs([]); // Reset logs for new bot
      
      eventSource.onmessage = (event) => {
        setLogs(prev => [...prev.slice(-200), event.data]);
      };

      return () => eventSource.close();
    }
  }, [selectedBot]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/staff/accounts");
      const json = await res.json();
      if (json.status === "success") {
        // Only show approved/active sessions
        setSessions(json.data.filter((a: any) => a.reviewStatus === 'APPROVED'));
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  };

  const getLogColor = (log: string) => {
    if (log.includes('[ENGINE-A]') || log.includes('XHR')) return 'text-indigo-400';
    if (log.includes('[ENGINE-B]') || log.includes('CSV')) return 'text-amber-400';
    if (log.includes('[SUCCESS]') || log.includes('Verified')) return 'text-emerald-400';
    if (log.includes('[ERROR]') || log.includes('Crash')) return 'text-rose-400';
    if (log.includes('[SYSTEM]') || log.includes('Sync')) return 'text-cyan-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
             <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Live Engine Command</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time Fleet Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Server className="w-3 h-3 text-emerald-400" /> {sessions.length} Engines Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fleet List */}
        <div className="lg:col-span-4 space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Fleet</h3>
           <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
             {sessions.map((session) => (
               <button
                 key={session.name}
                 onClick={() => setSelectedBot(session.name)}
                 className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                   selectedBot === session.name 
                   ? 'bg-slate-900 border-slate-900 shadow-xl translate-x-1' 
                   : 'bg-white border-slate-100 hover:border-slate-200'
                 }`}
               >
                 <div className="flex items-center justify-between mb-2">
                    <div className={`text-[10px] font-black uppercase tracking-widest ${selectedBot === session.name ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {session.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${session.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                       <span className={`text-[9px] font-bold ${selectedBot === session.name ? 'text-slate-300' : 'text-slate-500'}`}>
                         {session.status}
                       </span>
                    </div>
                 </div>
                 <div className={`text-xs font-black truncate mb-3 ${selectedBot === session.name ? 'text-white' : 'text-slate-900'}`}>
                   {session.email}
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                       <Clock className={`w-3 h-3 ${selectedBot === session.name ? 'text-slate-500' : 'text-slate-300'}`} />
                       <span className="text-[9px] font-bold text-slate-500">
                         {session.lastHeartbeat ? format(new Date(session.lastHeartbeat), 'HH:mm:ss') : 'Never'}
                       </span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                       <ShieldCheck className={`w-3 h-3 ${selectedBot === session.name ? 'text-emerald-400' : 'text-emerald-500/50'}`} />
                       <span className={`text-[9px] font-bold ${selectedBot === session.name ? 'text-emerald-400' : 'text-emerald-600'}`}>VERIFIED</span>
                    </div>
                 </div>
               </button>
             ))}
           </div>
        </div>

        {/* Live Terminal */}
        <div className={`lg:col-span-8 transition-all duration-500 ${isMaximized ? 'fixed inset-4 z-50 bg-slate-950 rounded-3xl' : ''}`}>
           <div className={`h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden ${!isMaximized ? 'min-h-[600px]' : ''}`}>
              {/* Terminal Header */}
              <div className="bg-slate-900/50 px-6 py-4 border-bottom border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 text-indigo-400 rounded-lg flex items-center justify-center">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                      {selectedBot ? `Stream: ${selectedBot}` : 'Select an Engine'}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Execution Logs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="flex-grow p-6 font-mono text-[11px] overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent">
                {selectedBot ? (
                  <div className="space-y-1">
                    <div className="text-emerald-500 mb-4 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      [SYSTEM] Connected to remote stream for {selectedBot}...
                    </div>
                    {logs.map((log, i) => (
                      <div key={i} className={`flex gap-3 leading-relaxed border-b border-slate-900/50 py-0.5 ${getLogColor(log)}`}>
                        <span className="opacity-30 select-none shrink-0 w-8">{i + 1}</span>
                        <span className="break-all">{log}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                    <Search className="w-12 h-12" />
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">No Stream Active</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest">Select an engine from the fleet list to view logs</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Footer */}
              <div className="bg-slate-900/30 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">XHR-A</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">CSV-B</span>
                  </div>
                </div>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  {logs.length} Lines Buffered
                </div>
              </div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
