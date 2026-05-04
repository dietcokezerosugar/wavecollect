import { prisma } from "@/lib/prisma";
import { logApi } from "@/lib/log";
import axios from "axios";
import { WalletService } from "../wallet/WalletService";
import { NotificationService } from "../notifications/NotificationService";

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
            amount: txn.amount // STRICTOR CHECK
          },
          include: { merchant: true, apiKey: true },
        });

        if (!intent) {
          // Check if this was a partial payment or duplicate
          const potentialIntent = await tx.paymentIntent.findFirst({
            where: { referenceId: txn.note }
          });

          if (potentialIntent) {
            const reason = potentialIntent.amount !== txn.amount 
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

        // Update API key usage
        await tx.apiKey.update({
          where: { id: intent.apiKeyId },
          data: { usedAmount: { increment: txn.amount } },
        });

        // SaaS: Process Wallet (Recharge vs Fee)
        if (intent.isRecharge) {
          await WalletService.credit(
            intent.merchantId,
            txn.amount,
            `Wallet Top-up (Ref: ${intent.referenceId})`,
            "RECHARGE",
            intent.id,
            tx
          );
        } else {
          const fee = (txn.amount * intent.merchant.commissionRate) / 100;
          if (fee > 0) {
            await WalletService.debit(
              intent.merchantId,
              fee,
              `Fee for Txn ${intent.referenceId} (${intent.merchant.commissionRate}%)`,
              "TRANSACTION",
              intent.id,
              tx // Pass transaction client!
            );
          }
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

      // ── SaaS: Trigger Notifications ──────────────────────────────────
      NotificationService.notifyTransactionSuccess(
        intent.merchantId,
        txn.amount,
        intent.referenceId,
        newTxn.utr || undefined
      ).catch(e => console.error("[NOTIFY_ERR]", e.message));

      // ── 5. Trigger webhook (async, non-blocking) ─────────────────────
      if (intent.merchant.webhookUrl) {
        import("../notifications/WebhookService").then(({ WebhookService }) => {
          WebhookService.dispatch(intent.merchantId, intent.merchant.webhookUrl!, {
            event: "payment.success",
            status: "SUCCESS",
            amount: intent.amount,
            txn_id: newTxn.externalId,
            reference_id: intent.referenceId,
            utr: newTxn.utr,
            payer_name: txn.payerName,
            payer_upi: txn.payerUpiId,
            timestamp: new Date().toISOString(),
          });
        }).catch((err) =>
          logApi("ERROR", "Webhook dispatch failed", intent.merchantId, { intentId: intent.id, error: err.message })
        );
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
