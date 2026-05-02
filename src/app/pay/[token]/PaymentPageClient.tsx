"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Clock, 
  QrCode, 
  AtSign, 
  CreditCard, 
  Copy, 
  Check, 
  Lock,
  Zap,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  token: string;
  amount: number;
  merchantName: string;
  referenceId: string;
  upiDeepLink: string;
  qrData: string;
  status: string;
  expireAt?: string;
}

export default function PaymentPageClient({ 
  token, 
  amount, 
  merchantName, 
  referenceId, 
  upiDeepLink, 
  qrData, 
  status: initialStatus,
  expireAt
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [payerName, setPayerName] = useState<string | null>(null);
  const [utr, setUtr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("qr");
  
  // Calculate initial time left based on expireAt
  const getInitialTimeLeft = () => {
    if (!expireAt) return 600; // default 10 minutes
    const diff = new Date(expireAt).getTime() - new Date().getTime();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());
  const [copied, setCopied] = useState(false);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Timer countdown
  useEffect(() => {
    if (status !== "PENDING" || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Poll for payment status every 3 seconds
  useEffect(() => {
    if (status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay/status?token=${token}`);
        const data = await res.json();

        if (data.data?.payment_status === "SUCCESS") {
          setStatus("SUCCESS");
          setPayerName(data.data.payer_name);
          setUtr(data.data.utr);
          clearInterval(interval);

          // Auto-redirect after 5 seconds
          if (data.data.redirect_url) {
            setTimeout(() => {
              window.location.href = data.data.redirect_url;
            }, 5000);
          }
        } else if (data.data?.payment_status === "EXPIRED" || timeLeft <= 0) {
          setStatus("EXPIRED");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, status, timeLeft]);

  // Handle expired display
  if (status === "EXPIRED" || timeLeft <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl">⚠️</div>
          <h2 className="text-2xl font-bold">Payment Expired</h2>
          <p className="text-slate-500">This payment link has expired. Please request a new one.</p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Masking functions
  const maskedOrderId = referenceId.length > 8 
    ? referenceId.substring(0, 4) + '***' + referenceId.substring(referenceId.length - 4) 
    : referenceId;
    
  // Fake a masked UPI for display (or extract from deep link if possible, but we don't have the merchant upi exactly here)
  const upiMatch = upiDeepLink.match(/pa=([^&]+)/);
  const merchantUpi = upiMatch ? decodeURIComponent(upiMatch[1]) : "merchant@upi";
  const maskedUpi = merchantUpi.length > 11 
    ? merchantUpi.substring(0, 5) + '***' + merchantUpi.substring(merchantUpi.length - 6) 
    : merchantUpi;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 md:p-4 font-sans selection:bg-indigo-100">
      <div className="w-full max-w-4xl bg-white md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[600px] relative">
        
        {/* Mobile Header (Sticky) */}
        <div className="md:hidden sticky top-0 z-30 bg-indigo-700 text-white p-4 flex items-center justify-between shadow-lg shadow-indigo-900/10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
               <Zap className="w-4 h-4 fill-white text-white" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 leading-none mb-1">Paying To</p>
               <h2 className="text-sm font-bold truncate max-w-[140px] leading-none">{merchantName}</h2>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 leading-none mb-1">Time Left</p>
             <div className="flex items-center justify-end gap-1.5 font-mono text-sm font-black">
               <Clock className="w-3 h-3 text-indigo-200" />
               {minutes}:{seconds < 10 ? '0' + seconds : seconds}
             </div>
          </div>
        </div>

        {/* Desktop Left Side: Order Summary */}
        <div className="hidden md:flex w-full md:w-[40%] bg-gradient-to-br from-indigo-700 to-indigo-900 p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="bg-white/95 p-3 rounded-xl inline-block shadow-sm">
              <Zap className="w-6 h-6 text-indigo-700 fill-indigo-700" />
            </div>

            <div>
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1 opacity-80">Total Payable</p>
              <h1 className="text-5xl font-black flex items-baseline">
                <span className="text-2xl font-medium opacity-80 mr-1">₹</span>
                {amount.toLocaleString()}
              </h1>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="opacity-70 font-medium">Order ID</span>
                <span className="font-bold font-mono text-xs flex items-center gap-2">
                  {maskedOrderId} 
                  <Copy className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" onClick={() => handleCopy(referenceId)} />
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70 font-medium">Merchant</span>
                <span className="font-bold">{merchantName}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs font-bold opacity-60">
            <ShieldCheck className="w-4 h-4" /> Secured by Wave Collect
          </div>
        </div>

        {/* Mobile Amount Banner (below sticky header) */}
        <div className="md:hidden bg-indigo-700 text-white px-4 pb-8 pt-2 text-center">
           <h1 className="text-5xl font-black flex items-baseline justify-center">
              <span className="text-2xl font-medium opacity-60 mr-1">₹</span>
              {amount.toLocaleString()}
           </h1>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/80 mt-2">Wave Collect Payment Gateway</p>
        </div>

        {/* Right Side: Payment Methods */}
        <div className="w-full md:w-[60%] p-6 md:p-10 bg-white flex flex-col relative -mt-6 md:mt-0 rounded-t-[32px] md:rounded-none z-10">
          
          <div className="hidden md:flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payment Method</h2>
            <div className="bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl px-4 py-2 text-sm font-black flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {minutes}:{seconds < 10 ? '0' + seconds : seconds}
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-1.5 mb-8 bg-slate-100/80 p-1.5 rounded-2xl md:rounded-3xl border border-slate-200/50">
            {[
              { id: "qr", label: "UPI QR", icon: QrCode },
              { id: "upi", label: "UPI Apps", icon: AtSign },
              { id: "card", label: "Cards", icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 py-3 md:py-3.5 rounded-[14px] md:rounded-2xl text-[10px] md:text-sm font-black transition-all active:scale-[0.97] ${
                  activeTab === tab.id 
                    ? "bg-white text-indigo-700 shadow-md shadow-indigo-900/5 ring-1 ring-black/5" 
                    : "text-slate-400 hover:text-slate-500"
                }`}
              >
                <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === tab.id ? "stroke-[2.5]" : "stroke-[2]"}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center pb-8">
            {activeTab === "qr" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center space-y-8"
              >
                <div className="relative group">
                  <div className="absolute -inset-4 bg-indigo-500/5 rounded-[48px] blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                  <div className="p-5 bg-white border border-slate-200 rounded-[32px] relative shadow-xl shadow-slate-200/50">
                    <img src={qrData} alt="QR Code" className="w-48 h-48 md:w-56 md:h-56 rounded-2xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                       <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4 w-full max-w-sm px-4">
                   <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 flex items-center justify-between group active:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">UPI ID</span>
                        <span className="text-slate-900 font-black tracking-tight font-mono text-xs md:text-sm">{maskedUpi}</span>
                      </div>
                      <button onClick={() => handleCopy(merchantUpi)} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-indigo-600 active:scale-90 transition-transform">
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                   
                   <p className="text-[11px] md:text-sm font-bold text-slate-400">
                     Scan with PhonePe, Google Pay, Paytm or any BHIM UPI app
                   </p>
                </div>
              </motion.div>
            )}

            {activeTab === "upi" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center space-y-8"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto border border-indigo-100 shadow-inner">
                  <AtSign className="w-8 h-8 md:w-10 md:h-10 text-indigo-600 stroke-[2.5]" />
                </div>
                <div className="text-center space-y-3 px-6">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Pay via UPI Apps</h3>
                  <p className="text-sm text-slate-500 max-w-xs leading-relaxed">The payment will open in your default UPI app.</p>
                </div>
                <a 
                  href={upiDeepLink}
                  className="w-full max-w-xs py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] text-base font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] ring-4 ring-indigo-600/0 hover:ring-indigo-600/10"
                >
                  <Zap className="w-5 h-5 fill-white" /> Pay ₹{amount.toLocaleString()} Now
                </a>
              </motion.div>
            )}

            {activeTab === "card" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto border border-slate-100">
                  <Lock className="w-8 h-8 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-900 font-black text-lg">Coming Soon</p>
                  <p className="text-slate-500 text-sm max-w-[200px]">Card payments are being optimized for your region.</p>
                </div>
                <button onClick={() => setActiveTab("qr")} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors">
                  Go Back to UPI
                </button>
              </motion.div>
            )}
          </div>

          {/* Secure Footer */}
          <div className="mt-auto pt-6 flex items-center justify-center gap-4 border-t border-slate-50">
             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                PCI DSS Compliant
             </div>
             <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <Lock className="w-3.5 h-3.5" />
                256-bit SSL
             </div>
          </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {status === "SUCCESS" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-indigo-950/80 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-sm bg-white rounded-[48px] p-8 md:p-10 text-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto border-4 border-white text-4xl shadow-xl shadow-emerald-500/20 mb-8 mt-4">
                  <Check className="w-12 h-12 stroke-[4]" />
                </div>
                
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Payment Confirmed</p>
                <h2 className="text-5xl font-black text-slate-900 mb-8">₹{amount.toLocaleString()}</h2>
                
                <div className="bg-slate-50 rounded-3xl p-6 text-left space-y-4 border border-slate-100 mb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Payer</span>
                    <span className="font-bold text-slate-900 text-sm truncate">{payerName || "Verification Success"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">UTR / Ref No</span>
                    <span className="font-black text-emerald-600 text-sm font-mono break-all">{utr || "Verified by Engine"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Status</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                   <p className="text-slate-400 text-xs font-bold">Auto-redirecting...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
