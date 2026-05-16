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
<title>Checkout | ${merchantName}</title>
<script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>
<style>
:root { --primary: #18181b; --slate-50: #f8fafc; --slate-100: #f1f5f9; --slate-200: #e2e8f0; --slate-400: #94a3b8; --slate-500: #64748b; --slate-600: #475569; --slate-900: #0f172a; --blue-600: #2563eb; }
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
body{font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif;background-color:#fff;color:var(--slate-900);line-height:1.5;min-height:100vh}
.checkout-container{display:flex;min-height:100vh}
.summary-panel{flex:1;background:var(--slate-50);padding:64px 48px;display:flex;flex-direction:column;align-items:flex-end;border-right:1px solid var(--slate-100)}
.payment-panel{flex:1;background:#fff;padding:64px 48px;display:flex;flex-direction:column;align-items:flex-start}
.panel-content{width:100%;max-width:380px}
.merchant-header{display:flex;align-items:center;gap:12px;margin-bottom:32px;opacity:0.8}
.merchant-logo{width:32px;height:32px;background:var(--slate-900);color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px}
.merchant-name-top{font-size:15px;font-weight:600;color:var(--slate-600)}
.back-link{font-size:14px;color:var(--slate-500);text-decoration:none;display:flex;align-items:center;gap:6px;margin-bottom:32px}
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
.upi-field{width:100%;background:var(--slate-50);border:1px solid var(--slate-200);border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:32px}
.upi-label{font-size:11px;font-weight:700;color:var(--slate-400);text-transform:uppercase;letter-spacing:0.5px}
.upi-id{font-size:14px;font-weight:600;color:var(--slate-900);font-family:monospace}
.copy-btn{font-size:12px;font-weight:700;color:var(--blue-600);background:none;border:none;cursor:pointer}
.app-buttons{display:none;width:100%;gap:12px;margin-top:24px}
.btn-pay{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;transition:all 0.2s}
.btn-phonepe{background:#5f259f;color:#fff}
.btn-paytm{background:#00baf2;color:#fff}
.footer-trust{margin-top:auto;padding-top:48px;display:flex;align-items:center;gap:8px;color:var(--slate-400);font-size:12px;font-weight:500}
.footer-trust svg{opacity:0.5}

.loader-bar{width:100%;height:3px;background:var(--slate-100);border-radius:2px;overflow:hidden;margin-bottom:24px}
.loader-progress{width:30%;height:100%;background:var(--blue-600);border-radius:2px;animation:slide 2s infinite ease-in-out}
@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }

#successView, #expiredView { display:none; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:40px; }
.status-icon{margin-bottom:24px}
.status-title{font-size:24px;font-weight:700;margin-bottom:12px}
.status-desc{font-size:16px;color:var(--slate-500);max-width:400px;line-height:1.6}

@media (max-width: 850px) {
  .checkout-container{flex-direction:column}
  .summary-panel{align-items:flex-start;padding:32px 24px;border-right:none;border-bottom:1px solid var(--slate-100)}
  .payment-panel{padding:48px 24px}
  .panel-content{max-width:100%}
  .amount-display{margin-bottom:24px}
  .amount-value{font-size:32px}
  .app-buttons{display:flex}
}
</style>
</head>
<body>

<div id="mainView" class="checkout-container">
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
      <h2 class="payment-title">Pay with UPI</h2>
      <div class="loader-bar"><div class="loader-progress"></div></div>
      <div class="qr-box">
        <img src="${qrData}" class="qr-img" alt="QR Code">
      </div>
      <p style="font-size:14px;color:var(--slate-500);margin-bottom:16px;font-weight:500">Scan this QR with any UPI app to pay</p>
      
      <div class="upi-field">
        <div>
          <p class="upi-label">Merchant UPI ID</p>
          <p class="upi-id" id="upiValue">${merchantUpi}</p>
        </div>
        <button class="copy-btn" onclick="copyUpi(this)">Copy</button>
      </div>

      <div class="app-buttons" id="deepLinks">
        <a href="#" onclick="event.preventDefault();window.location.href='${esc(phonepeIntent)}'" class="btn-pay btn-phonepe">Pay with PhonePe</a>
        <a href="${paytmIntent}" class="btn-pay btn-paytm">Pay with Paytm</a>
      </div>

      <div class="footer-trust">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <span>Securely processed by PayxMint</span>
      </div>
    </div>
  </div>
</div>

<div id="successView">
  <div class="status-icon">
    <dotlottie-player src="/Success.lottie" background="transparent" speed="1" style="width: 150px; height: 150px;" autoplay></dotlottie-player>
  </div>
  <h2 class="status-title">Payment successful</h2>
  <p class="status-desc">Your payment of <strong>₹${amount.toLocaleString()}</strong> has been verified. You will be redirected back shortly.</p>
</div>

<div id="expiredView">
  <div class="status-icon">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  </div>
  <h2 class="status-title">Session expired</h2>
  <p class="status-desc">This payment session has timed out for security. Please return to the merchant and try again.</p>
</div>
/p>
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
