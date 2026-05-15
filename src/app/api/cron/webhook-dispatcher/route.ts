import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/services/webhook/WebhookService";

export async function POST(req: NextRequest) {
  // SECURITY: Authenticate cron requests
  const authSecret = req.headers.get("x-cron-secret") || req.headers.get("Authorization")?.replace("Bearer ", "");
  const expectedSecret = process.env.INTERNAL_BOT_SECRET;
  if (!expectedSecret || authSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await WebhookService.processQueue();
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
