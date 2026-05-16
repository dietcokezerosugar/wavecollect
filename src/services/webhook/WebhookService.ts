import { prisma } from "@/lib/prisma";
import axios from "axios";

export class WebhookService {
  /**
   * Queue a webhook event for a merchant.
   */
  static async queueEvent(merchantId: string, event: string, payload: any) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { webhookUrl: true }
    });

    if (!merchant?.webhookUrl) return;

    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        merchantId,
        event,
        payload: JSON.stringify(payload),
        url: merchant.webhookUrl,
        status: "PENDING",
      }
    });

    // Attempt immediate delivery in non-blocking fire-and-forget
    // If this fails, the cron-based processQueue() will retry automatically
    setImmediate(() => {
      this.dispatch(webhookEvent.id).catch(() => { });
    });

    return webhookEvent;
  }

  /**
   * Dispatch a specific webhook event.
   */
  static async dispatch(eventId: string) {
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: { merchant: true }
    });

    if (!event || event.status === "SUCCESS") return;

    try {
      const payloadString = event.payload;
      const secret = event.merchant.webhookSecret || "sk_live_default_secret_placeholder";

      // Calculate HMAC-SHA256 signature using our new utility
      const { WebhookSigner } = await import("@/lib/webhook-signer");
      const signature = WebhookSigner.sign(payloadString, secret);

      const response = await axios.post(event.url, JSON.parse(payloadString), {
        headers: {
          "Content-Type": "application/json",
          "X-PayxMint-Event": event.event,
          "X-PayxMint-Signature": signature,
          "User-Agent": "PayxMint-Webhook-Dispatcher/2.0",
        },
        timeout: 10000,
      });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: "SUCCESS",
          updatedAt: new Date()
        }
      });

      // Also log to WebhookLog for history
      await prisma.webhookLog.create({
        data: {
          merchantId: event.merchantId,
          event: event.event,
          payload: event.payload,
          url: event.url,
          status: response.status,
          response: JSON.stringify(response.data),
          isSuccess: true,
          attempts: event.retryCount + 1
        }
      });

    } catch (error: any) {
      const retryCount = event.retryCount + 1;

      // Exponential backoff: 1 min, 5 min, 1 hour, 6 hours, 24 hours
      const backoffMinutes = [1, 5, 60, 360, 1440];
      const nextRetryAt = new Date();

      if (retryCount <= backoffMinutes.length) {
        nextRetryAt.setMinutes(nextRetryAt.getMinutes() + backoffMinutes[retryCount - 1]);

        await prisma.webhookEvent.update({
          where: { id: eventId },
          data: {
            status: "FAILED",
            retryCount,
            nextRetryAt,
            updatedAt: new Date()
          }
        });
      } else {
        // Mark as dead letter after all retries exhausted
        await prisma.webhookEvent.update({
          where: { id: eventId },
          data: {
            status: "DEAD_LETTER",
            retryCount,
            updatedAt: new Date()
          }
        });
      }

      // Log failure
      await prisma.webhookLog.create({
        data: {
          merchantId: event.merchantId,
          event: event.event,
          payload: event.payload,
          url: event.url,
          status: error.response?.status || 0,
          response: error.message,
          isSuccess: false,
          attempts: retryCount
        }
      });
    }
  }

  /**
   * Background task to process pending/failed retries.
   */
  static async processQueue() {
    const events = await prisma.webhookEvent.findMany({
      where: {
        OR: [
          { status: "FAILED", nextRetryAt: { lte: new Date() } },
          { status: "PENDING", createdAt: { lte: new Date(Date.now() - 5 * 60000) } } // Stuck for 5 mins
        ]
      },
      take: 50
    });

    if (events.length === 0) return;

    console.log(`[WebhookService] Processing ${events.length} queued events in parallel...`);
    
    // Process in parallel to prevent cron timeouts
    await Promise.allSettled(events.map(event => this.dispatch(event.id)));
  }
}
