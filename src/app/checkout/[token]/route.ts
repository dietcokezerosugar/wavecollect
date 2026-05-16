import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const intent = await prisma.paymentIntent.findUnique({
    where: { paymentToken: token },
    include: { merchant: true },
  });

  if (!intent) {
    return new NextResponse("Payment not found", { status: 404 });
  }

  const merchantName = intent.merchant.brandName || intent.merchant.businessName || intent.merchant.name;
  const amount = Number(intent.amount);
  const referenceId = intent.referenceId;
  const upiDeepLink = intent.upiDeepLink || "";
  
  // Generate QR
  const qrData = await QRCode.toDataURL(upiDeepLink, { width: 400, margin: 1, color: { dark: '#18181b', light: '#ffffff' } });
  
  const status = intent.status;
  const expireAt = intent.expireAt ? intent.expireAt.toISOString() : "";

  // Extract UPI ID
  const upiMatch = upiDeepLink.match(/pa=([^&]+)/);
  const merchantUpi = upiMatch ? decodeURIComponent(upiMatch[1]) : "merchant@upi";

  // Intents
  const paytmIntent = `paytmmp://cash_wallet?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${referenceId}&tr=${referenceId}&mc=4722&&sign=AAuN7izDWN5cb8A5scnUiNME%2BLkZqI2DWgkXlN1McoP6WZABa%2FKkFTiLvuPRP6%2FnWK8BPg%2FrPhb%2Bu4QMrUEX10UsANTDbJaALcSM9b8Wk218X%2B55T%2FzOzb7xoiB%2BBcX8yYuYayELImXJHIgL%2Fc7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr&featuretype=money_transfer`;

  const phonepePayload = JSON.stringify({
    contact: { cbsName: "", nickName: "", vpa: merchantUpi, type: "VPA" },
    p2pPaymentCheckoutParams: {
      note: referenceId, isByDefaultKnownContact: true, enableSpeechToText: false,
      allowAmountEdit: false, showQrCodeOption: false, disableViewHistory: true,
      shouldShowUnsavedContactBanner: false, isRecurring: false, checkoutType: "DEFAULT",
      transactionContext: "p2p", initialAmount: Math.floor(amount * 100),
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
<title>Pay ₹${amount} | ${merchantName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background-color:#f4f4f5;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:20px;color:#18181b}
.card{width:100%;max-width:420px;background:#fff;border-radius:16px;box-shadow:0 10px 40px -10px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.05);display:flex;flex-direction:column;overflow:hidden}
.header{padding:32px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0}
.merchant-info{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.avatar{width:48px;height:48px;border-radius:50%;background:#18181b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600}
.merchant-label{font-size:13px;color:#71717a;margin:0 0 2px 0;font-weight:500}
.merchant-name{font-size:18px;color:#18181b;margin:0;font-weight:600;letter-spacing:-0.3px}
.amount-container{display:flex;align-items:baseline;gap:4px}
.currency{font-size:24px;font-weight:500;color:#71717a}
.amount{font-size:42px;font-weight:700;color:#18181b;letter-spacing:-1px}
.payment-section{padding:24px}
.instruction{font-size:14px;color:#52525b;font-weight:500;text-align:center;margin:0 0 16px 0}
.qr-section{display:flex;flex-direction:column;align-items:center}
.qr-container{padding:12px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.04);margin-bottom:24px}
.qr-image{width:180px;height:180px;display:block;border-radius:6px}
.upi-container{width:100%;display:flex;align-items:center;justify-content:space-between;background:#fafafa;border:1px solid #e4e4e7;padding:12px 16px;border-radius:10px}
.upi-text-container{overflow:hidden}
.upi-label{font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin:0 0 2px 0}
.upi-value{font-size:14px;color:#27272a;font-weight:600;margin:0;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}
.copy-btn{background:#fff;border:1px solid #d4d4d8;color:#18181b;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.deep-link-section{display:none;flex-direction:column;gap:12px;margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0}
.app-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
.app-button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;text-decoration:none;color:#18181b;box-shadow:0 1px 2px rgba(0,0,0,.02)}
.app-name{font-size:14px;font-weight:600}
.footer{padding:20px 24px;background:#fafafa;border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between}
.timer-container{display:flex;align-items:center;gap:6px;background:#fff7ed;color:#ea580c;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600}
.timer-text{font-variant-numeric:tabular-nums}
.secure-text{font-size:12px;color:#a1a1aa;font-weight:500;margin:0}

#successView, #expiredView { display:none; width:100%; max-width:420px; }
.status-card { background:#fff; border-radius:16px; box-shadow:0 10px 40px -10px rgba(0,0,0,.08); display:flex; flex-direction:column; text-align:center; padding-bottom:32px; overflow:hidden;}
.status-icon { margin:40px auto 24px; width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.status-icon.success { background:#ecfdf5; }
.status-icon.expired { background:#fef2f2; }
.status-heading { font-size:22px; font-weight:600; color:#18181b; margin-bottom:8px; }
.status-subtext { font-size:14px; color:#71717a; padding:0 24px; margin-bottom:24px; line-height:1.5; }
.details-box { margin:0 24px; padding:16px; background:#fafafa; border-radius:8px; border:1px solid #f0f0f0; text-align:left; }
.detail-row { display:flex; justify-content:space-between; margin-bottom:12px; }
.detail-label { font-size:13px; color:#71717a; font-weight:500; }
.detail-value { font-size:13px; color:#18181b; font-weight:600; font-family:monospace; }
</style>
</head>
<body>

<div id="mainView" class="card">
  <div class="header">
    <div class="merchant-info">
      <div class="avatar">${merchantName.charAt(0).toUpperCase()}</div>
      <div>
        <p class="merchant-label">Pay</p>
        <h1 class="merchant-name">${merchantName}</h1>
      </div>
    </div>
    <div class="amount-container">
      <span class="currency">₹</span>
      <span class="amount">${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
  </div>
  
  <div class="payment-section">
    <div class="qr-section">
      <p class="instruction">Scan QR with any UPI app</p>
      <div class="qr-container">
        <img src="${qrData}" class="qr-image" alt="QR Code">
      </div>
      <div class="upi-container">
        <div class="upi-text-container">
          <p class="upi-label">UPI ID</p>
          <p class="upi-value" id="upiValue">${merchantUpi}</p>
        </div>
        <button class="copy-btn" onclick="copyUpi(this)">Copy</button>
      </div>
    </div>

    <div class="deep-link-section" id="deepLinks">
      <p class="instruction">Or pay directly using</p>
      <div class="app-grid">
        <a href="#" onclick="event.preventDefault();window.location.href='${esc(phonepeIntent)}'" class="app-button">
          <svg viewBox="0 0 24 24" width="24" height="24"><rect width="24" height="24" rx="4" fill="#5f259f"/><path fill="#fff" d="M16 11.5L14.5 13H13v3h-2v-3H9.5L8 11.5 9.5 10H11V7h2v3h1.5L16 11.5z M12 3a9 9 0 100 18 9 9 0 000-18zm0 16a7 7 0 110-14 7 7 0 010 14z"/></svg>
          <span class="app-name">PhonePe</span>
        </a>
        <a href="${paytmIntent}" class="app-button">
          <svg viewBox="0 0 24 24" width="24" height="24"><rect width="24" height="24" rx="4" fill="#00BAF2"/><path fill="#fff" d="M7 16h2v-6h3v6h2V8H7v8zm1-5h3V9H8v2z"/></svg>
          <span class="app-name">Paytm</span>
        </a>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="timer-container">
      <span>⏳</span>
      <span class="timer-text">Expires in <span id="countdown">--:--</span></span>
    </div>
    <p class="secure-text">🔒 Secured by PayxMint</p>
  </div>
</div>

<div id="successView" class="status-card">
  <div class="status-icon success">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  </div>
  <h2 class="status-heading">Payment Successful</h2>
  <p class="status-subtext">Your payment of <strong>₹${amount.toLocaleString()}</strong> to ${merchantName} was successful.</p>
  <div class="details-box">
    <div class="detail-row"><span class="detail-label">Paid by</span><span class="detail-value" id="payerName">Verified</span></div>
    <div class="detail-row"><span class="detail-label">Reference (UTR)</span><span class="detail-value" id="utrVal">Verified</span></div>
  </div>
  <p style="font-size:13px;color:#64748b;margin-top:24px">Redirecting back to merchant...</p>
</div>

<div id="expiredView" class="status-card">
  <div class="status-icon expired">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  </div>
  <h2 class="status-heading">Payment Expired</h2>
  <p class="status-subtext">This session has ended. Please return to the merchant and try again.</p>
</div>

<script>
// Device Detection
var ua = navigator.userAgent;
var isAndroid = /Android/.test(ua);
if (isAndroid) {
  document.getElementById('deepLinks').style.display = 'flex';
}

// Timer
var TOKEN = "${token}";
var STATUS = "${status}";
var EXPIRE_AT = "${expireAt}";
var TOTAL_SECS = 600;
var timeLeft = TOTAL_SECS;

if (EXPIRE_AT) {
  var diff = new Date(EXPIRE_AT).getTime() - Date.now();
  timeLeft = diff > 0 ? Math.floor(diff / 1000) : 0;
}

function updateTimer() {
  var el = document.getElementById("countdown");
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

if(STATUS === "PENDING") {
  updateTimer();
  setInterval(updateTimer, 1000);
}

function copyUpi(btn) {
  var text = document.getElementById("upiValue").innerText;
  navigator.clipboard.writeText(text).then(function() {
    btn.innerText = "Copied";
    setTimeout(function(){ btn.innerText = "Copy"; }, 2000);
  });
}

function showSuccess(data) {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("expiredView").style.display = "none";
  document.getElementById("successView").style.display = "flex";
  if(data && data.payer_name) document.getElementById("payerName").innerText = data.payer_name;
  if(data && data.utr) document.getElementById("utrVal").innerText = data.utr;
  
  if(data && data.redirect_url) {
    setTimeout(function(){ window.location.href = data.redirect_url; }, 5000);
  }
}

function showExpired() {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("successView").style.display = "none";
  document.getElementById("expiredView").style.display = "flex";
}

if (STATUS === "SUCCESS") showSuccess();
else if (STATUS === "EXPIRED") showExpired();
else {
  setInterval(function(){
    if (timeLeft <= 0) return;
    fetch('/api/pay/status?token=' + TOKEN)
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (res.data && res.data.payment_status === "SUCCESS") {
          timeLeft = 0;
          showSuccess(res.data);
        } else if (res.data && res.data.payment_status === "EXPIRED") {
          timeLeft = 0;
          showExpired();
        }
      }).catch(function(e){});
  }, 1500);
}
</script>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
