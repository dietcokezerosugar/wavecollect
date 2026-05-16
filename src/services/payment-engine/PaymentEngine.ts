import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { GatewayRouter } from "../routing/GatewayRouter";
import { validateIpWhitelist } from "@/lib/security";

export interface PaymentIntentOptions {
  amount: number;
  orderId: string;     // referenceId from merchant
  customerMobile?: string;
  customerEmail?: string;
  customerIp?: string;
  customerDeviceId?: string;
  apiKey: string;
  redirectUrl?: string;
  ip?: string;         // IP for whitelisting check
}

export class PaymentEngine {
  /**
   * Create a payment intent — ported from BloomXHub create_order.php
   */
  static async createIntent(options: PaymentIntentOptions) {
    const { amount, orderId, customerMobile, customerEmail, apiKey, redirectUrl, ip } = options;

    // ── 1. Validate API Key ──────────────────────────────────────────
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { merchant: { include: { gpayAccounts: true } } },
    });

    if (!keyData) {
      throw new Error("Invalid API Key");
    }

    if (keyData.isBlocked || keyData.merchant.status !== "ACTIVE") {
      throw new Error("API Key or Merchant account is blocked/suspended.");
    }

    // ── 1b. Validate IP Whitelist ────────────────────────────────────
    if (ip && !(await validateIpWhitelist(keyData.merchantId, ip))) {
      throw new Error(`SECURITY_ERROR: IP Address ${ip} is not authorized for this merchant.`);
    }

    // ── SaaS: Settlement Custody Shift ────────────
    // We no longer require pre-paid wallet balance to cover fees.
    // Fees will be deducted from the payout settlement balance.
    /*
    const isTrialActive = keyData.merchant.trialEndsAt && new Date(keyData.merchant.trialEndsAt) > new Date();
    if (!keyData.merchant.disableWallet && !isTrialActive) {
      const expectedFee = (amount * (keyData.merchant.commissionRate || 0)) / 100;
      if (keyData.merchant.walletBalance < expectedFee) {
        throw new Error(`INSUFFICIENT_FUNDS: Wallet balance...`);
      }
    }
    */

    // ── 2. Enforce Monthly Limit (BEFORE creating intent) ────────────
    if (Number(keyData.usedAmount) >= Number(keyData.monthlyLimit)) {
      throw new Error("API Key monthly limit reached. Please upgrade or wait for reset.");
    }

    // ── 3. RISK ENGINE: Customer Fingerprinting & Profiling ──────────
    // We create a unique hash of the customer's identity footprint
    const rawFingerprint = (options.customerMobile || "") + (options.customerIp || "") + (options.customerDeviceId || "");
    const fingerprint = rawFingerprint.length > 5
      ? crypto.createHash("sha256").update(rawFingerprint).digest("hex")
      : crypto.createHash("sha256").update(orderId + Date.now().toString()).digest("hex"); // Fallback to unique if no data provided

    let customer = await prisma.customer.findUnique({ where: { fingerprint } });

    if (!customer) {
      // First Time Depositor (FTD) is treated as HIGH risk
      customer = await prisma.customer.create({
        data: {
          fingerprint,
          phone: options.customerMobile || null,
          deviceId: options.customerDeviceId || null,
          ipAddress: options.customerIp || null,
          riskTier: "HIGH",
          isFTD: true,
          totalVolume: 0,
          successfulTxnCount: 0
        }
      });
    }

    // ── 4. Select Merchant GPay Account (Risk-Based Routing) ────────
    const routingResult = await GatewayRouter.selectAccount(keyData.merchantId, amount, false, customer.riskTier);

    if (!routingResult || !routingResult.account) {
      // Fallback: If High Risk pool is full, we try Mid Risk if allowed, but for MVP we strict route.
      throw new Error(`ROUTING_ERROR: No available VPAs for risk tier ${customer.riskTier} fitting this amount/limits.`);
    }

    const { account, fallbackUsed } = routingResult;

    // ── 4b. Platform Pool Quota Check ────────────────────────────────
    if (account.accountType === "PLATFORM_POOL" && Number(account.totalQuota) > 0) {
      const remaining = Number(account.totalQuota) - Number(account.usedQuota);
      if (remaining < amount) {
        throw new Error("QUOTA_EXHAUSTED: Platform account limit reached. Contact admin to increase quota.");
      }
    }

    // ── 5. Generate UPI Deep Link (exactly like BloomXHub) ───────────
    const merchantName = keyData.merchant.brandName || keyData.merchant.businessName || keyData.merchant.name;
    // Barebones UPI link for maximum compatibility across all apps (GPay, PhonePe, Paytm)
    // We use encodeURIComponent to ensure spaces are %20 (not +) and omit tid/tr/mc to avoid bank-side validation errors
    const upiDeepLink = `upi://pay?pa=${account.upiId.trim()}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`;

    // ── 6. Generate cryptographically strong payment token ────────────
    const paymentToken = crypto.randomBytes(32).toString("hex");

    // ── 7. Create Intent in DB (atomic) ──────────────────────────────
    const expireAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    try {
      const intent = await prisma.paymentIntent.create({
        data: {
          merchantId: keyData.merchantId,
          apiKeyId: keyData.id,
          amount,
          referenceId: orderId,
          customerMobile: options.customerMobile || null,
          customerEmail: options.customerEmail || null,
          customerId: customer.id,
          customerRiskTier: customer.riskTier,
          redirectUrl: redirectUrl || keyData.merchant.redirectUrl || null,
          upiDeepLink,
          paymentToken,
          expireAt,
        },
      });

      // ── 8. Log the Routing Decision ──────────────────────────────
      await prisma.routingDecision.create({
        data: {
          paymentIntentId: intent.id,
          customerRiskTier: customer.riskTier,
          ticketSize: amount <= 500 ? "SMALL" : amount <= 5000 ? "MEDIUM" : "LARGE",
          selectedPool: account.riskTier,
          selectedBank: account.name,
          fallbackUsed: fallbackUsed,
          limitsApplied: JSON.stringify({ min: account.minTicket, max: account.maxTicket, daily: account.dailyLimit })
        }
      });

      return intent;
    } catch (e: any) {
      if (e.code === 'P2002') throw new Error("Order ID already exists");
      throw e;
    }
  }

  /**
   * Create a special intent for Wallet Recharge (Billed to Admin Account)
   */
  static async createRechargeIntent(merchantId: string, amount: number) {
    const apiKey = await prisma.apiKey.findFirst({ where: { merchantId } });
    if (!apiKey) throw new Error("Merchant has no API keys.");

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new Error("Merchant not found");

    const routingResult = await GatewayRouter.selectAccount(merchantId, amount, true);
    if (!routingResult || !routingResult.account) throw new Error("No admin accounts available for recharge.");
    const { account } = routingResult;

    const orderId = `RCG_${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * 1000)}`;
    // Barebones UPI link for recharge QR
    const upiDeepLink = `upi://pay?pa=${account.upiId.trim()}&pn=PayxMint%20SaaS&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Wallet Recharge: ${merchant.name}`)}`;

    const paymentToken = crypto.randomBytes(32).toString("hex");

    return await prisma.paymentIntent.create({
      data: {
        merchantId,
        apiKeyId: apiKey.id,
        amount,
        referenceId: orderId,
        upiDeepLink,
        paymentToken,
        isRecharge: true,
        expireAt: new Date(Date.now() + 30 * 60 * 1000),
      }
    });
  }
}
