import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export interface PaymentIntentOptions {
  amount: number;
  orderId: string;     // referenceId from merchant
  customerMobile?: string;
  customerEmail?: string;
  apiKey: string;
  redirectUrl?: string;
}

export class PaymentEngine {
  /**
   * Create a payment intent — ported from BloomXHub create_order.php
   */
  static async createIntent(options: PaymentIntentOptions) {
    const { amount, orderId, customerMobile, customerEmail, apiKey, redirectUrl } = options;

    // ── 1. Validate API Key ──────────────────────────────────────────
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { merchant: { include: { gpayAccounts: true } } },
    });

    if (!keyData) {
      throw new Error("Invalid API Key");
    }

    if (keyData.isBlocked) {
      throw new Error("API Key is blocked");
    }

    // ── 2. Enforce Monthly Limit (BEFORE creating intent) ────────────
    if (keyData.usedAmount >= keyData.monthlyLimit) {
      throw new Error("API Key monthly limit reached. Please upgrade or wait for reset.");
    }

    // ── 3. Duplicate Order ID check ──────────────────────────────────
    const existing = await prisma.paymentIntent.findUnique({
      where: { referenceId: orderId },
    });
    if (existing) {
      throw new Error("Order ID already exists");
    }

    // ── 4. Select Merchant GPay Account (Enforce limits & Randomize) ─
    const allAccounts = keyData.merchant.gpayAccounts;
    
    if (allAccounts.length === 0) {
      throw new Error("ROUTING_ERROR: No Google Pay accounts linked to this merchant.");
    }

    const activeAccounts = allAccounts.filter(a => {
      if (a.status !== "ACTIVE") return false;
      if (a.monthlyLimit > 0 && a.usedAmount >= a.monthlyLimit) return false;
      return true;
    });
 
    if (activeAccounts.length === 0) {
      const atLimit = allAccounts.some(a => a.monthlyLimit > 0 && a.usedAmount >= a.monthlyLimit);
      if (atLimit) {
        throw new Error("ROUTING_ERROR: All linked accounts have reached their monthly processing limits.");
      } else {
        throw new Error("ROUTING_ERROR: All linked accounts are currently set to INACTIVE.");
      }
    }
    const account = activeAccounts[Math.floor(Math.random() * activeAccounts.length)];

    // ── 5. Generate UPI Deep Link (exactly like BloomXHub) ───────────
    const merchantName = keyData.merchant.businessName || keyData.merchant.name;
    const upiParams = new URLSearchParams({
      pa: account.upiId,
      pn: merchantName,
      am: amount.toFixed(2),
      tid: orderId,
      tr: orderId,
      tn: `Pay ${orderId}`,
      cu: "INR",
    });
    const upiDeepLink = `upi://pay?${upiParams.toString()}`;

    // ── 6. Generate QR Code as base64 data URI ───────────────────────
    const qrData = await QRCode.toDataURL(upiDeepLink, { width: 300, margin: 2 });

    // ── 7. Generate payment token (md5 of order_id + timestamp + random)
    //    exactly like BloomXHub: md5($order_id . time() . rand(1000,9999))
    const tokenString = orderId + Date.now().toString() + Math.floor(1000 + Math.random() * 9000).toString();
    const paymentToken = crypto.createHash("md5").update(tokenString).digest("hex");

    // ── 8. Create Intent in DB (atomic) ──────────────────────────────
    const expireAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const intent = await prisma.paymentIntent.create({
      data: {
        merchantId: keyData.merchantId,
        apiKeyId: keyData.id,
        amount,
        referenceId: orderId,
        customerMobile: customerMobile || null,
        customerEmail: customerEmail || null,
        redirectUrl: redirectUrl || keyData.merchant.redirectUrl || null,
        upiDeepLink,
        qrData,
        paymentToken,
        expireAt,
      },
    });

    return intent;
  }
}
