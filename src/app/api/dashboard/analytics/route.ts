import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    let session = await getServerSession(authOptions);
    let merchantId = session?.user?.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // 1. Revenue by Day (Last 7 Days)
    let revenueByDay: any[] = [];
    let summary = { totalWeeklyVolume: 0, totalMonthlyVolume: 0, totalTxns: 0 };
    let recentIntents: any[] = [];

    try {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dailyIntents = await prisma.paymentIntent.findMany({
          where: {
            merchantId,
            status: "SUCCESS",
            createdAt: { gte: date, lt: nextDate }
          },
          select: { amount: true }
        });

        const dailySum = dailyIntents.reduce((acc, curr) => acc + Number(curr.amount), 0);
        revenueByDay.push({
          name: days[date.getDay()],
          amount: dailySum,
          fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
        });
      }

      // 2. Summary Stats
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const weeklyIntents = await prisma.paymentIntent.findMany({
        where: { merchantId, status: "SUCCESS", createdAt: { gte: lastWeek } },
        select: { amount: true }
      });
      summary.totalWeeklyVolume = weeklyIntents.reduce((acc, curr) => acc + Number(curr.amount), 0);
      summary.totalTxns = weeklyIntents.length;

      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);
      const monthlyIntents = await prisma.paymentIntent.findMany({
        where: { merchantId, status: "SUCCESS", createdAt: { gte: lastMonth } },
        select: { amount: true }
      });
      summary.totalMonthlyVolume = monthlyIntents.reduce((acc, curr) => acc + Number(curr.amount), 0);

      // 3. Pulse (Recent Successful)
      recentIntents = await prisma.paymentIntent.findMany({
        where: { merchantId, status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        take: 5
      });
    } catch (e) {
      console.error("Could not fetch analytics from DB:", e);
    }

    return NextResponse.json({
      status: "success",
      data: {
        revenueByDay,
        summary,
        recentIntents
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
