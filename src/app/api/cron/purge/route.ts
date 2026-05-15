import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job to expire stale payment intents and reset VPA daily counters.
 * Should be called every 5 minutes via external cron or PM2 scheduler.
 * POST /api/cron/purge
 */
export async function POST(req: NextRequest) {
  // SECURITY: Authenticate cron requests
  const authSecret = req.headers.get("x-cron-secret") || req.headers.get("Authorization")?.replace("Bearer ", "");
  const expectedSecret = process.env.INTERNAL_BOT_SECRET;
  if (!expectedSecret || authSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Expire stale payment intents
    const expiredResult = await prisma.paymentIntent.updateMany({
      where: {
        status: "PENDING",
        expireAt: { lte: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    // 2. Reset daily VPA counters (if past midnight)
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 6) {
      await prisma.googlePayAccount.updateMany({
        where: { status: "ACTIVE" },
        data: { currentDaily: 0 },
      });
    }

    // 3. Reset weekly counters on Monday
    if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() < 6) {
      await prisma.googlePayAccount.updateMany({
        where: { status: "ACTIVE" },
        data: { currentWeekly: 0 },
      });
    }

    // 4. Reset monthly counters on the 1st
    if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() < 6) {
      await prisma.googlePayAccount.updateMany({
        where: { status: "ACTIVE" },
        data: { currentMonthly: 0 },
      });
    }

    return NextResponse.json({
      status: "success",
      expired: expiredResult.count,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
