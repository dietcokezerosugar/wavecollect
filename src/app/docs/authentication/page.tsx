import React from "react";
import { Shield, Lock, AlertTriangle, CheckCircle } from "lucide-react";

export default function AuthenticationDocs() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Authentication</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          PayxMint uses API Keys to authenticate requests. All API requests must be made over HTTPS.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">API Keys</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your API keys carry significant privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
        </p>
        
        <div className="p-6 bg-slate-900 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest">
            <Lock size={14} /> Required Header
          </div>
          <code className="text-slate-300 font-mono text-sm block">
            Authorization: Bearer wv_live_...
          </code>
        </div>
      </section>

      <section className="space-y-6 pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SecurityCard 
            icon={<Shield className="text-blue-600" />}
            title="Backend Only"
            description="Always make API calls from your server. Never expose your API key in browser-side JavaScript or mobile apps."
          />
          <SecurityCard 
            icon={<AlertTriangle className="text-amber-600" />}
            title="IP Whitelisting"
            description="Enable IP whitelisting in your dashboard to restrict API access to your server's static IP addresses."
          />
        </div>
      </section>

      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[32px] flex gap-6 items-start">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-rose-600 shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-black text-rose-900">Key Compromise?</h4>
          <p className="text-sm text-rose-700 font-medium leading-relaxed">
            If you suspect your API key has been leaked, regenerate it immediately from the Merchant Dashboard. All old keys will be revoked instantly.
          </p>
        </div>
      </div>
    </div>
  );
}

function SecurityCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{icon}</div>
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
    </div>
  );
}
