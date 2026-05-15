import React from "react";
import { Code, Terminal, Play, Info } from "lucide-react";

export default function CreateIntentDocs() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Payment Intent</h1>
        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
          The first step in any payment is creating an intent. This reserves a VPA from the pool and generates a unique checkout session.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-black text-[12px] uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100">
          <Play size={14} className="fill-blue-600" /> Endpoint
        </div>
        <div className="bg-slate-900 p-4 rounded-xl font-mono text-sm text-white">
          POST /api/v1/create-intent
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Request Body</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">Field</th>
              <th className="py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">Type</th>
              <th className="py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <TableRow field="amount" type="float" description="Mandatory. Amount in INR (e.g. 500.00)" required />
            <TableRow field="order_id" type="string" description="Mandatory. Your unique reference ID" required />
            <TableRow field="customer_mobile" type="string" description="Recommended for risk scoring" />
            <TableRow field="redirect_url" type="string" description="Where to send the user after payment" />
          </tbody>
        </table>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Success Response</h2>
        <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-slate-300 shadow-2xl">
          <pre>
            {`{
  "status": "success",
  "data": {
    "id": "intent_id",
    "amount": 500,
    "order_id": "your_reference",
    "checkout_url": "https://payxmint.com/pay/tok_abc123",
    "upi_link": "upi://pay?pa=merchant@upi&am=500...",
    "payment_token": "tok_abc123"
  }
}`}
          </pre>
        </div>
      </section>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
        <Info className="text-blue-600 shrink-0" size={24} />
        <p className="text-sm text-blue-700 font-medium leading-relaxed">
          The <code className="bg-white px-1 py-0.5 rounded border border-blue-200">checkout_url</code> is the hosted page you should redirect your customer to. The <code className="bg-white px-1 py-0.5 rounded border border-blue-200">upi_link</code> can be used to trigger UPI apps directly if you are building a mobile app.
        </p>
      </div>
    </div>
  );
}

function TableRow({ field, type, description, required = false }: { field: string; type: string; description: string; required?: boolean }) {
  return (
    <tr>
      <td className="py-4 font-mono text-[13px] text-slate-900">
        {field} {required && <span className="text-rose-500 font-black">*</span>}
      </td>
      <td className="py-4 text-[13px] text-blue-600 font-bold">{type}</td>
      <td className="py-4 text-[13px] text-slate-500 font-medium">{description}</td>
    </tr>
  );
}
