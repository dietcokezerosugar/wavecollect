import React from "react";
import Link from "next/link";
import { Smartphone, Monitor, QrCode, MousePointer2, CheckCircle2, Code, ArrowRight } from "lucide-react";

export default function CheckoutPageDocs() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Checkout Experience</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          We provide a zero-friction, hosted checkout page optimized for both mobile and desktop conversions.
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Hosted vs. Custom</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-blue-600">
              <Monitor size={24} />
              <h3 className="text-lg font-black text-slate-900">Hosted Page</h3>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Redirect your users to our hosted URL. We handle the timer, QR code generation, UPI app deep-links, and success polling. This is the fastest way to integrate.
            </p>
            <ul className="space-y-2">
              <ListItem text="Native App Deep-links" />
              <ListItem text="Dynamic QR Codes" />
              <ListItem text="Real-time status updates" />
            </ul>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-indigo-600">
              <Code size={24} />
              <h3 className="text-lg font-black text-slate-900">Custom Checkout</h3>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Use the raw <code>upi_link</code> from the Intent API to build your own payment interface inside your Android/iOS app or website. This bypasses our hosted page entirely.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile Deep Link (Example)</p>
               <code className="text-[11px] font-mono text-slate-600 block break-all">
                  upi://pay?pa=payx@axisbank&pn=Acme&am=500.00&tr=ORDER123...
               </code>
            </div>
            <ul className="space-y-2 mb-6">
              <ListItem text="Full UI/UX Control" />
              <ListItem text="In-app browser not required" />
              <ListItem text="Direct UPI app triggering" />
            </ul>
            <Link href="/docs/custom-checkout" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
               Use Custom SDK <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-8 pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">The Mobile Flow</h2>
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2 space-y-4">
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              When a user clicks a UPI app button (e.g. PhonePe) on their phone, we trigger a native intent. This opens the app with the amount and reference pre-filled. Once they pay, our backend matches the transaction and our checkout page automatically redirects them back to your site.
            </p>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[12px] font-bold">
              Tip: The redirect happens in under 2 seconds after the customer completes the payment in their UPI app.
            </div>
          </div>
          <div className="md:w-1/2 bg-slate-50 rounded-3xl p-8 border border-slate-200 flex justify-center">
            <Smartphone className="text-slate-300" size={120} strokeWidth={1} />
          </div>
        </div>
      </section>

      <section className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 space-y-6">
        <div className="flex items-center gap-3 text-blue-900">
          <QrCode size={24} className="text-blue-600" />
          <h2 className="text-xl font-black uppercase tracking-tight">White-label Branding</h2>
        </div>
        <p className="text-sm text-blue-900/70 font-medium leading-relaxed">
          Maintain your brand integrity by customizing the checkout experience. Via your <strong>Settings</strong> dashboard, you can:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Custom Colors</p>
              <p className="text-[11px] font-bold text-slate-600">Match the checkout theme to your primary brand hex code.</p>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Brand Logo</p>
              <p className="text-[11px] font-bold text-slate-600">Replace the PayxMint logo with your own business logo.</p>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Business Name</p>
              <p className="text-[11px] font-bold text-slate-600">Control the display name shown to customers in UPI apps.</p>
           </div>
        </div>
      </section>
    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-[12px] font-bold text-slate-600 uppercase tracking-tight">
      <CheckCircle2 size={14} className="text-blue-600" />
      {text}
    </li>
  );
}


