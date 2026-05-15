import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    // 1. Core Platform Stats
    const [
      totalMerchants,
      totalSuccessfulTxns,
      totalVolume,
      totalWalletFloat,
      pendingIpRequests,
      riskTiers,
      vpaHealth,
      settlementData
    ] = await Promise.all([
      prisma.merchant.count(),
      prisma.paymentIntent.count({ where: { status: "SUCCESS" } }),
      prisma.paymentIntent.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true }
      }),
      prisma.merchant.aggregate({
        _sum: { walletBalance: true }
      }),
      prisma.ipWhitelistRequest.count({ where: { status: "PENDING" } }),
      // Risk & Settlement Data
      prisma.customer.groupBy({
        by: ['riskTier'],
        _count: { id: true }
      }),
      prisma.googlePayAccount.aggregate({
        _avg: { healthScore: true },
        _count: { id: true },
        where: { status: "ACTIVE" }
      }),
      prisma.settlement.groupBy({
        by: ['status'],
        _sum: { totalAmount: true }
      })
    ]);

    // 2. Daily Volume Chart (Last 14 Days)
    const dailyVolume = [];
    for (let i = 13; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      
      const stats = await prisma.paymentIntent.aggregate({
        where: {
          status: "SUCCESS",
          createdAt: { gte: date, lt: nextDate }
        },
        _sum: { amount: true },
        _count: { id: true }
      });

      dailyVolume.push({
        date: format(date, "MMM dd"),
        amount: stats._sum.amount || 0,
        count: stats._count.id || 0
      });
    }

    // 3. Top Merchants (by volume)
    const topMerchants = await prisma.merchant.findMany({
      include: {
        _count: {
          select: { paymentIntents: { where: { status: "SUCCESS" } } }
        }
      },
      orderBy: { walletBalance: "desc" }, // Proxy for volume if they keep funds
      take: 5
    });

    return NextResponse.json({
      status: "success",
      data: {
        stats: {
          totalMerchants,
          totalSuccessfulTxns,
          totalVolume: totalVolume._sum.amount || 0,
          totalWalletFloat: totalWalletFloat._sum.walletBalance || 0,
          pendingIpRequests
        },
        riskDistribution: riskTiers.reduce((acc: any, tier: any) => {
          acc[tier.riskTier] = tier._count.id;
          return acc;
        }, { HIGH: 0, MID: 0, LOW: 0 }),
        vpaHealth: {
          activeAccounts: vpaHealth._count.id,
          averageScore: Math.round(Number(vpaHealth._avg.healthScore) || 100)
        },
        settlements: settlementData.reduce((acc: any, status: any) => {
          acc[status.status] = status._sum.totalAmount || 0;
          return acc;
        }, { UNSETTLED: 0, HELD: 0, SETTLED: 0 }),
        charts: {
          dailyVolume
        },
        topMerchants
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
