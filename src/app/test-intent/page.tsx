"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  buildUpiDeeplink,
  generatePhonePeIntent,
  generatePaytmIntent,
  generateGPayIntent,
} from "@/lib/intentHelpers";

export default function TestIntentPage() {
  const [upiId, setUpiId] = useState("merchant@upi");
  const [amount, setAmount] = useState("1.00");
  const [qrData, setQrData] = useState<string | null>(null);

  const [isAndroid, setIsAndroid] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setIsAndroid(/Android/.test(ua));
  }, []);

  const [orderId, setOrderId] = useState("TEST_INTENT");

  useEffect(() => {
    setOrderId("TEST_" + Math.floor(Math.random() * 1000000));
  }, []);
  const merchantName = "WaveCollect Test";

  const parsedAmount = parseFloat(amount) || 0;

  const rawUpi = buildUpiDeeplink({
    pa: upiId,
    pn: merchantName,
    am: parsedAmount,
    tn: orderId,
  });

  const phonepeIntent = generatePhonePeIntent({
    merchant_upi: upiId,
    amount: parsedAmount,
    order_id: orderId,
    isAndroid,
  });

  const paytmIntent = generatePaytmIntent({
    merchant_upi: upiId,
    merchant_business_name: merchantName,
    amount: parsedAmount,
    order_id: orderId,
    isAndroid,
  });

  const gpayIntent = generateGPayIntent({
    merchant_upi: upiId,
    merchant_business_name: merchantName,
    amount: parsedAmount,
    order_id: orderId,
    isAndroid,
  });

  useEffect(() => {
    QRCode.toDataURL(rawUpi, { width: 300, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrData)
      .catch(console.error);
  }, [rawUpi]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Intent Testing Lab</h1>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>Test the new proprietary intent system.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>Merchant UPI ID</label>
            <input 
              type="text" 
              value={upiId} 
              onChange={(e) => setUpiId(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>Amount (₹)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>Force OS Type (For testing on desktop)</label>
            <select 
              value={isAndroid ? "android" : isIOS ? "ios" : "desktop"}
              onChange={(e) => {
                if (e.target.value === "android") { setIsAndroid(true); setIsIOS(false); }
                else if (e.target.value === "ios") { setIsAndroid(false); setIsIOS(true); }
                else { setIsAndroid(false); setIsIOS(false); }
              }}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="android">Simulate Android</option>
              <option value="ios">Simulate iOS</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "32px", padding: "20px", backgroundColor: "#f1f5f9", borderRadius: "12px" }}>
          <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "16px" }}>Raw UPI QR Code</p>
          {qrData ? <img src={qrData} style={{ borderRadius: "8px", width: "200px" }} alt="QR" /> : <div style={{ height: "200px" }}/>}
        </div>

        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>Direct App Intents</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <a href={phonepeIntent} style={{ display: "block", textAlign: "center", backgroundColor: "#5f259f", color: "#fff", padding: "16px", borderRadius: "12px", textDecoration: "none", fontWeight: "bold" }}>
              Open in PhonePe
            </a>
            <a href={paytmIntent} style={{ display: "block", textAlign: "center", backgroundColor: "#00BAF2", color: "#fff", padding: "16px", borderRadius: "12px", textDecoration: "none", fontWeight: "bold" }}>
              Open in Paytm
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
