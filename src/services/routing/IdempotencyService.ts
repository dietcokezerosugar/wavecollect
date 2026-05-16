import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export class IdempotencyService {
  /**
   * Checks if an idempotency key exists for the merchant and request.
   * If it does, returns the cached response.
   */
  static async getCachedResponse(merchantId: string, key: string, path: string) {
    const cached = await prisma.idempotencyKey.findFirst({
      where: {
        merchantId,
        key,
        requestPath: path,
        expiresAt: { gte: new Date() }
      }
    });

    if (cached) {
      console.log(`[Idempotency] HIT: key=${key} path=${path}`);
      return NextResponse.json(JSON.parse(cached.responseBody), { status: cached.responseStatus });
    }

    return null;
  }

  /**
   * Saves a response to the idempotency cache.
   */
  static async saveResponse(merchantId: string, key: string, path: string, status: number, body: any) {
    try {
      await prisma.idempotencyKey.upsert({
        where: { merchantId_key: { merchantId, key } },
        create: {
          merchantId,
          key,
          requestPath: path,
          responseStatus: status,
          responseBody: JSON.stringify(body),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        },
        update: {
          responseStatus: status,
          responseBody: JSON.stringify(body),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    } catch (e) {
      console.error("[Idempotency] Failed to save response:", e);
    }
  }
}
