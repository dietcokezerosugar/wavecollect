# WaveCollect UPI Integration Strategy

This document outlines the technical design of the UPI deep links and QR code generation logic used in WaveCollect to ensure 100% compatibility across GPay, PhonePe, and Paytm.

## 1. QR Code Generation (Maximum Compatibility)

The QR code relies on a standard `upi://pay` URI. Scanners (especially Google Pay) are extremely sensitive to URI formatting.

### The "Barebones" Strategy
We use a minimalist parameter set for the QR code. Adding extra parameters like `tid` (Transaction ID) or `tr` (Transaction Ref) often causes banks to attempt a "Merchant Validation" which fails for standard Business/Personal VPAs.

**Format:**
`upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR&tn={note}`

| Parameter | Purpose | Requirement |
|---|---|---|
| `pa` | Payee Address (VPA) | Mandatory |
| `pn` | Payee Name | Mandatory (Must be `%20` encoded) |
| `am` | Amount | Mandatory (Strictly 2 decimal places) |
| `cu` | Currency Code | **Mandatory** (`INR`). Apps fail without this. |
| `tn` | Transaction Note | Optional but used for Order ID matching |

### Critical: Space Encoding (`%20` vs `+`)
*   **Problem:** Standard `URLSearchParams` in JavaScript encodes spaces as `+`.
*   **Issue:** Google Pay's QR scanner often breaks on `+` and shows "Security Violation" or "Action not allowed".
*   **Solution:** Manually construct the URI string using `encodeURIComponent()` to force `%20` encoding for spaces.

---

## 2. App-Specific Intent Buttons

Intent buttons bypass standard URI scanners and communicate directly with the installed apps. Because they are more robust, they can handle complex parameters.

### PhonePe Intent
PhonePe uses a Base64-encoded JSON payload. This allows for a "locked" checkout experience where the user cannot edit the amount or note.

**Structure:**
`phonepe://native?data={base64_json}&id=p2ppayment`

**Payload Example:**
```json
{
  "contact": { "vpa": "merchant@upi", "type": "VPA" },
  "p2pPaymentCheckoutParams": {
    "note": "ORDER_123",
    "initialAmount": 10000,
    "allowAmountEdit": false,
    "currency": "INR"
  }
}
```

### Paytm Intent
Paytm uses a custom deep link scheme (`paytmmp://`) which allows the inclusion of the Merchant Category Code (`mc`) and other tracking parameters.

**Format:**
`paytmmp://cash_wallet?pa={vpa}&pn={name}&am={amount}&cu=INR&mc=4722&tr={orderId}`

---

## 3. Implementation Locations

*   **Link Generation:** `src/services/payment-engine/PaymentEngine.ts` (Generates the `upiDeepLink` stored in the database).
*   **Checkout Rendering:** `src/app/checkout/[token]/route.ts` (Generates the QR image and constructs the app-specific buttons).

## 4. Troubleshooting Fixes

| Issue | Root Cause | Fix |
|---|---|---|
| QR scans but "App not allowed" | Missing `cu=INR` or invalid `tid/tr` | Use Barebones format; omit `tid/tr`. |
| GPay says "Security Error" | Spaces encoded as `+` | Use `encodeURIComponent` for `%20`. |
| "Session Expired" after Success | Race condition in JS intervals | Added `isResolved` flag to gate timer/poller. |
