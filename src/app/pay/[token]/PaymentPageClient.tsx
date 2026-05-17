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

// ═══════════════════════════════════════════════════════════════
// SVG Assets
// ═══════════════════════════════════════════════════════════════
const GPayIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M12.06 9.69v4.22h5.81c-.24 1.35-1.04 2.5-2.2 3.28v2.7h3.54c2.08-1.91 3.28-4.74 3.28-8.2 0-.69-.06-1.36-.18-2.01h-10.25z"/>
    <path fill="#34A853" d="M12.06 24c2.88 0 5.3-1 7.07-2.61l-3.54-2.7c-.96.64-2.18 1.02-3.53 1.02-2.71 0-5.01-1.83-5.83-4.29H2.5v2.79A11.96 11.96 0 0012.06 24z"/>
    <path fill="#FBBC05" d="M6.23 15.42a7.19 7.19 0 010-4.59V8.04H2.5a12.01 12.01 0 000 10.17l3.73-2.79z"/>
    <path fill="#EA4335" d="M12.06 4.74c1.57 0 2.97.54 4.08 1.6l3.07-3.07C17.36 1.48 14.94 0 12.06 0 7.42 0 3.32 2.68 1.13 6.64l3.73 2.79c.82-2.46 3.12-4.69 7.2-4.69z"/>
  </svg>
);

const PhonePeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#5f259f"/>
    <path fill="#fff" d="M16 11.5L14.5 13H13v3h-2v-3H9.5L8 11.5 9.5 10H11V7h2v3h1.5L16 11.5z M12 3a9 9 0 100 18 9 9 0 000-18zm0 16a7 7 0 110-14 7 7 0 010 14z"/>
  </svg>
);

const PaytmIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#00BAF2"/>
    <path fill="#fff" d="M7 16h2v-6h3v6h2V8H7v8zm1-5h3V9H8v2z"/>
  </svg>
);

const UpiIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 8v8M8 12h8"></path>
  </svg>
);

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
  const [copied, setCopied] = useState(false);

  // Device Detection
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const getInitialTimeLeft = () => {
    if (!expireAt) return 600;
    const diff = new Date(expireAt).getTime() - Date.now();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Detect OS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);
    setIsDesktop(!ios && !android);

    if (!qrData && upiDeepLink) {
      QRCode.toDataURL(upiDeepLink, { width: 300, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
        .then(setQrData)
        .catch(err => console.error("QR Error:", err));
    }
  }, []);

  useEffect(() => {
    if (!mounted || status !== "PENDING") return;

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

    return () => clearInterval(timer);
  }, [mounted, status]);

  useEffect(() => {
    if (!mounted || status !== "PENDING") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/pay/status?token=${token}`);
        const data = await res.json();
        
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
      } catch (err) {}
    };

    poll();
    const interval = setInterval(poll, 1500); // Polling every 1.5s is sufficient
    return () => clearInterval(interval);
  }, [mounted, token, status]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerStr = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

  const upiMatch = upiDeepLink.match(/pa=([^&]+)/);
  const merchantUpi = upiMatch ? decodeURIComponent(upiMatch[1]) : "merchant@upi";

  // Intent links
  const paytmIntent = `paytmmp://cash_wallet?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${referenceId}&mc=4722&&sign=AAuN7izDWN5cb8A5scnUiNME%2BLkZqI2DWgkXlN1McoP6WZABa%2FKkFTiLvuPRP6%2FnWK8BPg%2FrPhb%2Bu4QMrUEX10UsANTDbJaALcSM9b8Wk218X%2B55T%2FzOzb7xoiB%2BBcX8yYuYayELImXJHIgL%2Fc7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr&featuretype=money_transfer`;
  
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
  const phonepeBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(phonepeData))));
  const phonepeIntent = `phonepe://native?data=${phonepeBase64}&id=p2ppayment`;

  if (!mounted) return <div style={styles.pageWrap}></div>;

  // ─── EXPIRED ───
  if (status === "EXPIRED" || timeLeft <= 0) {
    return (
      <div style={styles.pageWrap}>
        <div style={styles.card}>
          <div style={styles.expiredIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 style={styles.heading}>Payment Expired</h2>
          <p style={styles.subtext}>This session has ended. Please return to the merchant and try again.</p>
        </div>
      </div>
    );
  }

  // ─── SUCCESS ───
  if (status === "SUCCESS") {
    return (
      <div style={styles.pageWrap}>
        <div style={styles.card}>
          <div style={styles.successIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={styles.heading}>Payment Successful</h2>
          <p style={styles.subtext}>Your payment of <strong>₹{amount.toLocaleString()}</strong> to {merchantName} was successful.</p>
          
          <div style={styles.detailsBox}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Paid by</span>
              <span style={styles.detailValue}>{payerName || "Verified"}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Reference (UTR)</span>
              <span style={styles.detailValue}>{utr || "Verified"}</span>
            </div>
          </div>
          
          <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 24 }}>Redirecting back to merchant...</p>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT PAGE ───
  return (
    <div style={styles.pageWrap}>
      <div style={styles.card}>
        
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.merchantInfo}>
            <div style={styles.avatar}>{merchantName.charAt(0).toUpperCase()}</div>
            <div>
              <p style={styles.merchantLabel}>Pay</p>
              <h1 style={styles.merchantName}>{merchantName}</h1>
            </div>
          </div>
          <div style={styles.amountContainer}>
            <span style={styles.currency}>₹</span>
            <span style={styles.amount}>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Dynamic Payment Options based on OS */}
        <div style={styles.paymentSection}>
          
          {/* Always Show QR Code and UPI Details */}
          <div style={styles.qrSection}>
            <p style={styles.instruction}>Scan QR with any UPI app</p>
            <div style={styles.qrContainer}>
              {qrData ? <img src={qrData} style={styles.qrImage} alt="QR Code" /> : <div style={styles.qrPlaceholder} />}
            </div>
            <div style={styles.upiContainer}>
              <div style={styles.upiTextContainer}>
                <p style={styles.upiLabel}>UPI ID</p>
                <p style={styles.upiValue}>{merchantUpi}</p>
              </div>
              <button onClick={() => handleCopy(merchantUpi)} style={styles.copyButton}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Android -> Show Deep Links below QR (No GPay per request, No Other Apps) */}
          {isAndroid && (
            <div style={{ ...styles.deepLinkSection, marginTop: 24, paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
              <p style={styles.instruction}>Or pay directly using</p>
              <div style={styles.appGrid}>
                <a href={phonepeIntent} style={styles.appButton}>
                  <PhonePeIcon />
                  <span style={styles.appName}>PhonePe</span>
                </a>
                <a href={paytmIntent} style={styles.appButton}>
                  <PaytmIcon />
                  <span style={styles.appName}>Paytm</span>
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer Area */}
        <div style={styles.footer}>
          <div style={styles.timerContainer}>
            <span style={styles.timerIcon}>⏳</span>
            <span style={styles.timerText}>Expires in {timerStr}</span>
          </div>
          <p style={styles.secureText}>🔒 Secured by PayxMint</p>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Modern Stripe-like Styles
// ═══════════════════════════════════════════════════════════════
const styles: Record<string, React.CSSProperties> = {
  pageWrap: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5", // Light cool gray
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "32px 24px",
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #f0f0f0",
  },
  merchantInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#18181b", // Stripe-dark
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 600,
  },
  merchantLabel: {
    fontSize: "13px",
    color: "#71717a",
    margin: "0 0 2px 0",
    fontWeight: 500,
  },
  merchantName: {
    fontSize: "18px",
    color: "#18181b",
    margin: 0,
    fontWeight: 600,
    letterSpacing: "-0.3px",
  },
  amountContainer: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
  },
  currency: {
    fontSize: "24px",
    fontWeight: 500,
    color: "#71717a",
  },
  amount: {
    fontSize: "42px",
    fontWeight: 700,
    color: "#18181b",
    letterSpacing: "-1px",
  },
  paymentSection: {
    padding: "24px",
  },
  instruction: {
    fontSize: "14px",
    color: "#52525b",
    fontWeight: 500,
    textAlign: "center",
    margin: "0 0 16px 0",
  },
  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  qrContainer: {
    padding: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    marginBottom: "24px",
  },
  qrImage: {
    width: "180px",
    height: "180px",
    display: "block",
    borderRadius: "6px",
  },
  qrPlaceholder: {
    width: "180px",
    height: "180px",
    backgroundColor: "#f4f4f5",
    borderRadius: "6px",
  },
  upiContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    padding: "12px 16px",
    borderRadius: "10px",
  },
  upiTextContainer: {
    overflow: "hidden",
  },
  upiLabel: {
    fontSize: "11px",
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: 600,
    margin: "0 0 2px 0",
  },
  upiValue: {
    fontSize: "14px",
    color: "#27272a",
    fontWeight: 600,
    margin: 0,
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  copyButton: {
    backgroundColor: "#ffffff",
    border: "1px solid #d4d4d8",
    color: "#18181b",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  
  // App Deep Links
  deepLinkSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  appGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "8px",
  },
  appButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#18181b",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  appName: {
    fontSize: "14px",
    fontWeight: 600,
  },
  otherAppButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "14px",
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#52525b",
    fontSize: "14px",
    fontWeight: 600,
    transition: "background 0.2s",
  },
  
  // Footer
  footer: {
    padding: "20px 24px",
    backgroundColor: "#fafafa",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#fff7ed", // Subtle orange
    color: "#ea580c",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
  },
  timerText: {
    fontVariantNumeric: "tabular-nums",
  },
  secureText: {
    fontSize: "12px",
    color: "#a1a1aa",
    fontWeight: 500,
    margin: 0,
  },

  // States
  heading: {
    fontSize: "22px",
    fontWeight: 600,
    color: "#18181b",
    textAlign: "center",
    margin: "0 0 8px 0",
  },
  subtext: {
    fontSize: "14px",
    color: "#71717a",
    textAlign: "center",
    margin: "0 0 24px 0",
    padding: "0 24px",
    lineHeight: 1.5,
  },
  expiredIcon: {
    margin: "40px auto 24px",
    width: "64px",
    height: "64px",
    backgroundColor: "#fef2f2",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    margin: "40px auto 24px",
    width: "64px",
    height: "64px",
    backgroundColor: "#ecfdf5",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsBox: {
    margin: "0 24px 32px",
    padding: "16px",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px solid #f0f0f0",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  detailLabel: {
    fontSize: "13px",
    color: "#71717a",
    fontWeight: 500,
  },
  detailValue: {
    fontSize: "13px",
    color: "#18181b",
    fontWeight: 600,
    fontFamily: "monospace",
  }
};
