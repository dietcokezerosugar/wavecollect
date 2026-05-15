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
  const brandColor = intent.merchant.brandColor || "#4338ca";
  const brandLogo = intent.merchant.brandLogo;
  const amount = Number(intent.amount);
  const referenceId = intent.referenceId;
  const upiDeepLink = intent.upiDeepLink || "";
  
  // Generate QR on the fly for "Instant Load" performance
  const qrData = await QRCode.toDataURL(upiDeepLink, { width: 400, margin: 2 });
  
  const status = intent.status;
  const expireAt = intent.expireAt ? intent.expireAt.toISOString() : "";

  // Extract UPI ID from deep link
  const upiMatch = upiDeepLink.match(/pa=([^&]+)/);
  const merchantUpi = upiMatch ? decodeURIComponent(upiMatch[1]) : "merchant@upi";
  const maskedUpi = merchantUpi.length > 11
    ? merchantUpi.substring(0, 5) + "***" + merchantUpi.substring(merchantUpi.length - 6)
    : merchantUpi;

  // BloomxHub intents
  const paytmIntent = `paytmmp://cash_wallet?pa=${merchantUpi}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${referenceId}&tr=${referenceId}&mc=4722&&sign=AAuN7izDWN5cb8A5scnUiNME%2BLkZqI2DWgkXlN1McoP6WZABa%2FKkFTiLvuPRP6%2FnWK8BPg%2FrPhb%2Bu4QMrUEX10UsANTDbJaALcSM9b8Wk218X%2B55T%2FzOzb7xoiB%2BBcX8yYuYayELImXJHIgL%2Fc7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr&featuretype=money_transfer`;
  const gpayIntent = `tez://upi/pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&tid=${encodeURIComponent(referenceId)}&tr=${encodeURIComponent(referenceId)}&tn=${encodeURIComponent(referenceId)}&cu=INR`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Pay ₹${amount} | ${merchantName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:${brandColor};color:#fff;min-height:100dvh;display:flex;flex-direction:column}
.hdr{padding:12px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;background:${brandColor}}
.hdr-left{display:flex;align-items:center;gap:10px}
.logo{width:32px;height:32px;background:rgba(255,255,255,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;overflow:hidden}
.logo img{width:100%;height:100%;object-fit:cover}
.hdr-label{font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.6)}
.hdr-name{font-size:14px;font-weight:700}
.timer{font-size:13px;font-weight:800;padding:6px 14px;border-radius:12px;font-family:monospace;background:rgba(255,255,255,.1)}
.timer.urgent{background:rgba(239,68,68,.25);color:#fca5a5}
.progress{width:100%;height:2px;background:rgba(0,0,0,.2)}
.progress-bar{height:100%;background:#34d399;transition:width 1s linear}
.amt{text-align:center;padding:16px 20px 32px;background:${brandColor}}
.amt h1{font-size:42px;font-weight:900;display:flex;align-items:baseline;justify-content:center}
.amt h1 span{font-size:18px;opacity:.6;margin-right:2px}
.amt p{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,.6);margin-top:8px}
.card{flex:1;background:#fff;border-radius:28px 28px 0 0;margin-top:-16px;display:flex;flex-direction:column;color:#0f172a;overflow:hidden}
.tabs{display:flex;gap:4px;margin:20px 20px 0;padding:4px;background:#f1f5f9;border-radius:16px}
.tab{flex:1;border:none;padding:10px 8px;border-radius:12px;font-weight:800;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;background:transparent;color:#94a3b8;transition:.2s}
.tab.active{background:#fff;color:${brandColor};box-shadow:0 2px 8px rgba(0,0,0,.06)}
.content{flex:1;padding:20px;overflow-y:auto}
.tab-panel{display:none}
.tab-panel.active{display:block}
.qr-wrap{text-align:center;margin-bottom:16px}
.qr-border{display:inline-block;padding:16px;background:#fff;border:2px solid #e2e8f0;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.06)}
.qr-border img{width:180px;height:180px;border-radius:12px;display:block}
.upi-row{display:flex;align-items:center;justify-content:space-between;background:#f8fafc;padding:10px 14px;border-radius:14px;border:1px solid #e2e8f0;margin-bottom:12px}
.upi-label{font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8}
.upi-val{font-size:12px;font-weight:900;font-family:monospace}
.copy-btn{width:36px;height:36px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
.apps-label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;text-align:center;margin:12px 0 6px}
.app-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px}
.app-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:14px;text-decoration:none;font-family:inherit;font-size:9px;font-weight:700;border:none}
.app-btn.gpay{background:#fff;color:#334155;border:1px solid #e2e8f0}
.app-btn.phonepe{background:#5f259f;color:#fff}
.app-btn.paytm{background:#00BAF2;color:#fff}
.fallback{display:block;text-align:center;padding:12px;background:#f1f5f9;border-radius:14px;border:1px solid #e2e8f0;text-decoration:none;color:#475569;font-size:12px;font-weight:700;margin-bottom:8px}
.app-list{display:flex;flex-direction:column;gap:10px}
.app-list a{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:18px;text-decoration:none;font-family:inherit}
.app-icon{width:44px;height:44px;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.04);border:1px solid #f1f5f9;flex-shrink:0;font-size:22px}
.app-info p:first-child{font-weight:800;font-size:14px;margin:0}
.app-info p:last-child{font-size:10px;opacity:.7;margin:0}
.footer{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 20px;border-top:1px solid #f1f5f9;font-size:9px;font-weight:800;color:#cbd5e1;text-transform:uppercase;letter-spacing:1.5px}
.hint{font-size:10px;color:#94a3b8;text-align:center;margin-top:8px}
.card-placeholder{text-align:center;padding:40px 20px}
.card-placeholder .icon{width:64px;height:64px;background:#f1f5f9;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px}
#successOverlay{display:none;position:fixed;inset:0;z-index:100;background:rgba(15,23,42,.85);align-items:center;justify-content:center;padding:16px}
#successOverlay.show{display:flex}
.success-card{max-width:380px;width:100%;background:#fff;border-radius:36px;padding:24px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.15);position:relative;overflow:hidden;color:#0f172a}
.success-card .top-bar{position:absolute;top:0;left:0;right:0;height:4px;background:${brandColor}}
.success-check{width:80px;height:80px;background:${brandColor};color:#fff;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;margin:16px auto 20px;box-shadow:0 8px 24px rgba(16,185,129,.25)}
#expiredView{display:none;min-height:100dvh;align-items:center;justify-content:center;background:#f8fafc;padding:16px}
#expiredView.show{display:flex}
.expired-card{max-width:400px;background:#fff;border-radius:28px;padding:40px 24px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.06);color:#0f172a}
</style>
</head>
<body>
<div id="mainView">
  <div class="hdr">
    <div class="hdr-left">
      <div class="logo">
        ${brandLogo ? `<img src="${brandLogo}" alt="Logo">` : '⚡'}
      </div>
      <div><p class="hdr-label">Paying To</p><p class="hdr-name">${merchantName}</p></div>
    </div>
    <div class="timer" id="timerChip">⏱ <span id="countdown">--:--</span></div>
  </div>
  <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
  <div class="amt"><h1><span>₹</span>${amount.toLocaleString()}</h1><p>Secure UPI Payment</p></div>
  <div class="card">
    <div class="tabs">
      <button class="tab active" onclick="switchTab('qr')"><span style="font-size:16px">⊞</span>QR Code</button>
      <button class="tab" onclick="switchTab('upi')"><span style="font-size:16px">@</span>UPI App</button>
      <button class="tab" onclick="switchTab('card')"><span style="font-size:16px">⊟</span>Cards</button>
    </div>
    <div class="content">
      <div class="tab-panel active" id="panel-qr">
        <div class="qr-wrap"><div class="qr-border"><img src="${qrData}" alt="QR"></div></div>
        <div class="upi-row">
          <div><p class="upi-label">UPI ID</p><p class="upi-val">${maskedUpi}</p></div>
          <button class="copy-btn" onclick="copyUpi()">📋</button>
        </div>
        <p class="apps-label">Or pay directly via</p>
        <div class="app-grid">
          <a href="${gpayIntent}" class="app-btn gpay"><span style="font-size:20px">💳</span>Google Pay</a>
          <a href="phonepe://native?data=${Buffer.from(JSON.stringify({contact:{cbsName:"",nickName:"",vpa:merchantUpi,type:"VPA"},p2pPaymentCheckoutParams:{note:referenceId,isByDefaultKnownContact:true,enableSpeechToText:false,allowAmountEdit:false,showQrCodeOption:false,disableViewHistory:true,shouldShowUnsavedContactBanner:false,isRecurring:false,checkoutType:"DEFAULT",transactionContext:"p2p",initialAmount:Math.floor(amount*100),disableNotesEdit:true,showKeyboard:false,currency:"INR",shouldShowMaskedNumber:true}})).toString("base64")}&id=p2ppayment" class="app-btn phonepe"><span style="font-size:20px">📲</span>PhonePe</a>
          <a href="${paytmIntent}" class="app-btn paytm"><span style="font-size:20px">💰</span>Paytm</a>
        </div>
        <a href="${upiDeepLink}" class="fallback">@ Other UPI App</a>
        <p class="hint">Scan with any UPI app to pay</p>
      </div>
      <div class="tab-panel" id="panel-upi">
        <h3 style="font-size:18px;font-weight:900;text-align:center;margin-bottom:4px">Pay ₹${amount.toLocaleString()} via UPI</h3>
        <p style="font-size:12px;color:#64748b;text-align:center;margin-bottom:16px">Choose your preferred app</p>
        <div class="app-list">
          <a href="${gpayIntent}" style="background:#fff;color:#334155;border:1px solid #e2e8f0">
            <div class="app-icon">💳</div><div class="app-info"><p>Google Pay</p><p>Tap to open</p></div>
          </a>
          <a href="phonepe://native?data=${Buffer.from(JSON.stringify({contact:{cbsName:"",nickName:"",vpa:merchantUpi,type:"VPA"},p2pPaymentCheckoutParams:{note:referenceId,isByDefaultKnownContact:true,enableSpeechToText:false,allowAmountEdit:false,showQrCodeOption:false,disableViewHistory:true,shouldShowUnsavedContactBanner:false,isRecurring:false,checkoutType:"DEFAULT",transactionContext:"p2p",initialAmount:Math.floor(amount*100),disableNotesEdit:true,showKeyboard:false,currency:"INR",shouldShowMaskedNumber:true}})).toString("base64")}&id=p2ppayment" style="background:#5f259f;color:#fff;border:1px solid #5f259f">
            <div class="app-icon">📲</div><div class="app-info"><p>PhonePe</p><p>Tap to open</p></div>
          </a>
          <a href="${paytmIntent}" style="background:#00BAF2;color:#fff;border:1px solid #00BAF2">
            <div class="app-icon">💰</div><div class="app-info"><p>Paytm</p><p>Tap to open</p></div>
          </a>
          <a href="${upiDeepLink}" style="background:#f8fafc;color:#475569;border:1px solid #e2e8f0">
            <div class="app-icon" style="font-size:18px;color:#4f46e5">@</div><div class="app-info"><p>Other UPI App</p><p style="color:#94a3b8">BHIM, Cred, Jupiter</p></div>
          </a>
        </div>
      </div>
      <div class="tab-panel" id="panel-card">
        <div class="card-placeholder">
          <div class="icon">🔒</div>
          <p style="font-weight:900;font-size:18px;margin-bottom:6px">Coming Soon</p>
          <p style="color:#64748b;font-size:13px">Card payments being optimized.</p>
          <button onclick="switchTab('qr')" style="margin-top:16px;padding:10px 24px;background:#f1f5f9;border:none;border-radius:12px;font-size:12px;font-weight:700;color:#475569;cursor:pointer">Back to UPI</button>
        </div>
      </div>
    </div>
    <div class="footer"><span>🛡️ PCI DSS</span><span style="width:4px;height:4px;background:#cbd5e1;border-radius:50%;display:inline-block"></span><span>🔒 256-bit SSL</span></div>
  </div>
</div>

<div id="successOverlay">
  <div class="success-card">
    <div class="top-bar"></div>
    <div class="success-check">✓</div>
    <p style="font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:3px;margin-bottom:6px">Payment Confirmed</p>
    <h2 style="font-size:40px;font-weight:900;margin-bottom:20px">₹${amount.toLocaleString()}</h2>
    <div style="background:#f8fafc;border-radius:20px;padding:20px;text-align:left;border:1px solid #f1f5f9">
      <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8">Payer</p>
      <p id="payerDisplay" style="font-weight:700;font-size:14px;margin-bottom:10px">Verified</p>
      <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8">UTR</p>
      <p id="utrDisplay" style="font-weight:700;font-size:12px;color:#10b981;font-family:monospace;margin-bottom:10px">Verified</p>
      <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8">Status</p>
      <p style="font-weight:700;font-size:12px;color:${brandColor}">✅ Approved</p>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin-top:16px">Auto-redirecting...</p>
  </div>
</div>

<div id="expiredView">
  <div class="expired-card">
    <div style="width:64px;height:64px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px">⚠️</div>
    <h2 style="font-size:22px;font-weight:800;margin-bottom:8px">Payment Expired</h2>
    <p style="color:#64748b;font-size:14px">This payment link has expired.</p>
  </div>
</div>

<script>
// === PURE VANILLA JS — NO FRAMEWORK ===
var TOKEN = "${token}";
var STATUS = "${status}";
var EXPIRE_AT = "${expireAt}";
var TOTAL_SECS = 600;

// Timer
var timeLeft = TOTAL_SECS;
if (EXPIRE_AT) {
  var diff = new Date(EXPIRE_AT).getTime() - Date.now();
  timeLeft = diff > 0 ? Math.floor(diff / 1000) : 0;
  TOTAL_SECS = timeLeft > 0 ? timeLeft : 1;
}

function updateTimer() {
  var el = document.getElementById("countdown");
  var chip = document.getElementById("timerChip");
  var bar = document.getElementById("progressBar");
  if (timeLeft <= 0) {
    el.textContent = "0:00";
    bar.style.width = "0%";
    showExpired();
    return;
  }
  timeLeft--;
  var m = Math.floor(timeLeft / 60);
  var s = timeLeft % 60;
  el.textContent = m + ":" + (s < 10 ? "0" + s : s);
  bar.style.width = ((timeLeft / TOTAL_SECS) * 100) + "%";
  if (timeLeft < 60) chip.classList.add("urgent");
}

// Initial display
(function(){
  var m = Math.floor(timeLeft / 60);
  var s = timeLeft % 60;
  document.getElementById("countdown").textContent = m + ":" + (s < 10 ? "0" + s : s);
  document.getElementById("progressBar").style.width = ((timeLeft / TOTAL_SECS) * 100) + "%";
})();

// Start timer immediately
if (STATUS === "PENDING" && timeLeft > 0) {
  setInterval(updateTimer, 1000);
}

// Polling — every 1 second
if (STATUS === "PENDING") {
  setInterval(function() {
    fetch("/api/pay/status?token=" + TOKEN + "&_t=" + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.data && data.data.payment_status === "SUCCESS") {
          showSuccess(data.data.payer_name, data.data.utr, data.data.redirect_url);
        } else if (data.data && data.data.payment_status === "EXPIRED") {
          showExpired();
        }
      })
      .catch(function(e) { console.error("Poll err:", e); });
  }, 1000);
}

function showSuccess(payer, utr, redirect) {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("successOverlay").classList.add("show");
  if (payer) document.getElementById("payerDisplay").textContent = payer;
  if (utr) document.getElementById("utrDisplay").textContent = utr;
  if (redirect) setTimeout(function() { window.location.href = redirect; }, 5000);
}

function showExpired() {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("expiredView").classList.add("show");
}

if (STATUS === "EXPIRED" || timeLeft <= 0) showExpired();
if (STATUS === "SUCCESS") showSuccess(null, null, null);

// Tab switching
function switchTab(id) {
  document.querySelectorAll(".tab").forEach(function(t) { t.classList.remove("active"); });
  document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
  event.currentTarget.classList.add("active");
  document.getElementById("panel-" + id).classList.add("active");
}

// Copy UPI
function copyUpi() {
  navigator.clipboard.writeText("${merchantUpi}");
  event.currentTarget.textContent = "✓";
  setTimeout(function() { event.currentTarget.textContent = "📋"; }, 2000);
}
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
