import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/events
 * 
 * Lists past webhook events for the merchant. 
 * Allows replaying or audit-trailing notifications.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ 
      error: {
        type: "invalid_request_error",
        code: "authentication_failed",
        message: "Missing or invalid API key."
      }
    }, { status: 401 });
  }

  const apiKey = authHeader.replace("Bearer ", "");
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { merchant: true }
  });

  if (!apiKeyRecord) {
    return NextResponse.json({ 
      error: {
        type: "invalid_request_error",
        code: "api_key_invalid",
        message: "The provided API key is invalid."
      }
    }, { status: 401 });
  }

  try {
    const events = await prisma.webhookEvent.findMany({
      where: { merchantId: apiKeyRecord.merchantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.webhookEvent.count({
      where: { merchantId: apiKeyRecord.merchantId }
    });

    return NextResponse.json({
      object: "list",
      url: "/v1/events",
      has_more: total > offset + limit,
      data: events.map(e => ({
        id: e.id,
        object: "event",
        type: e.event,
        created: Math.floor(e.createdAt.getTime() / 1000),
        data: JSON.parse(e.payload),
        status: e.status,
        retry_count: e.retryCount,
        next_retry: e.nextRetryAt ? Math.floor(e.nextRetryAt.getTime() / 1000) : null
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      error: {
        type: "api_error",
        code: "internal_error",
        message: error.message
      }
    }, { status: 500 });
  }
}
