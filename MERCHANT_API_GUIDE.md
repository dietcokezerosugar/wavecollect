# WaveCollect Merchant API Quickstart

To integrate WaveCollect into your application, follow these steps to authenticate, create payments, and receive success notifications.

## 1. Authentication
All API requests must include your API Key in the `Authorization` header as a Bearer token.

**Header:**
`Authorization: Bearer YOUR_API_KEY`

---

## 2. Create Payment Intent
Generate a checkout URL or a direct UPI link for your customer.

**Endpoint:** `POST /api/v1/create-intent`

### Request Body (JSON)
| Field | Type | Description |
|---|---|---|
| `amount` | Number | The amount to collect (e.g., 500.00) |
| `order_id` | String | Your internal unique reference for this order |
| `redirect_url` | String | Where to send the user after successful payment |
| `customer_mobile`| String | (Optional) For risk analysis |

### Sample Request (cURL)
```bash
curl -X POST https://payxmint.com/api/v1/create-intent \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250.00,
    "order_id": "ORDER_12345",
    "redirect_url": "https://yourshop.com/success"
  }'
```

---

## 3. Advanced Features (Stripe-Level)

### Idempotency Keys
To safely retry requests without creating duplicate payments, include the `Idempotency-Key` header.
*   **Header:** `Idempotency-Key: <unique_string>`
*   **Retention:** Responses are cached for 24 hours.

### Metadata
You can store custom key-value pairs (up to 20 keys) on any payment intent. These are returned in status checks and webhooks.
```json
{
  "amount": 500,
  "order_id": "ORD-99",
  "metadata": {
    "customer_loyalty_id": "VIP-123",
    "internal_dept": "Marketing"
  }
}
```

### Events API
Audit your notification history or replay missed webhooks.
**Endpoint:** `GET /api/v1/events?limit=10`

---

## 4. Webhook Integration
When a payment is successful, WaveCollect will send a POST request to your configured Webhook URL.

### Security (HMAC Verification)
Every webhook includes a signature to prevent spoofing. You must verify this using your `Webhook Secret`.

**Headers:**
*   `X-PayxMint-Signature`: HMAC-SHA256 hash of the raw body.
*   `X-PayxMint-Event`: The event type (e.g., `payment.success`).

### Sample Webhook Payload
```json
{
  "id": "evt_123",
  "object": "event",
  "type": "payment.success",
  "data": {
    "id": "pi_123",
    "status": "SUCCESS",
    "order_id": "ORDER_12345",
    "amount": 250.00,
    "metadata": { "dept": "sales" },
    "utr": "412345678901"
  }
}
```

---

## 5. Standardized Error Objects
Our API uses standardized error codes and types for easier debugging.

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "parameter_missing",
    "message": "amount is required.",
    "param": "amount"
  }
}
```

---

## 4. Check Status (Polling)
If you missed a webhook, you can manually check the status of an order.

**Endpoint:** `GET /api/v1/check-status?order_id=ORDER_12345`

---

## 5. Integration Best Practices
1.  **Idempotency:** The `order_id` must be unique. If you send the same `order_id` twice, WaveCollect will return the existing intent instead of creating a new one.
2.  **UTR Normalization:** Our system automatically normalizes UTRs (Trim + Uppercase). You should do the same on your end for matching.
3.  **Webhook Retries:** We retry failed webhooks for up to 24 hours with exponential backoff. Ensure your endpoint returns a `200 OK` quickly.
