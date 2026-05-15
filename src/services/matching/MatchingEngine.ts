import { prisma } from "@/lib/prisma";
import { logApi } from "@/lib/log";
import axios from "axios";
import { WalletService } from "../wallet/WalletService";
import { NotificationService } from "../notifications/NotificationService";
import { WebhookService } from "../webhook/WebhookService";
import { GatewayRouter } from "../routing/GatewayRouter";

export class MatchingEngine {
  /**
   * Called when the verification engine detects a new transaction.
   * Matches it to a pending PaymentIntent by amount + reference (note).
   * Must be idempotent — a transaction can match ONLY one intent.
   */
  static async onTransactionDetected(txn: {
    externalId: string;
    utr?: string;
    amount: number;
    payerName?: string;
    payerUpiId?: string;
    note?: string;
    timestamp?: string;
  }): Promise<boolean> {
    console.log(`[MatchingEngine] Processing txn: ${txn.externalId} amount=${txn.amount}`);

    // ── 1. Save the transaction (Idempotent) ─────────────────────────
    let newTxn;
    try {
      newTxn = await prisma.transaction.create({
        data: {
          externalId: txn.externalId,
          utr: txn.utr || null,
          amount: txn.amount,
          payerName: txn.payerName || null,
          payerUpiId: txn.payerUpiId || null,
          note: txn.note || null,
          timestamp: txn.timestamp ? new Date(txn.timestamp) : new Date(),
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') return false; // Already exists, skip
      throw e;
    }

    // ── 2. Find and update matching intent (STRICT MATCH: NOTE + AMOUNT) 
    if (!txn.note) return true; // Saved but no match possible without note

    try {
      const matchResult = await prisma.$transaction(async (tx) => {
        const intent = await tx.paymentIntent.findFirst({
          where: { 
            status: "PENDING", 
            referenceId: txn.note,
            amount: txn.amount, // STRICT CHECK
            OR: [
              { expireAt: null },
              { expireAt: { gte: new Date() } }
            ]
          },
          include: { merchant: true, apiKey: true },
        });

        if (!intent) {
          // Check if this was a partial payment or duplicate
          const potentialIntent = await tx.paymentIntent.findFirst({
            where: { referenceId: txn.note }
          });

          if (potentialIntent) {
            const reason = Number(potentialIntent.amount) !== txn.amount 
              ? `Amount mismatch: expected ₹${potentialIntent.amount}, got ₹${txn.amount}`
              : `Order already in status: ${potentialIntent.status}`;
            
            await logApi("WARNING", `Floating payment detected (${reason})`, potentialIntent.merchantId, { 
              txnId: txn.externalId, 
              note: txn.note 
            });
          }
          return null;
        }

        // Mark SUCCESS
        await tx.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: "SUCCESS",
            transactionId: newTxn.id,
            payerName: txn.payerName || null,
            payerUpiId: txn.payerUpiId || null,
          },
        });

        // ── RISK ENGINE: Auto-Graduation ─────────────────────────────────
        let currentCustomerRiskTier = "HIGH";
        if (intent.customerId) {
          const updatedCustomer = await tx.customer.update({
            where: { id: intent.customerId },
            data: {
              successfulTxnCount: { increment: 1 },
              totalVolume: { increment: txn.amount },
              isFTD: false,
              lastTxnAt: new Date(),
            }
          });

          // Graduation Logic: High → Mid at 26 txns, Mid → Low at 51
          let newTier = updatedCustomer.riskTier;
          if (updatedCustomer.successfulTxnCount >= 51) {
            newTier = "LOW";
          } else if (updatedCustomer.successfulTxnCount >= 26) {
            newTier = "MID";
          }

          if (newTier !== updatedCustomer.riskTier) {
            await tx.customer.update({
              where: { id: updatedCustomer.id },
              data: { riskTier: newTier }
            });
            await logApi("INFO", `Customer graduated to ${newTier} risk tier`, intent.merchantId, { customerId: updatedCustomer.id, count: updatedCustomer.successfulTxnCount });
          }
          
          // Use the CURRENT (possibly graduated) tier for settlement decisions
          currentCustomerRiskTier = newTier;
        }

        // Update API key usage
        await tx.apiKey.update({
          where: { id: intent.apiKeyId },
          data: { usedAmount: { increment: txn.amount } },
        });

        // SaaS: Process Settlement Lifecycle
        if (intent.isRecharge) {
          // Recharges still directly credit the pre-paid wallet if someone is using it
          await WalletService.credit(
            intent.merchantId,
            txn.amount,
            `Wallet Top-up (Ref: ${intent.referenceId})`,
            "RECHARGE",
            intent.id,
            tx
          );
        } else {
          // Settlement Custody Shift
          // Uses the FRESH risk tier (after graduation) for accurate hold decisions
          const isHighRisk = currentCustomerRiskTier === "HIGH";
          
          await tx.settlement.create({
            data: {
              merchantId: intent.merchantId,
              totalAmount: txn.amount,
              holdAmount: isHighRisk ? txn.amount : 0,
              releasedAmount: 0,
              status: isHighRisk ? "HELD" : "UNSETTLED",
            }
          });
          
          // Note: The agent commission log from WalletService.debit is bypassed here.
          // In a custody model, agent commissions are calculated during the Settlement Release batch.
        }

        return intent;
      });

      if (!matchResult) {
        await logApi("WARNING", "No matching intent for note", undefined, { txnId: txn.externalId, note: txn.note });
        return true;
      }

      const intent = matchResult;
      console.log(`[MatchingEngine] MATCH! Intent ${intent.id} ← Txn ${txn.externalId}`);

      await logApi("INFO", "Payment matched and verified", intent.merchantId, {
        intentId: intent.id,
        txnId: newTxn.externalId,
        amount: txn.amount,
        payer: txn.payerName,
      });

      // ── BUG FIX: Update VPA usage counters (daily/weekly/monthly + txn count) ──
      // Find which GPay account was used via the UPI deep link
      if (intent.upiDeepLink) {
        const upiMatch = intent.upiDeepLink.match(/pa=([^&]+)/);
        if (upiMatch) {
          const usedUpi = decodeURIComponent(upiMatch[1]);
          const gpayAccount = await prisma.googlePayAccount.findFirst({
            where: { upiId: usedUpi, merchantId: intent.merchantId }
          });
          if (gpayAccount) {
            await GatewayRouter.recordUsage(gpayAccount.id, txn.amount);
          }
        }
      }

      // ── SaaS: Trigger Notifications ──────────────────────────────────
      NotificationService.notifyTransactionSuccess(
        intent.merchantId,
        txn.amount,
        intent.referenceId,
        newTxn.utr || undefined
      ).catch(e => console.error("[NOTIFY_ERR]", e.message));

      // ── 5. Trigger webhook (async, non-blocking via Queue) ───────────
      if (intent.merchant.webhookUrl) {
        WebhookService.queueEvent(intent.merchantId, "payment.success", {
          event: "payment.success",
          status: "SUCCESS",
          order_id: intent.referenceId,
          amount: txn.amount,
          utr: newTxn.utr,
          payer_name: txn.payerName,
          payer_upi: txn.payerUpiId || null,
          timestamp: new Date().toISOString(),
        }).catch(e => console.error("[WEBHOOK_QUEUE_ERR]", e.message));
      }
    } catch (e: any) {
      logApi("ERROR", "Matching engine error", undefined, { txnId: txn.externalId, error: e.message });
      return true; // We saved the txn, but matching failed
    }
    
    return true; // Newly processed
  }

  /**
   * Build the redirect URL with query params (GET).
   * Called after payment success, typically from the payment page polling.
   */
  static buildRedirectUrl(
    baseUrl: string,
    data: { status: string; amount: number; txn_id: string; reference_id: string }
  ): string {
    const url = new URL(baseUrl);
    url.searchParams.set("status", data.status);
    url.searchParams.set("amount", data.amount.toString());
    url.searchParams.set("txn_id", data.txn_id);
    url.searchParams.set("reference_id", data.reference_id);
    return url.toString();
  }

}
