import React from "react";
import { Zap, Code, Shield, Smartphone, Terminal, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CustomCheckoutDocs() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Custom SDK (Headless)</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          For merchants who want absolute control over the UI, we provide a lightweight JavaScript SDK to handle the heavy lifting of polling, intent management, and event handling.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 font-black text-[12px] uppercase tracking-widest bg-indigo-50 w-fit px-3 py-1 rounded-full border border-indigo-100">
          <Zap size={14} className="fill-indigo-600" /> Version 1.0.0
        </div>
        <div className="bg-slate-900 p-4 rounded-xl font-mono text-sm text-white">
          &lt;script src="https://payxmint.com/wave-sdk.js"&gt;&lt;/script&gt;
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Implementation Example</h2>
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-white/5 overflow-hidden">
             <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">HTML / JS</div>
             </div>
             <pre className="text-blue-400 font-mono text-[12px] leading-relaxed overflow-x-auto">
                <code>{`// 1. Initialize with the payment token from Create Intent API
PayxMint.init("tok_abc123");
PayxMint.setBaseUrl("https://payxmint.com"); // Point to production API

// 2. Fetch details to build your UI
const details = await PayxMint.getDetails();
console.log("Paying to:", details.merchant_name);
console.log("Amount:", details.amount);

// 3. Set up event handlers
PayxMint.onSuccess((data) => {
  alert("Payment Verified! UTR: " + data.utr);
  window.location.href = data.redirect_url;
});

PayxMint.onExpire(() => {
  alert("Session Expired");
});

// 4. Start automatic polling
PayxMint.mount();`}</code>
             </pre>
          </div>
        </div>
      </section>

      <section className="space-y-8 pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">SDK Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MethodCard 
            name=".init(token)"
            desc="Connects the SDK to a specific payment intent token."
          />
          <MethodCard 
            name=".getDetails()"
            desc="Returns amount, upi_link, merchant name, and brand color."
          />
          <MethodCard 
            name=".mount()"
            desc="Starts real-time status polling (2s interval)."
          />
          <MethodCard 
            name=".unmount()"
            desc="Stops polling manually."
          />
        </div>
      </section>

      <div className="p-8 bg-slate-900 rounded-[40px] text-white flex flex-col md:flex-row gap-8 items-center">
         <div className="md:w-2/3 space-y-4">
            <h3 className="text-xl font-black">Why use the SDK?</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Managing intervals, handling race conditions during polling, and formatting deep links correctly can be tricky. The SDK abstracts this so you can focus purely on your CSS and Layout.
            </p>
         </div>
         <div className="md:w-1/3 flex justify-end">
            <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
               View React Native Hook <ArrowRight size={16} />
            </button>
         </div>
      </div>
    </div>
  );
}

function MethodCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
      <code className="text-blue-600 font-black text-sm">{name}</code>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
