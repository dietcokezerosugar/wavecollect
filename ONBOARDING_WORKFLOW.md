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

## Step 6: How the System Works

- **The Hub:** This is the brain that manages all payments.
- **Nodes:** These are small helpers that watch for money entering the bank.
- **Statuses:**
  - **PENDING:** Waiting for the customer to pay.
  - **SUCCESS:** Payment received!
  - **EXPIRED:** The customer took too long to pay (over 15 minutes).

---

## Step 7: How to Use the API

### 1. Create a Payment
Send a request to our system when a customer wants to pay.

**URL:** `https://api.payxmint.com/api/v1/create-intent`

**What to send:**
- `amount`: The price (e.g., 500.00).
- `order_id`: Your own ID for this order.
- `metadata`: Any extra info you want to save.

**What you get back:**
- `checkout_url`: Send the customer here so they can pay.
- `upi_link`: Use this if you want to open a UPI app directly.

### 2. Check Payment Status
If you want to check if a payment is done, use:
`GET https://api.payxmint.com/api/v1/check-status?token={token}`

---

## Step 8: Security & Rules

### 1. Idempotency (Safe Retries)
Always send a `Idempotency-Key` header. This makes sure that if you send the same request twice by mistake, we only process it once.

### 2. Webhook Signatures
When we send a notification to your server, we include a secret code (Signature) in the header. You should check this code to make sure the message actually came from us.

---

## Step 9: Solving Problems

- **Automatic Matching:** Most payments are matched automatically in seconds.
- **Manual Check:** If a customer pays the wrong amount, it will show up in your dashboard under **"Unmatched"**. You can click it to manually mark the order as paid.

---

**Final Checklist:**
- [x] Account is **APPROVED**.
- [x] Your server IP is **Whitelisted**.
- [x] Your **Webhook URL** is saved.
- [x] You have your **Secret API Key**.

Need help? Email us at [support@payxmint.com](mailto:support@payxmint.com).
