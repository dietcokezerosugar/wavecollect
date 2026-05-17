# 🔌 WaveCollect API Reference

All API requests must be made over HTTPS. The base URL depends on your environment.

## Authentication
Merchant APIs require an `x-api-key` header.
Admin APIs require a session cookie (NextAuth).

---

## 1. Merchant APIs

### Create Payment Intent
`POST /api/v1/create-intent`

**Headers:**
- `x-api-key`: Your Merchant API Key
- `Content-Type`: application/json

**Body:**
```json
{
  "amount": 500.00,
  "order_id": "ORD-12345",
  "customer_mobile": "9999988888",
  "redirect_url": "https://merchant.com/callback",
  "is_recharge": false
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "payment_url": "https://payxmint.com/pay/tok_abc123",
  "upi_intent": "upi://pay?pa=merchant@upi&am=500...",
  "payment_token": "tok_abc123"
}
```

### Check Payment Status
`GET /api/v1/check-status?order_id=ORD-12345`

---

## 2. Webhooks

When a payment is matched, WaveCollect sends a POST request to your configured `webhookUrl`.

**Headers:**
- `X-Wave-Signature`: HMAC-SHA256 signature
- `Content-Type`: application/json

**Payload:**
```json
{
  "event": "payment.success",
  "status": "SUCCESS",
  "order_id": "ORD-12345",
  "amount": 500.00,
  "utr": "412345678901",
  "payer_name": "JOHN DOE",
  "timestamp": "2026-05-12T10:00:00Z"
}
```

---

## 3. Internal Admin APIs (RESTful)

| Endpoint | Method | Action |
|---|---|---|
| `/api/admin/gateways` | `GET` | List all VPAs |
| `/api/admin/gateways` | `POST` | Update limits/risk tier |
| `/api/admin/settlements` | `GET` | View custody ledger |
| `/api/admin/settlements` | `POST` | Release holds / Trigger T+1 |
| `/api/admin/reconciliation` | `POST` | Manual match floating txn |
| `/api/cron/purge` | `POST` | Purge logs older than 30 days |

---

## 4. Error Codes

| Code | Meaning |
|---|---|---|
| `401` | Invalid API Key |
| `403` | IP not whitelisted |
| `429` | Rate limit exceeded |
| `ACCOUNT_LIMIT_REACHED` | No available VPAs for this amount |
| `RISK_REJECTED` | Transaction blocked by risk engine |
