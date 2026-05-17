import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const intent = await prisma.paymentIntent.findUnique({
    where: { paymentToken: token },
    include: { merchant: true, transaction: true },
  });

  if (!intent) {
    return new NextResponse("Payment not found", { status: 404 });
  }

  const merchantName = intent.merchant.brandName || intent.merchant.businessName || intent.merchant.name;
  const amount = Number(intent.amount);
  const referenceId = intent.referenceId;
  const upiDeepLink = intent.upiDeepLink || "";
  
  // Generate QR in premium navy blue to avoid black/near-black colors
  const qrData = await QRCode.toDataURL(upiDeepLink, { width: 400, margin: 1, color: { dark: '#1d4ed8', light: '#ffffff' } });
  
  const status = intent.status;
  const expireAt = intent.expireAt ? intent.expireAt.toISOString() : "";
  const payerName = intent.payerName || intent.transaction?.payerName || "";
  const utr = intent.transaction?.utr || "";

  // Build redirect URL if successful
  const redirectUrl = intent.status === "SUCCESS" ? (intent.redirectUrl || intent.merchant.redirectUrl || "") : "";

  // Extract UPI ID
  const upiMatch = upiDeepLink.match(/pa=([^&]+)/);
  const merchantUpi = upiMatch ? decodeURIComponent(upiMatch[1]) : "merchant@upi";

  // Intents
  const cleanPaytmName = encodeURIComponent(merchantName).replace(/%20/g, "+");
  const paytmIntent = `paytmmp://cash_wallet?pa=${encodeURIComponent(merchantUpi)}&pn=${cleanPaytmName}&am=${amount}&cu=INR&tn=${referenceId}&tr=${referenceId}&mc=4722&&sign=AAuN7izDWN5cb8A5scnUiNME+LkZqI2DWgkXlN1McoP6WZABa/KkFTiLvuPRP6/nWK8BPg/rPhb+u4QMrUEX10UsANTDbJaALcSM9b8Wk218X+55T/zOzb7xoiB+BcX8yYuYayELImXJHIgL/c7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr&featuretype=money_transfer`;

  const phonepePayload = JSON.stringify({
    contact: { cbsName: "", nickName: merchantName, vpa: merchantUpi, type: "VPA" },
    p2pPaymentCheckoutParams: {
      note: referenceId, isByDefaultKnownContact: true, enableSpeechToText: false,
      allowAmountEdit: false, showQrCodeOption: false, disableViewHistory: true,
      shouldShowUnsavedContactBanner: false, isRecurring: false, checkoutType: "DEFAULT",
      transactionContext: "p2p", initialAmount: Math.round(amount * 100),
      disableNotesEdit: true, showKeyboard: false, currency: "INR", shouldShowMaskedNumber: true
    }
  });
  const phonepeBase64 = Buffer.from(phonepePayload).toString("base64");
  const phonepeIntent = `phonepe://native?data=${phonepeBase64}&id=p2ppayment`;

  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Checkout | ${merchantName}</title>
<style>
:root { --primary: #2563eb; --slate-50: #f8fafc; --slate-100: #f1f5f9; --slate-200: #e2e8f0; --slate-400: #94a3b8; --slate-500: #64748b; --slate-600: #475569; --slate-900: #334155; --blue-600: #2563eb; }
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
body{font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif;background-color:#fff;color:var(--slate-900);line-height:1.5;min-height:100vh}
.checkout-container{display:flex;min-height:100vh}
.summary-panel{flex:1;background:var(--slate-50);padding:64px 48px;display:flex;flex-direction:column;align-items:flex-end;border-right:1px solid var(--slate-100)}
.payment-panel{flex:1;background:#fff;padding:64px 48px;display:flex;flex-direction:column;align-items:flex-start}
.panel-content{width:100%;max-width:380px}
.merchant-header{display:flex;align-items:center;gap:12px;margin-bottom:32px;opacity:0.8}
.merchant-logo{width:32px;height:32px;background:var(--blue-600);color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px}
.merchant-name-top{font-size:15px;font-weight:600;color:var(--slate-600)}
.amount-display{margin-bottom:48px}
.amount-label{font-size:16px;color:var(--slate-500);font-weight:500;margin-bottom:8px}
.amount-value{font-size:48px;font-weight:700;letter-spacing:-1.5px;color:var(--slate-900)}
.order-details{border-top:1px solid var(--slate-200);padding-top:24px}
.order-row{display:flex;justify-content:space-between;margin-bottom:16px;font-size:14px}
.order-label{color:var(--slate-500)}
.order-val{font-weight:600;color:var(--slate-900)}
.payment-title{font-size:20px;font-weight:600;margin-bottom:24px;letter-spacing:-0.4px}
.qr-box{background:#fff;border:1px solid var(--slate-200);border-radius:12px;padding:16px;display:inline-block;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
.qr-img{width:220px;height:220px;display:block}
.copy-btn{font-size:12px;font-weight:700;color:var(--blue-600);background:none;border:none;cursor:pointer}
.app-buttons{display:none;width:100%;gap:12px;margin-top:24px}
.btn-pay{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 16px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;transition:all 0.2s;border:none;cursor:pointer}
.btn-pay svg{width:24px;height:24px;flex-shrink:0}
.btn-phonepe{background:#5f259f;color:#fff}
.btn-paytm{background:#002970;color:#fff}
.footer-trust{margin-top:auto;padding-top:48px;display:flex;align-items:center;gap:8px;color:var(--slate-400);font-size:12px;font-weight:500}
.footer-trust svg{opacity:0.5}

.loader-bar{width:100%;height:3px;background:var(--slate-100);border-radius:2px;overflow:hidden;margin-bottom:24px}
.loader-progress{width:30%;height:100%;background:var(--blue-600);border-radius:2px;animation:slide 2s infinite ease-in-out}
@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }

#successView, #expiredView { display:none; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:40px; background:#fff; }
.status-icon{margin-bottom:32px}
.status-title{font-size:28px;font-weight:700;margin-bottom:12px;color:var(--slate-900)}
.status-desc{font-size:16px;color:var(--slate-500);max-width:400px;line-height:1.6}

/* Details Box for Success */
.details-box { background: var(--slate-50); border: 1px solid var(--slate-100); border-radius: 12px; padding: 20px; width: 100%; max-width: 320px; margin: 24px 0; }
.detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
.detail-row:last-child { margin-bottom: 0; }
.detail-label { color: var(--slate-500); font-weight: 500; }
.detail-value { color: var(--slate-900); font-weight: 700; }

/* Animated Success Checkmark */
.checkmark-wrap{width:120px;height:120px;position:relative}
.checkmark-circle{width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);position:relative;animation:popIn .5s cubic-bezier(.17,.67,.34,1.3) forwards;transform:scale(0)}
.checkmark-circle::after{content:'';position:absolute;inset:6px;border-radius:50%;background:rgba(255,255,255,0.15)}
.checkmark-check{position:absolute;top:50%;left:50%;transform:translate(-50%,-55%) rotate(45deg);width:28px;height:52px;border-bottom:5px solid #fff;border-right:5px solid #fff;opacity:0;animation:drawCheck .4s ease .5s forwards}
.checkmark-ring{position:absolute;inset:-8px;border-radius:50%;border:3px solid rgba(16,185,129,0.2);animation:ringPulse 1.5s ease .7s infinite}

@keyframes popIn{0%{transform:scale(0)}70%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes drawCheck{0%{opacity:0;height:0;width:0}40%{opacity:1;height:0;width:28px}100%{opacity:1;height:52px;width:28px}}
@keyframes ringPulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.4);opacity:0}}

/* Mobile: Centralized Card Style */
@media (max-width: 850px) {
  body { background-color: #f4f4f5; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .checkout-container { display: block; min-height: auto; width: 100%; max-width: 420px; }
  .summary-panel { display: none; }
  .payment-panel { 
    background: #fff; 
    border-radius: 20px; 
    padding: 32px 24px; 
    align-items: center; 
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
  }
  .panel-content { align-items: center; text-align: center; }
  .mobile-header { display: block !important; width: 100%; margin-bottom: 32px; text-align: left; }
  .payment-title { text-align: center; width: 100%; }
  .qr-box { margin-bottom: 24px; }
  .app-buttons { display: flex; }
  .footer-trust { justify-content: center; padding-top: 32px; }
}
.mobile-header { display: none; }
</style>
</head>
<body>

<div id="mainView" class="checkout-container" style="${status !== 'PENDING' ? 'display:none' : ''}">
  <!-- Desktop Summary -->
  <div class="summary-panel">
    <div class="panel-content">
      <div class="merchant-header">
        <div class="merchant-logo">${merchantName.charAt(0).toUpperCase()}</div>
        <span class="merchant-name-top">${merchantName}</span>
      </div>
      <div class="amount-display">
        <p class="amount-label">Pay ${merchantName}</p>
        <h1 class="amount-value">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h1>
      </div>
      <div class="order-details">
        <div class="order-row">
          <span class="order-label">Order ID</span>
          <span class="order-val">${referenceId}</span>
        </div>
        <div class="order-row" id="timerRow">
          <span class="order-label">Session expires</span>
          <span class="order-val" id="countdown">10:00</span>
        </div>
      </div>
    </div>
  </div>

  <div class="payment-panel">
    <div class="panel-content">
      <!-- Mobile Only Header -->
      <div class="mobile-header">
        <div class="merchant-header" style="margin-bottom: 16px;">
          <div class="merchant-logo">${merchantName.charAt(0).toUpperCase()}</div>
          <span class="merchant-name-top">${merchantName}</span>
        </div>
        <div class="amount-display" style="margin-bottom: 0;">
          <h1 class="amount-value" style="font-size: 32px;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h1>
          <p class="order-label" style="margin-top: 4px;">Order ID: ${referenceId}</p>
        </div>
      </div>

      <h2 class="payment-title">Pay with UPI</h2>
      <div class="loader-bar"><div class="loader-progress"></div></div>
      <div class="qr-box">
        <img src="${qrData}" class="qr-img" alt="QR Code">
      </div>
      <p style="font-size:14px;color:var(--slate-500);margin-bottom:24px;font-weight:500">Scan QR with any UPI app</p>

      <div class="app-buttons" id="deepLinks">
        <a href="#" onclick="event.preventDefault();window.location.href='${esc(phonepeIntent)}'" class="btn-pay btn-phonepe">
          <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><circle cx="-25.926" cy="41.954" r="29.873" fill="#5f259f" transform="rotate(-76.714 -48.435 5.641) scale(8.56802)"/><path d="M372.164 189.203c0-10.008-8.576-18.593-18.584-18.593h-34.323l-78.638-90.084c-7.154-8.577-18.592-11.439-30.03-8.577l-27.17 8.577c-4.292 1.43-5.723 7.154-2.862 10.007l85.8 81.508H136.236c-4.293 0-7.154 2.861-7.154 7.154v14.292c0 10.016 8.585 18.592 18.592 18.592h20.015v68.639c0 51.476 27.17 81.499 72.931 81.499 14.292 0 25.739-1.431 40.03-7.146v45.753c0 12.87 10.016 22.886 22.885 22.886h20.015c4.293 0 8.577-4.293 8.577-8.586V210.648h32.893c4.292 0 7.145-2.861 7.145-7.145v-14.3zM280.65 312.17c-8.576 4.292-20.015 5.723-28.591 5.723-22.886 0-34.324-11.438-34.324-37.176v-68.639h62.915v100.092z" fill="#fff" fill-rule="nonzero"/></svg>
          PhonePe
        </a>
        <a href="${paytmIntent}" class="btn-pay btn-paytm">
          <svg viewBox="0 0 122.88 38.52" xmlns="http://www.w3.org/2000/svg"><path fill="#00BAF2" d="M122.47,11.36c-1.12-3.19-4.16-5.48-7.72-5.48h-0.08c-2.32,0-4.41,0.97-5.9,2.52c-1.49-1.55-3.58-2.52-5.9-2.52h-0.07c-2.04,0-3.91,0.75-5.34,1.98V7.24c-0.05-0.63-0.56-1.12-1.2-1.12h-5.48c-0.67,0-1.21,0.54-1.21,1.21v29.74c0,0.67,0.54,1.21,1.21,1.21h5.48c0.61,0,1.12-0.46,1.19-1.04l0-21.35c0-0.08,0-0.14,0.01-0.21c0.09-0.95,0.79-1.74,1.89-1.83h1.01c0.46,0.04,0.85,0.2,1.15,0.45c0.48,0.38,0.74,0.96,0.74,1.6l0.02,21.24c0,0.67,0.54,1.22,1.21,1.22h5.48c0.65,0,1.17-0.51,1.2-1.15l0-21.33c0-0.7,0.32-1.34,0.89-1.71c0.28-0.18,0.62-0.3,1.01-0.34h1.01c1.19,0.1,1.9,1,1.9,2.05l0.02,21.22c0,0.67,0.54,1.21,1.21,1.21h5.48c0.64,0,1.17-0.5,1.21-1.13V13.91C122.86,12.6,122.69,11.99,122.47,11.36z M85.39,6.2h-3.13V1.12c0-0.01,0-0.01,0-0.02C82.26,0.5,81.77,0,81.15,0c-0.07,0-0.14,0.01-0.21,0.02c-3.47,0.95-2.78,5.76-9.12,6.17h-0.61c-0.09,0-0.18,0.01-0.27,0.03h-0.01l0.01,0C70.41,6.35,70,6.83,70,7.41v5.48c0,0.67,0.54,1.21,1.21,1.21h3.3l-0.01,23.22c0,0.66,0.54,1.2,1.2,1.2h5.42c0.66,0,1.2-0.54,1.2-1.2l0-23.22h3.07c0.66,0,1.21-0.55,1.21-1.21V7.41C86.6,6.74,86.06,6.2,85.39,6.2z"/><path fill="#fff" d="M65.69,6.2h-5.48C59.55,6.2,59,6.74,59,7.41v11.33c-0.01,0.7-0.58,1.26-1.28,1.26h-2.29c-0.71,0-1.29-0.57-1.29-1.28L54.12,7.41c0-0.67-0.54-1.21-1.21-1.21h-5.48c-0.67,0-1.21,0.54-1.21,1.21v12.41c0,4.71,3.36,8.08,8.08,8.08c0,0,3.54,0,3.65,0.02c0.64,0.07,1.13,0.61,1.13,1.27c0,0.65-0.48,1.19-1.12,1.27c-0.03,0-0.06,0.01-0.09,0.02l-8.01,0.03c-0.67,0-1.21,0.54-1.21,1.21v5.47c0,0.67,0.54,1.21,1.21,1.21h8.95c4.72,0,8.08-3.36,8.08-8.07V7.41C66.9,6.74,66.36,6.2,65.69,6.2z M34.53,6.23h-7.6c-0.67,0-1.22,0.51-1.22,1.13v2.13c0,0.01,0,0.03,0,0.04c0,0.02,0,0.03,0,0.05v2.92c0,0.66,0.58,1.21,1.29,1.21h7.24c0.57,0.09,1.02,0.51,1.09,1.16v0.71c-0.06,0.62-0.51,1.07-1.06,1.12h-3.58c-4.77,0-8.16,3.17-8.16,7.61v6.37c0,4.42,2.92,7.56,7.65,7.56h9.93c1.78,0,3.23-1.35,3.23-3.01V14.45C43.34,9.41,40.74,6.23,34.53,6.23z M35.4,29.09v0.86c0,0.07-0.01,0.14-0.02,0.2c-0.01,0.06-0.03,0.12-0.05,0.18c-0.17,0.48-0.65,0.83-1.22,0.83h-2.28c-0.71,0-1.29-0.54-1.29-1.21v-1.03c0-0.01,0-0.03,0-0.04l0-2.75v-0.86l0-0.01c0-0.66,0.58-1.2,1.29-1.2h2.28c0.71,0,1.29,0.54,1.29,1.21V29.09z M13.16,6.19H1.19C0.53,6.19,0,6.73,0,7.38v5.37c0,0.01,0,0.02,0,0.03c0,0.03,0,0.05,0,0.07v24.29c0,0.66,0.49,1.2,1.11,1.21h5.58c0.67,0,1.21-0.54,1.21-1.21l0.02-8.32h5.24c4.38,0,7.44-3.04,7.44-7.45v-7.72C20.6,9.25,17.54,6.19,13.16,6.19z M12.68,16.23v3.38c0,0.71-0.57,1.29-1.28,1.29l-3.47,0v-6.77h3.47c0.71,0,1.28,0.57,1.28,1.28V16.23z"/></svg>
        </a>
      </div>

      <div class="footer-trust">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <span>Securely processed by PayxMint</span>
      </div>
    </div>
  </div>
</div>

<div id="successView" style="${status === 'SUCCESS' ? 'display:flex' : ''}">
  <div class="status-icon">
    <div class="checkmark-wrap">
      <div class="checkmark-circle">
        <div class="checkmark-check"></div>
      </div>
      <div class="checkmark-ring"></div>
    </div>
  </div>
  <h2 class="status-title">Payment successful</h2>
  <p class="status-desc">Your payment of <strong>₹${amount.toLocaleString()}</strong> to ${merchantName} has been verified.</p>
  
  <div class="details-box">
    <div class="detail-row">
      <span class="detail-label">Paid by</span>
      <span class="detail-value" id="payerName">${payerName || 'Verified User'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Reference (UTR)</span>
      <span class="detail-value" id="utrVal">${utr || 'Verified'}</span>
    </div>
  </div>
  
  <p style="font-size:14px;color:var(--slate-500);margin-top:24px">Redirecting back to merchant...</p>
</div>

<div id="expiredView" style="${status === 'EXPIRED' ? 'display:flex' : ''}">
  <div class="status-icon">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  </div>
  <h2 class="status-title">Session expired</h2>
  <p class="status-desc">This payment session has timed out for security. Please return to the merchant and try again.</p>
</div>

<script>
// === GLOBAL STATE ===
var TOKEN = "${token}";
var STATUS = "${status}";
var EXPIRE_AT = "${expireAt}";
var REDIRECT_URL = "${redirectUrl}";
var TOTAL_SECS = 600;
var timeLeft = TOTAL_SECS;
var isResolved = STATUS !== "PENDING"; 
var timerInterval = null;
var pollInterval = null;

// Device Detection
var ua = navigator.userAgent;
var isAndroid = /Android/.test(ua);
if (isAndroid) {
  document.getElementById('deepLinks').style.display = 'flex';
}

// Timer setup
if (EXPIRE_AT && !isResolved) {
  var diff = new Date(EXPIRE_AT).getTime() - Date.now();
  timeLeft = diff > 0 ? Math.floor(diff / 1000) : 0;
}

function updateTimer() {
  if (isResolved) return;
  var el = document.getElementById("countdown");
  if (!el) return;
  if (timeLeft <= 0) {
    el.textContent = "0:00";
    showExpired();
    return;
  }
  timeLeft--;
  var m = Math.floor(timeLeft / 60);
  var s = timeLeft % 60;
  el.textContent = m + ":" + (s < 10 ? "0" + s : s);
}

function copyUpi(btn) {
  var text = document.getElementById("upiValue").innerText;
  navigator.clipboard.writeText(text).then(function() {
    btn.innerText = "Copied";
    setTimeout(function(){ btn.innerText = "Copy"; }, 2000);
  });
}

function showSuccess(data) {
  if (isResolved && STATUS !== "SUCCESS") { /* Already resolved to something else */ }
  isResolved = true;
  
  if (timerInterval) clearInterval(timerInterval);
  if (pollInterval) clearInterval(pollInterval);
  
  document.getElementById("mainView").style.display = "none";
  document.getElementById("expiredView").style.display = "none";
  document.getElementById("successView").style.display = "flex";
  
  if (data) {
    if (data.payer_name) document.getElementById("payerName").innerText = data.payer_name;
    if (data.utr) document.getElementById("utrVal").innerText = data.utr;
    if (data.redirect_url) REDIRECT_URL = data.redirect_url;
  }

  if (REDIRECT_URL) {
    setTimeout(function(){ window.location.href = REDIRECT_URL; }, 5000);
  }
}

function showExpired() {
  if (isResolved) return;
  isResolved = true;
  if (timerInterval) clearInterval(timerInterval);
  if (pollInterval) clearInterval(pollInterval);
  
  document.getElementById("mainView").style.display = "none";
  document.getElementById("successView").style.display = "none";
  document.getElementById("expiredView").style.display = "flex";
}

// === BOOT ===
if (STATUS === "SUCCESS") {
  showSuccess();
} else if (STATUS === "EXPIRED") {
  showExpired();
} else {
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
  
  pollInterval = setInterval(function(){
    if (isResolved) return;
    fetch('/api/pay/status?token=' + TOKEN)
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (isResolved) return;
        if (res.data && res.data.payment_status === "SUCCESS") {
          showSuccess(res.data);
        } else if (res.data && res.data.payment_status === "EXPIRED") {
          showExpired();
        }
      }).catch(function(e){});
  }, 8000);
}
</script>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
