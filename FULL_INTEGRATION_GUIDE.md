# WaveCollect: Complete Merchant Integration Guide

This guide provides a step-by-step walkthrough for onboarding onto the WaveCollect platform, configuring your infrastructure, and successfully integrating our API to start accepting real-time UPI payments.

---

## Phase 1: Account Creation & Onboarding

### 1. Registration
1. Navigate to [https://payxmint.com/register](https://payxmint.com/register).
2. Enter your **Full Name**, **Work Email**, and a secure **Password**.
3. Click **"Create Account"**.

### 2. Dashboard Access
1. Once logged in, you will be redirected to the **Main Dashboard**.
2. Take a moment to familiarize yourself with the sidebar:
   - **Analytics:** Real-time volume and settlement metrics.
   - **Merchant Accounts:** Where you link your UPI/GPay accounts.
   - **API Keys:** Your integration credentials.
   - **Webhooks:** For receiving payment notifications.

---

## Phase 2: Configuration & Infrastructure Setup

Before you can take payments, you must link your bank accounts and configure your security settings.

### 1. Linking Merchant Accounts (VPA Pool)
WaveCollect uses your own UPI accounts to receive funds directly.
1. Go to **Merchant Accounts** > **Add New Account**.
2. Enter the **VPA (UPI ID)** (e.g., `shopname@hdfcbank`).
3. Enter the **Merchant Name** as registered with your bank.
4. **Linking GPay Business:**
   - To enable automated discovery, you must link your GPay Business account.
   - Follow the on-screen instructions to authorize the **Sync Node** to monitor your bank's push notifications.

### 2. Configuring Security (IP Whitelist)
For security, WaveCollect only accepts API requests from known IP addresses.
1. Go to **Settings** > **IP Whitelist**.
2. Add the **Public IP Address** of your production server.
3. If you are testing locally, ensure your local IP is temporarily whitelisted.

### 3. Setting up Webhooks
Webhooks are essential for real-time reconciliation.
1. Go to **Webhooks** > **Add Endpoint**.
2. Enter your **Webhook URL** (e.g., `https://api.yoursite.com/webhooks/wavecollect`).
3. Note down the **Webhook Secret Key**; you will need this to verify signatures.

---

## Phase 3: Technical API Integration

### 1. Generate API Keys
1. Go to **API Keys**.
2. Click **"Generate New Key"**.
3. **IMPORTANT:** Copy your **Secret Key** immediately. It will not be shown again.

### 2. Create a Payment Intent
When a customer is ready to checkout on your site, call the `/v1/create-intent` endpoint from your backend.

**Request:**
```bash
curl https://payxmint.com/api/v1/create-intent \
  -H "Authorization: Bearer sk_live_your_key" \
  -H "Idempotency-Key: unique_order_id_123" \
  -d amount=500.00 \
  -d order_id="ORDER_99" \
  -d metadata[customer_id]="cust_001"
```

**Response:**
```json
{
  "id": "pi_12345",
  "status": "pending",
  "checkout_url": "https://payxmint.com/pay/tok_...",
  "upi_link": "upi://pay?pa=...",
  "payment_token": "tok_..."
}
```

### 3. Redirect User to Checkout
1. Grab the `checkout_url` from the API response.
2. Redirect your customer to this URL.
3. They will see a high-conversion UPI interface with a QR code and app-intent buttons (GPay, PhonePe, etc.).

---

## Phase 4: Handling Post-Payment Logic

### 1. Verify Webhook Signature
When a payment is successful, we send a `POST` request to your webhook URL. You **must** verify the signature to ensure authenticity.

**Headers:** `X-PayxMint-Signature`

**Verification Logic (Node.js Example):**
```javascript
const crypto = require('crypto');

function verify(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}
```

### 2. Handle the Payload
If the signature is valid, update the order status in your database.
```json
{
  "event": "payment.success",
  "data": {
    "order_id": "ORDER_99",
    "amount": 500.00,
    "utr": "412239102931"
  }
}
```

---

## Phase 5: Monitoring & Maintenance

### 1. Manual Reconciliation
If a customer makes a mistake (e.g., pays the wrong amount), the transaction will appear in your dashboard as **"Unmatched"**.
- Go to **Transactions** > **Unmatched**.
- You can manually bind the transaction to the correct order to trigger the webhook.

### 2. Node Health
Check the **Node Status** on your dashboard regularly. If a node is "Offline", it means we cannot capture transactions for that specific VPA automatically until the sync is restored.

---

**Need Help?**
Contact our engineering team via the dashboard support widget or email [support@payxmint.com](mailto:support@payxmint.com).
