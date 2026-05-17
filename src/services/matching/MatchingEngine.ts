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
   * Uses a MULTI-STRATEGY matching approach:
   *   1. STRICT: note === referenceId AND amount matches
   *   2. AMOUNT+WINDOW: Same amount within a 30-minute creation window (no note required)
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
    const txnAmount = Number(txn.amount);
    console.log(`[MatchingEngine] Processing txn: ${txn.externalId} amount=₹${txnAmount} note="${txn.note || 'NULL'}" utr=${txn.utr || 'NULL'}`);

    // Normalize IDs to prevent casing/whitespace issues
    const cleanExternalId = txn.externalId.trim().toUpperCase();
    const cleanUtr = txn.utr?.trim().toUpperCase() || null;

    // ── 1. Save the transaction (Idempotent) ─────────────────────────
    let newTxn;
    try {
      newTxn = await prisma.transaction.create({
        data: {
          externalId: cleanExternalId,
          utr: cleanUtr,
          amount: txnAmount,
          payerName: txn.payerName || null,
          payerUpiId: txn.payerUpiId || null,
          note: txn.note || null,
          timestamp: txn.timestamp ? new Date(txn.timestamp) : new Date(),
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`[MatchingEngine] Duplicate txn ${txn.externalId}, skipping.`);
        return false; // Already exists, skip
      }
      throw e;
    }

    // ── 2. Multi-Strategy Matching ───────────────────────────────────
    try {
      const matchResult = await prisma.$transaction(async (tx) => {
        let intent = null;

        // ═══ STRATEGY 1: STRICT (note + amount) ═══
        if (txn.note && txn.note.trim().length > 0) {
          const cleanNote = txn.note.trim();
          
          intent = await tx.paymentIntent.findFirst({
            where: { 
              status: "PENDING", 
              referenceId: cleanNote,
              OR: [
                { expireAt: null },
                { expireAt: { gte: new Date() } }
              ]
            },
            include: { merchant: true, apiKey: true },
          });

          if (intent) {
            // Verify amount matches (with tolerance for decimal precision)
            const intentAmount = Number(intent.amount);
            if (Math.abs(intentAmount - txnAmount) > 0.01) {
              await logApi("WARNING", `Note matched but amount mismatch: expected ₹${intentAmount}, got ₹${txnAmount}`, intent.merchantId, {
                txnId: txn.externalId,
                note: cleanNote
              });
              intent = null; // Don't match if amount differs
            } else {
              console.log(`[MatchingEngine] STRATEGY 1 HIT: note="${cleanNote}" matched intent ${intent.id}`);
            }
          }
        }

        // ═══ STRATEGY 2: AMOUNT + TIME WINDOW (fallback when note is missing/wrong) ═══
        if (!intent) {
          // Look for a PENDING intent with the exact same amount, created within the last 30 minutes
          const windowStart = new Date(Date.now() - 30 * 60 * 1000);
          
          const candidates = await tx.paymentIntent.findMany({
            where: {
              status: "PENDING",
              createdAt: { gte: windowStart },
              OR: [
                { expireAt: null },
                { expireAt: { gte: new Date() } }
              ]
            },
            include: { merchant: true, apiKey: true },
            orderBy: { createdAt: 'desc' }
          });

          // Find one with matching amount (tolerance for decimal precision)
          for (const candidate of candidates) {
            const candidateAmount = Number(candidate.amount);
            if (Math.abs(candidateAmount - txnAmount) <= 0.01) {
              intent = candidate;
              console.log(`[MatchingEngine] STRATEGY 2 HIT: amount=₹${txnAmount} matched intent ${intent.id} (note was "${txn.note || 'NULL'}", expected "${intent.referenceId}")`);
              await logApi("INFO", `Fallback match: amount ₹${txnAmount} matched by time window (note mismatch: got "${txn.note || 'null'}", expected "${intent.referenceId}")`, intent.merchantId, {
                txnId: txn.externalId,
                strategy: "AMOUNT_WINDOW"
              });
              break;
            }
          }
        }

        // ═══ NO MATCH ═══
        if (!intent) {
          // Log detailed diagnostics
          const pendingCount = await tx.paymentIntent.count({ where: { status: "PENDING" } });
          console.log(`[MatchingEngine] NO MATCH for txn ${txn.externalId}: amount=₹${txnAmount}, note="${txn.note || 'NULL'}". Pending intents: ${pendingCount}`);
          
          if (txn.note) {
            const potentialIntent = await tx.paymentIntent.findFirst({
              where: { referenceId: txn.note }
            });
            if (potentialIntent) {
              const reason = Number(potentialIntent.amount) !== txnAmount 
                ? `Amount mismatch: expected ₹${potentialIntent.amount}, got ₹${txnAmount}`
                : `Order already in status: ${potentialIntent.status}`;
              await logApi("WARNING", `Floating payment detected (${reason})`, potentialIntent.merchantId, { 
                txnId: txn.externalId, 
                note: txn.note 
              });
            }
          }
          return null;
        }

        // ── MATCHED! Update intent to SUCCESS ────────────────────────
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
              totalVolume: { increment: txnAmount },
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
          data: { usedAmount: { increment: txnAmount } },
        });

        // SaaS: Process Settlement Lifecycle
        if (intent.isRecharge) {
          // Recharges still directly credit the pre-paid wallet if someone is using it
          await WalletService.credit(
            intent.merchantId,
            txnAmount,
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
              totalAmount: txnAmount,
              holdAmount: isHighRisk ? txnAmount : 0,
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
        await logApi("WARNING", "No matching intent for transaction", undefined, { txnId: txn.externalId, note: txn.note, amount: txnAmount });
        return true;
      }

      const intent = matchResult;
      console.log(`[MatchingEngine] ✅ MATCH! Intent ${intent.id} ← Txn ${txn.externalId} (₹${txnAmount})`);

      await logApi("INFO", "Payment matched and verified", intent.merchantId, {
        intentId: intent.id,
        txnId: newTxn.externalId,
        amount: txnAmount,
        payer: txn.payerName,
      });

      // ── ROBUSTNESS UPGRADE: Update VPA usage counters (daily/weekly/monthly + txn count) ──
      let gpayAccount = null;
      
      // 1. Direct secure lookup via allocatedAccountId
      if (intent.allocatedAccountId) {
        gpayAccount = await prisma.googlePayAccount.findUnique({
          where: { id: intent.allocatedAccountId }
        });
      }
      
      // 2. Bulletproof Fallback via UPI deep link regex if allocatedAccountId is missing (legacy support)
      if (!gpayAccount && intent.upiDeepLink) {
        const upiMatch = intent.upiDeepLink.match(/pa=([^&]+)/);
        if (upiMatch) {
          const usedUpi = decodeURIComponent(upiMatch[1]);
          gpayAccount = await prisma.googlePayAccount.findFirst({
            where: {
              upiId: usedUpi,
              OR: [
                { merchantId: intent.merchantId },
                { allocatedToMerchantId: intent.merchantId }
              ]
            }
          });
        }
      }

      if (gpayAccount) {
        await GatewayRouter.recordUsage(gpayAccount.id, txnAmount);
        
        // Pool quota tracking: increment usedQuota and check exhaustion
        if (gpayAccount.accountType === "PLATFORM_POOL" && Number(gpayAccount.totalQuota) > 0) {
          const updated = await prisma.googlePayAccount.update({
            where: { id: gpayAccount.id },
            data: { usedQuota: { increment: txnAmount } }
          });
          // Auto-pause when quota exhausted
          if (Number(updated.usedQuota) >= Number(updated.totalQuota)) {
            await prisma.googlePayAccount.update({
              where: { id: gpayAccount.id },
              data: { allocationStatus: "EXHAUSTED" }
            });
            await logApi("WARNING", `Pool account ${gpayAccount.name} quota exhausted (₹${updated.usedQuota}/${updated.totalQuota})`, intent.merchantId);
          }
        }
      }

      // ── SaaS: Trigger Notifications ──────────────────────────────────
      NotificationService.notifyTransactionSuccess(
        intent.merchantId,
        txnAmount,
        intent.referenceId,
        newTxn.utr || undefined
      ).catch(e => console.error("[NOTIFY_ERR]", e.message));

      // ── 5. Trigger webhook (async, non-blocking via Queue) ───────────
      if (intent.merchant.webhookUrl) {
        WebhookService.queueEvent(intent.merchantId, "payment.success", {
          event: "payment.success",
          status: "SUCCESS",
          order_id: intent.referenceId,
          amount: txnAmount,
          utr: newTxn.utr,
          payer_name: txn.payerName,
          payer_upi: txn.payerUpiId || null,
          metadata: (intent as any).metadata || {},
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
