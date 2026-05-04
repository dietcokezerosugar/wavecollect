import axios from "axios";
import { logApi } from "@/lib/log";

export interface WebhookPayload {
  event: "payment.success" | "payment.failed" | "payment.test";
  status: string;
  amount: number;
  txn_id: string;
  reference_id: string;
  utr?: string | null;
  payer_name?: string | null;
  payer_upi?: string | null;
  timestamp: string;
}

export class WebhookService {
  /**
   * Dispatches a webhook payload to the merchant's endpoint.
   * This is intended to be non-blocking.
   */
  static async dispatch(merchantId: string, url: string, payload: WebhookPayload) {
    console.log(`[WebhookService] Dispatching to ${url}...`);
    const { prisma } = await import("@/lib/prisma");
    
    let status: number | null = null;
    let responseBody: string | null = null;
    let isSuccess = false;

    try {
      const response = await axios.post(url, payload, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WaveCollect-Webhook-Dispatcher/1.0",
        },
      });

      status = response.status;
      isSuccess = true;
      
      await logApi("INFO", "Webhook delivered successfully", merchantId, {
        url,
        referenceId: payload.reference_id,
        status,
      });

      return true;
    } catch (error: any) {
      status = error.response?.status || 500;
      responseBody = JSON.stringify(error.response?.data || error.message).substring(0, 500);
      
      await logApi("ERROR", "Webhook delivery failed", merchantId, {
        url,
        referenceId: payload.reference_id,
        error: responseBody,
      });

      return false;
    } finally {
      // Record the attempt in DB
      await prisma.webhookLog.create({
        data: {
          merchantId,
          event: payload.event,
          payload: JSON.stringify(payload),
          url,
          status,
          response: responseBody,
          isSuccess,
          attempts: 1,
        },
      }).catch(err => console.error("[WebhookLog] Failed to save log:", err.message));
    }
  }
}
