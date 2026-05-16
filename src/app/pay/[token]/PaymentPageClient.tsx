"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface Props {
  token: string;
  amount: number;
  merchantName: string;
  referenceId: string;
  upiDeepLink: string;
  qrData?: string | null;
  status: string;
  expireAt?: string;
}

export default function PaymentPageClient({
  token,
  amount,
  merchantName,
  referenceId,
  upiDeepLink,
  qrData: serverQr,
  status: initialStatus,
  expireAt,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [qrData, setQrData] = useState<string | null>(serverQr || null);
  const [payerName, setPayerName] = useState<string | null>(null);
  const [utr, setUtr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("qr");
  const [copied, setCopied] = useState(false);

  const getInitialTimeLeft = () => {
    if (!expireAt) return 600;
    const diff = new Date(expireAt).getTime() - Date.now();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [mounted, setMounted] = useState(false);

  // Mark as mounted (client-side only) and generate QR
  useEffect(() => {
    setMounted(true);
    if (!qrData && upiDeepLink) {
      QRCode.toDataURL(upiDeepLink, { width: 300, margin: 2 })
        .then(setQrData)
        .catch(err => console.error("QR Generation Error:", err));
    }
    console.log("[PayxMint] Payment page mounted. Status:", initialStatus, "Token:", token);
  }, []);

  // Timer countdown — simple setInterval, no deps that reset it
  useEffect(() => {
    if (!mounted) return;
    if (status !== "PENDING") return;
    console.log("[PayxMint] Timer started. TimeLeft:", timeLeft);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log("[PayxMint] Timer cleanup");
      clearInterval(timer);
    };
  }, [mounted, status]);

  // Poll for payment status every 1 second
  useEffect(() => {
    if (!mounted) return;
    if (status !== "PENDING") return;
    console.log("[PayxMint] Polling started for token:", token);

    const poll = async () => {
      try {
        const res = await fetch(`/api/pay/status?token=${token}`);
        const data = await res.json();
        console.log("[PayxMint] Poll response:", data.data?.payment_status);
        
        if (data.data?.payment_status === "SUCCESS") {
          setStatus("SUCCESS");
          setPayerName(data.data.payer_name);
          setUtr(data.data.utr);
          if (data.data.redirect_url) {
            setTimeout(() => { window.location.href = data.data.redirect_url; }, 5000);
          }
        } else if (data.data?.payment_status === "EXPIRED") {
          setStatus("EXPIRED");
        }
      } catch (err) {
        console.error("[PayxMint] Poll error:", err);
      }
    };

    // First poll immediately
    poll();

    // Then every 500ms for instant detection
    const interval = setInterval(poll, 500);

    return () => {
      console.log("[PayxMint] Polling cleanup");
      clearInterval(interval);
    };
  }, [mounted, token, status]);

  // Derived values
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerStr = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

  const maskedOrderId = referenceId.length > 8
    ? referenceId.substring(0, 4) + "***" + referenceId.substring(referenceId.length - 4)
    : referenceId;

  const upiMatch = upiDeepLink.match(/pa=([^&]+)/);
  const merchantUpi = upiMatch ? decodeURIComponent(upiMatch[1]) : "merchant@upi";
  const maskedUpi = merchantUpi.length > 11
    ? merchantUpi.substring(0, 5) + "***" + merchantUpi.substring(merchantUpi.length - 6)
    : merchantUpi;

  // ═══════════════════════════════════════════════════════════════
  // BloomxHub Intent Generation — exact PHP→JS port
  // ═══════════════════════════════════════════════════════════════
  const paytmIntent = `paytmmp://cash_wallet?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${referenceId}&tr=${referenceId}&mc=4722&&sign=AAuN7izDWN5cb8A5scnUiNME+LkZqI2DWgkXlN1McoP6WZABa/KkFTiLvuPRP6/nWK8BPg/rPhb+u4QMrUEX10UsANTDbJaALcSM9b8Wk218X+55T/zOzb7xoiB+BcX8yYuYayELImXJHIgL/c7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr&featuretype=money_transfer`;

  const phonepeData = {
    contact: { cbsName: "", nickName: "", vpa: merchantUpi, type: "VPA" },
    p2pPaymentCheckoutParams: {
      note: referenceId, isByDefaultKnownContact: true, enableSpeechToText: false,
      allowAmountEdit: false, showQrCodeOption: false, disableViewHistory: true,
      shouldShowUnsavedContactBanner: false, isRecurring: false, checkoutType: "DEFAULT",
      transactionContext: "p2p", initialAmount: Math.floor(amount * 100),
      disableNotesEdit: true, showKeyboard: false, currency: "INR", shouldShowMaskedNumber: true,
    },
  };
  const phonepeBase64 = globalThis.btoa(JSON.stringify(phonepeData));
  const phonepeIntent = `phonepe://native?data=${phonepeBase64}&id=p2ppayment`;

  const gpayIntent = `tez://upi/pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&tid=${encodeURIComponent(referenceId)}&tr=${encodeURIComponent(referenceId)}&tn=${encodeURIComponent("Pay " + referenceId)}&cu=INR`;

  const progressPct = (timeLeft / (expireAt ? Math.max(getInitialTimeLeft(), 1) : 600)) * 100;

  // ─── EXPIRED ───
  if (status === "EXPIRED" || timeLeft <= 0) {
    return (
      <div style={styles.expiredWrap}>
        <div style={styles.expiredCard}>
          <div style={styles.expiredIcon}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Payment Expired</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>This payment link has expired. Please request a new one.</p>
        </div>
      </div>
    );
  }

  // ─── SUCCESS ───
  if (status === "SUCCESS") {
    return (
      <div style={styles.successOverlay}>
        <div style={styles.successCard}>
          <div style={styles.successTopBar} />
          <div style={styles.successCheckCircle}>✓</div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#10b981", textTransform: "uppercase" as const, letterSpacing: 3, margin: "0 0 6px" }}>Payment Confirmed</p>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", margin: "0 0 20px" }}>₹{amount.toLocaleString()}</h2>
          <div style={styles.successDetails}>
            <div><span style={styles.detailLabel}>Payer</span><span style={styles.detailValue}>{payerName || "Verified"}</span></div>
            <div><span style={styles.detailLabel}>UTR / Ref</span><span style={{ ...styles.detailValue, color: "#10b981", fontFamily: "monospace", fontSize: 12 }}>{utr || "Verified"}</span></div>
            <div><span style={styles.detailLabel}>Status</span><span style={{ ...styles.detailValue, color: "#10b981" }}>✅ Approved</span></div>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 16 }}>Auto-redirecting...</p>
        </div>
      </div>
    );
  }

  // ─── MAIN PAYMENT PAGE ───
  return (
    <div style={styles.pageWrap}>
      {/* Mobile Header */}
      <div style={styles.mobileHeader}>
        <div style={styles.mobileHeaderInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.logoBox}>⚡</div>
            <div>
              <p style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: 2, color: "#a5b4fc", margin: 0, lineHeight: 1 }}>Paying To</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{merchantName}</p>
            </div>
          </div>
          <div style={{ ...styles.timerChip, background: timeLeft < 60 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)", color: timeLeft < 60 ? "#fca5a5" : "#fff" }}>
            ⏱ {timerStr}
          </div>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Amount */}
      <div style={styles.amountSection}>
        <h1 style={styles.amountText}>
          <span style={{ fontSize: 18, opacity: 0.6, marginRight: 2 }}>₹</span>
          {amount.toLocaleString()}
        </h1>
        <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: 3, color: "rgba(165,180,252,0.6)", margin: "8px 0 0" }}>Secure UPI Payment</p>
      </div>

      {/* Content Card */}
      <div style={styles.contentCard}>
        {/* Tab Bar */}
        <div style={styles.tabBar}>
          {[
            { id: "qr", label: "QR Code", icon: "⊞" },
            { id: "upi", label: "UPI App", icon: "@" },
            { id: "card", label: "Cards", icon: "⊟" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                background: activeTab === tab.id ? "#fff" : "transparent",
                color: activeTab === tab.id ? "#4338ca" : "#94a3b8",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span style={{ fontSize: 11 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── QR TAB ─── */}
        {activeTab === "qr" && (
          <div style={styles.tabContent}>
            {/* QR Code */}
            <div style={styles.qrWrapper}>
              <div style={styles.qrBorder}>
                {qrData ? (
                  <img src={qrData} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 12, display: "block" }} />
                ) : (
                  <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 12 }}>
                    <div style={styles.loadingSpinner}></div>
                  </div>
                )}
              </div>
            </div>

            {/* UPI ID Row */}
            <div style={styles.upiRow}>
              <div>
                <p style={styles.upiLabel}>UPI ID</p>
                <p style={styles.upiValue}>{maskedUpi}</p>
              </div>
              <button onClick={() => handleCopy(merchantUpi)} style={styles.copyBtn}>
                {copied ? "✓" : "📋"}
              </button>
            </div>

            {/* App Buttons */}
            <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: 2, color: "#94a3b8", textAlign: "center" as const, margin: "12px 0 6px" }}>
              Or pay directly via
            </p>
            <div style={styles.appGrid}>
              <a href={gpayIntent} style={{ ...styles.appBtn, background: "#fff", color: "#334155", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 20 }}>💳</span>
                <span style={{ fontSize: 9, fontWeight: 700 }}>Google Pay</span>
              </a>
              <a href={phonepeIntent} style={{ ...styles.appBtn, background: "#5f259f", color: "#fff" }}>
                <span style={{ fontSize: 20 }}>📲</span>
                <span style={{ fontSize: 9, fontWeight: 700 }}>PhonePe</span>
              </a>
              <a href={paytmIntent} style={{ ...styles.appBtn, background: "#00BAF2", color: "#fff" }}>
                <span style={{ fontSize: 20 }}>💰</span>
                <span style={{ fontSize: 9, fontWeight: 700 }}>Paytm</span>
              </a>
            </div>

            {/* Fallback */}
            <a href={upiDeepLink} style={styles.fallbackBtn}>
              @ Other UPI App
            </a>

            <p style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" as const, marginTop: 8 }}>
              Scan with PhonePe, Google Pay, Paytm or any UPI app
            </p>
          </div>
        )}

        {/* ─── UPI APPS TAB ─── */}
        {activeTab === "upi" && (
          <div style={styles.tabContent}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", textAlign: "center" as const, margin: "0 0 4px" }}>
              Pay ₹{amount.toLocaleString()} via UPI
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", textAlign: "center" as const, margin: "0 0 16px" }}>Choose your preferred UPI app</p>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {[
                { name: "Google Pay", intent: gpayIntent, bg: "#fff", fg: "#334155", border: "#e2e8f0", emoji: "💳" },
                { name: "PhonePe", intent: phonepeIntent, bg: "#5f259f", fg: "#fff", border: "#5f259f", emoji: "📲" },
                { name: "Paytm", intent: paytmIntent, bg: "#00BAF2", fg: "#fff", border: "#00BAF2", emoji: "💰" },
              ].map((app) => (
                <a key={app.name} href={app.intent} style={{ ...styles.appListBtn, background: app.bg, color: app.fg, border: `1px solid ${app.border}` }}>
                  <div style={styles.appListIcon}><span style={{ fontSize: 22 }}>{app.emoji}</span></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>{app.name}</p>
                    <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>Tap to open {app.name}</p>
                  </div>
                  <span style={{ opacity: 0.4 }}>→</span>
                </a>
              ))}

              <a href={upiDeepLink} style={{ ...styles.appListBtn, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
                <div style={styles.appListIcon}><span style={{ fontSize: 18, color: "#4f46e5" }}>@</span></div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>Other UPI App</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>BHIM, Cred, Jupiter, etc.</p>
                </div>
                <span style={{ opacity: 0.3 }}>→</span>
              </a>
            </div>
          </div>
        )}

        {/* ─── CARDS TAB ─── */}
        {activeTab === "card" && (
          <div style={{ ...styles.tabContent, textAlign: "center" as const }}>
            <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>🔒</div>
            <p style={{ fontWeight: 900, fontSize: 18, color: "#0f172a", margin: "0 0 6px" }}>Coming Soon</p>
            <p style={{ color: "#64748b", fontSize: 13 }}>Card payments are being optimized.</p>
            <button onClick={() => setActiveTab("qr")} style={{ marginTop: 16, padding: "10px 24px", background: "#f1f5f9", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
              Go Back to UPI
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span>🛡️ PCI DSS Compliant</span>
          <span style={{ width: 4, height: 4, background: "#cbd5e1", borderRadius: "50%", display: "inline-block" }}></span>
          <span>🔒 256-bit SSL</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// All styles as plain objects — zero external dependencies
// ═══════════════════════════════════════════════════════════════
const styles: Record<string, React.CSSProperties> = {
  // Page
  pageWrap: { minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#4338ca", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", margin: 0 },
  
  // Mobile Header
  mobileHeader: { position: "sticky" as const, top: 0, zIndex: 30, background: "#4338ca" },
  mobileHeaderInner: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px" },
  logoBox: { width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  timerChip: { fontSize: 13, fontWeight: 800, padding: "6px 14px", borderRadius: 12, fontFamily: "monospace" },
  progressTrack: { width: "100%", height: 2, background: "rgba(0,0,0,0.2)" },
  progressBar: { height: "100%", background: "#34d399", transition: "width 1s linear" },

  // Amount
  amountSection: { background: "#4338ca", color: "#fff", textAlign: "center" as const, padding: "16px 20px 32px" },
  amountText: { fontSize: 42, fontWeight: 900, margin: 0, display: "flex", alignItems: "baseline", justifyContent: "center" },

  // Content Card
  contentCard: { flex: 1, background: "#fff", borderRadius: "28px 28px 0 0", marginTop: -16, display: "flex", flexDirection: "column" as const, overflow: "hidden" },

  // Tab Bar
  tabBar: { display: "flex", gap: 4, margin: "20px 20px 0", padding: 4, background: "#f1f5f9", borderRadius: 16 },
  tab: { flex: 1, border: "none", padding: "10px 8px", borderRadius: 12, fontWeight: 800, fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, transition: "all 0.2s" },

  // Tab Content
  tabContent: { flex: 1, padding: "20px 20px 0", overflowY: "auto" as const },

  // QR
  qrWrapper: { display: "flex", justifyContent: "center", marginBottom: 16 },
  qrBorder: { padding: 16, background: "#fff", border: "2px solid #e2e8f0", borderRadius: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.06)" },

  // UPI Row
  upiRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: 14, border: "1px solid #e2e8f0" },
  upiLabel: { fontSize: 8, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: 2, color: "#94a3b8", margin: 0 },
  upiValue: { fontSize: 12, fontWeight: 900, color: "#0f172a", fontFamily: "monospace", margin: 0 },
  copyBtn: { width: 36, height: 36, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },

  // App Grid (under QR)
  appGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  appBtn: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4, padding: "10px 6px", borderRadius: 14, textDecoration: "none", fontFamily: "inherit" },

  // Fallback
  fallbackBtn: { display: "block", textAlign: "center" as const, padding: "12px", background: "#f1f5f9", borderRadius: 14, border: "1px solid #e2e8f0", textDecoration: "none", color: "#475569", fontSize: 12, fontWeight: 700, marginTop: 8 },

  // App List (UPI tab)
  appListBtn: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 18, textDecoration: "none", fontFamily: "inherit" },
  appListIcon: { width: 44, height: 44, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", flexShrink: 0 },

  // Footer
  footer: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", borderTop: "1px solid #f1f5f9", fontSize: 9, fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase" as const, letterSpacing: 1.5 },

  // Expired
  expiredWrap: { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 16 },
  expiredCard: { maxWidth: 400, background: "#fff", borderRadius: 28, padding: "40px 24px", textAlign: "center" as const, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" },
  expiredIcon: { width: 64, height: 64, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" },

  // Success
  successOverlay: { position: "fixed" as const, inset: 0, zIndex: 100, background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  successCard: { maxWidth: 380, width: "100%", background: "#fff", borderRadius: 36, padding: "24px", textAlign: "center" as const, boxShadow: "0 24px 64px rgba(0,0,0,0.15)", position: "relative" as const, overflow: "hidden" },
  successTopBar: { position: "absolute" as const, top: 0, left: 0, right: 0, height: 4, background: "#10b981" },
  successCheckCircle: { width: 80, height: 80, background: "#10b981", color: "#fff", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 900, margin: "16px auto 20px", boxShadow: "0 8px 24px rgba(16,185,129,0.25)" },
  successDetails: { background: "#f8fafc", borderRadius: 20, padding: 20, textAlign: "left" as const, display: "flex", flexDirection: "column" as const, gap: 10, border: "1px solid #f1f5f9" },
  detailLabel: { display: "block", fontSize: 9, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: 2, color: "#94a3b8" },
  detailValue: { display: "block", fontSize: 14, fontWeight: 700, color: "#0f172a" },
  loadingSpinner: {
    width: 24,
    height: 24,
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  }
};

// Add global animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
