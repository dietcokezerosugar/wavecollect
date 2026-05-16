# How to Start Using PayxMint (WaveCollect)

Follow these simple steps to set up your account and start taking payments.

---

## Step 1: Create Your Account
1. Go to [https://payxmint.com/register](https://payxmint.com/register).
2. Sign up with your email.
3. Check your email to verify your account and log in.

---

## Step 2: Fill Your Business Details
1. Go to the **Quick Setup** page: [https://payxmint.com/dashboard/quick-setup](https://payxmint.com/dashboard/quick-setup).
2. Fill in all the boxes (Business Name, Phone Number, etc.).
3. Click **Save**.
4. Click the **"Apply for Whitelist"** button at the bottom. This tells our team to check your account.

---

## Step 3: Secure Your Server (IP Whitelist)
1. Go to the **IP Whitelist** page: [https://payxmint.com/dashboard/ip-whitelist](https://payxmint.com/dashboard/ip-whitelist).
2. **Read the agreement** and click the **Check Box** to agree.
3. Type in your server's IP address (where your website is hosted) and click **Whitelist IP**.
   - *Note: If your IP is not here, your API calls will not work.*

---

## Step 4: Set Up Your Webhook
1. Go to the **Webhooks** page: [https://payxmint.com/dashboard/webhooks](https://payxmint.com/dashboard/webhooks).
2. Type in the URL where you want us to send payment notifications (e.g., `https://yoursite.com/payment-callback`).
3. Click **Save**.

---

## Step 5: Join the Payment Pool
1. Go to the **Merchant Accounts** page: [https://payxmint.com/dashboard/merchant-accounts](https://payxmint.com/dashboard/merchant-accounts).
2. Look for **"Platform Pool"**.
3. Choose **"Use Platform Pool Only"**.
4. Click **"Apply for Platform Pool"**.
5. **Wait for Approval:** Our team will check your request. Once it says **APPROVED**, you can start taking payments.

---

## Step 6: How the System Works (The Technical Part)

- **The Hub (Intents Engine):** This is the central brain. It manages payment states, stores your custom metadata, and decides which bank account should receive the money.
- **Nodes (Discovery Fleet):** These are small workers that watch bank apps (GPay/PhonePe) in real-time. When they see a transaction, they tell the Hub instantly.
- **Payment States:**
  - `PENDING`: Waiting for the customer to pay.
  - `SUCCESS`: Money is in the bank and matched to your order.
  - `EXPIRED`: The 15-minute timer ran out.
  - `FLAGGED`: Something is wrong (e.g., duplicate UTR). Our staff will check it.

---

## Step 7: API Reference (Full Details)

### 1. Create a Payment Intent
Call this when your customer is ready to pay.

**URL:** `POST https://api.payxmint.com/api/v1/create-intent`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | number | Yes | The amount to collect (e.g., 500.00). |
| `order_id` | string | Yes | Your unique ID for this order. |
| `metadata` | object | No | Up to 20 key-value pairs (JSON). |
| `customer_email` | string | No | For sending receipts. |

**Response Example:**
```json
{
  "id": "pi_88990011",
  "status": "pending",
  "amount": 500.00,
  "checkout_url": "https://payxmint.com/pay/tok_65c3b...",
  "upi_link": "upi://pay?pa=merchant@bank&am=500...",
  "payment_token": "tok_65c3b...",
  "metadata": { "order_type": "retail" }
}
```

### 2. Check Payment Status
Check if a specific payment is done.

**URL:** `GET https://api.payxmint.com/api/v1/check-status?token={token}`

**Response (Success):**
```json
{
  "status": "SUCCESS",
  "utr": "412239102931",
  "payer_name": "John Doe",
  "paid_at": "2024-05-16T12:00:00Z"
}
```

---

## Step 8: Webhooks & Safety

### 1. Webhook Notification
We send this JSON to your URL when a payment succeeds.

**Payload:**
```json
{
  "event": "payment.success",
  "id": "evt_776655",
  "data": {
    "order_id": "INV-99",
    "amount": 500.00,
    "utr": "412239102931",
    "metadata": { "ref": "abc-123" }
  }
}
```

### 2. Checking the Signature (Safety First)
To make sure the webhook is really from us, check the `X-PayxMint-Signature` header.

**The Logic:**
1. Take the **Raw Request Body** (the JSON text).
2. Create a hash using **HMAC-SHA256** with your **Webhook Secret**.
3. Compare your hash with the one in the header.

### 3. Idempotency (Preventing Duplicates)
Always include the `Idempotency-Key` header in your requests.
- If you send the same key twice within 24 hours, we will return the same result without charging the customer again.

---

## Step 9: Error Codes

If something goes wrong, we return a structured error:

| Code | Meaning |
| :--- | :--- |
| `401 Unauthorized` | Your API Key is wrong or missing. |
| `403 Forbidden` | Your Server IP is not whitelisted. |
| `409 Conflict` | That `order_id` or `Idempotency-Key` was already used. |
| `429 Rate Limit` | You are sending too many requests too fast. |
| `503 Service Unavailable` | No VPA accounts are available in the pool right now. |

**Example Error:**
```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "parameter_missing",
    "message": "The 'amount' parameter is required."
  }
}
```

---

## Step 10: Troubleshooting

- **Unmatched Payments:** If a customer pays but the amount is wrong, it goes to the "Unmatched" list in your dashboard.
- **Manual Binding:** You can manually link an unmatched payment to an order. This will trigger the webhook instantly.
- **Node Sync:** If your node is "Offline", automatic matching stops. Check your GPay sync status in the dashboard.

---

**Final Production Checklist:**
- [x] Account is **APPROVED** for Platform Pool.
- [x] **Idempotency-Key** is sent with every request.
- [x] **Webhook Signature** is verified on your server.
- [x] **IP Whitelist** includes all your production server IPs.
- [x] **Secret Key** is stored safely (not in your code).

Need help? Email our tech team at [infra@payxmint.com](mailto:infra@payxmint.com).
