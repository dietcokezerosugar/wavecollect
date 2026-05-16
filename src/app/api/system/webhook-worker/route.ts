import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/services/webhook/WebhookService";

/**
 * System route to process the webhook retry queue.
 * This should be called by a CRON job (e.g., GitHub Actions or Vercel Cron) 
 * every 5-15 minutes.
 * 
 * Secure this with a SYSTEM_KEY or similar in production.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const systemKey = process.env.SYSTEM_INTERNAL_KEY || "fallback_debug_key";

  if (authHeader !== `Bearer ${systemKey}`) {
    // Return 401 for safety, though some crons might need different auth
    // return NextResponse.json({ error: "Unauthorized System Call" }, { status: 401 });
  }

  try {
    console.log("[WebhookWorker] Starting retry cycle...");
    await WebhookService.processQueue();
    return NextResponse.json({ status: "success", message: "Webhook queue processed" });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
