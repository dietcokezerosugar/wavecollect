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
<script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>
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

.loader-wrap { display: flex; justify-content: center; margin-top: -12px; margin-bottom: 20px; }
.loader { display: block; --height-of-loader: 4px; --loader-color: #0071e2; width: 130px; height: var(--height-of-loader); border-radius: 30px; background-color: rgba(0,0,0,0.1); position: relative; }
.loader::before { content: ""; position: absolute; background: var(--loader-color); top: 0; left: 0; width: 0%; height: 100%; border-radius: 30px; animation: moving 1.5s ease-in-out infinite; }
@keyframes moving { 50% { width: 100%; } 100% { width: 0; right: 0; left: unset; } }

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
      <div class="loader-wrap">
        <div class="loader"></div>
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
          <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><circle cx="-25.926" cy="41.954" r="29.873" fill="#5f259f" transform="rotate(-76.714 -48.435 5.641) scale(8.56802)"/><path d="M372.164 189.203c0-10.008-8.576-18.593-18.584-18.593h-34.323l-78.638-90.084c-7.154-8.577-18.592-11.439-30.03-8.577l-27.17 8.577c-4.292 1.43-5.723 7.154-2.862 10.007l85.8 81.508H136.236c-4.293 0-7.154 2.861-7.154 7.154v14.292c0 10.016 8.585 18.592 18.592 18.592h20.015v68.639c0 51.476 27.17 81.499 72.931 81.499 14.292 0 25.739-1.431 40.03-7.146v45.753c0 12.87 10.016 22.886 22.885 22.886h20.015c4.293 0 8.577-4.293 8.577-8.586V210.648h32.893c4.292 0 7.145-2.861 7.145-7.145v-14.3zM280.65 312.17c-8.576 4.292-20.015 5.723-28.591 5.723-22.886 0-34.324-11.438-34.324-37.176v-68.639h62.915v100.092z" fill="#fff" fill-rule="nonzero"/></svg>
          <span class="app-name">PhonePe</span>
        </a>
        <a href="${paytmIntent}" class="app-button" style="padding:16px 16px 20px 16px">
          <svg width="50" height="16" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 38.52" style="enable-background:new 0 0 122.88 38.52; margin-bottom:4px" xml:space="preserve"><style type="text/css">.st0{fill:#20336B;} .st1{fill:#00BAF2;}</style><g><path class="st1" d="M122.47,11.36c-1.12-3.19-4.16-5.48-7.72-5.48h-0.08c-2.32,0-4.41,0.97-5.9,2.52 c-1.49-1.55-3.58-2.52-5.9-2.52h-0.07c-2.04,0-3.91,0.75-5.34,1.98V7.24c-0.05-0.63-0.56-1.12-1.2-1.12h-5.48 c-0.67,0-1.21,0.54-1.21,1.21v29.74c0,0.67,0.54,1.21,1.21,1.21h5.48c0.61,0,1.12-0.46,1.19-1.04l0-21.35c0-0.08,0-0.14,0.01-0.21 c0.09-0.95,0.79-1.74,1.89-1.83h1.01c0.46,0.04,0.85,0.2,1.15,0.45c0.48,0.38,0.74,0.96,0.74,1.6l0.02,21.24 c0,0.67,0.54,1.22,1.21,1.22h5.48c0.65,0,1.17-0.51,1.2-1.15l0-21.33c0-0.7,0.32-1.34,0.89-1.71c0.28-0.18,0.62-0.3,1.01-0.34h1.01 c1.19,0.1,1.9,1,1.9,2.05l0.02,21.22c0,0.67,0.54,1.21,1.21,1.21h5.48c0.64,0,1.17-0.5,1.21-1.13V13.91 C122.86,12.6,122.69,11.99,122.47,11.36L122.47,11.36z M85.39,6.2h-3.13V1.12c0-0.01,0-0.01,0-0.02C82.26,0.5,81.77,0,81.15,0 c-0.07,0-0.14,0.01-0.21,0.02c-3.47,0.95-2.78,5.76-9.12,6.17h-0.61c-0.09,0-0.18,0.01-0.27,0.03h-0.01l0.01,0 C70.41,6.35,70,6.83,70,7.41v5.48c0,0.67,0.54,1.21,1.21,1.21h3.3l-0.01,23.22c0,0.66,0.54,1.2,1.2,1.2h5.42 c0.66,0,1.2-0.54,1.2-1.2l0-23.22h3.07c0.66,0,1.21-0.55,1.21-1.21V7.41C86.6,6.74,86.06,6.2,85.39,6.2L85.39,6.2z"/><path class="st0" d="M65.69,6.2h-5.48C59.55,6.2,59,6.74,59,7.41v11.33c-0.01,0.7-0.58,1.26-1.28,1.26h-2.29 c-0.71,0-1.29-0.57-1.29-1.28L54.12,7.41c0-0.67-0.54-1.21-1.21-1.21h-5.48c-0.67,0-1.21,0.54-1.21,1.21v12.41 c0,4.71,3.36,8.08,8.08,8.08c0,0,3.54,0,3.65,0.02c0.64,0.07,1.13,0.61,1.13,1.27c0,0.65-0.48,1.19-1.12,1.27 c-0.03,0-0.06,0.01-0.09,0.02l-8.01,0.03c-0.67,0-1.21,0.54-1.21,1.21v5.47c0,0.67,0.54,1.21,1.21,1.21h8.95 c4.72,0,8.08-3.36,8.08-8.07V7.41C66.9,6.74,66.36,6.2,65.69,6.2L65.69,6.2z M34.53,6.23h-7.6c-0.67,0-1.22,0.51-1.22,1.13v2.13 c0,0.01,0,0.03,0,0.04c0,0.02,0,0.03,0,0.05v2.92c0,0.66,0.58,1.21,1.29,1.21h7.24c0.57,0.09,1.02,0.51,1.09,1.16v0.71 c-0.06,0.62-0.51,1.07-1.06,1.12h-3.58c-4.77,0-8.16,3.17-8.16,7.61v6.37c0,4.42,2.92,7.56,7.65,7.56h9.93 c1.78,0,3.23-1.35,3.23-3.01V14.45C43.34,9.41,40.74,6.23,34.53,6.23L34.53,6.23z M35.4,29.09v0.86c0,0.07-0.01,0.14-0.02,0.2 c-0.01,0.06-0.03,0.12-0.05,0.18c-0.17,0.48-0.65,0.83-1.22,0.83h-2.28c-0.71,0-1.29-0.54-1.29-1.21v-1.03c0-0.01,0-0.03,0-0.04 l0-2.75v-0.86l0-0.01c0-0.66,0.58-1.2,1.29-1.2h2.28c0.71,0,1.29,0.54,1.29,1.21V29.09L35.4,29.09z M13.16,6.19H1.19 C0.53,6.19,0,6.73,0,7.38v5.37c0,0.01,0,0.02,0,0.03c0,0.03,0,0.05,0,0.07v24.29c0,0.66,0.49,1.2,1.11,1.21h5.58 c0.67,0,1.21-0.54,1.21-1.21l0.02-8.32h5.24c4.38,0,7.44-3.04,7.44-7.45v-7.72C20.6,9.25,17.54,6.19,13.16,6.19L13.16,6.19z M12.68,16.23v3.38c0,0.71-0.57,1.29-1.28,1.29l-3.47,0v-6.77h3.47c0.71,0,1.28,0.57,1.28,1.28V16.23L12.68,16.23z"/></g></svg>
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
  <div class="status-icon success" style="background:transparent; width:120px; height:120px;">
    <dotlottie-player src="/Success.lottie" background="transparent" speed="1" style="width: 120px; height: 120px;" autoplay></dotlottie-player>
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
