import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const heartbeatThreshold = new Date(Date.now() - 2 * 60 * 1000);

    const accounts = await prisma.googlePayAccount.findMany({
      select: {
        id: true, name: true, upiId: true, status: true, reviewStatus: true,
        sessionStatus: true, lastHeartbeat: true, riskTier: true, accountType: true,
        minTicket: true, maxTicket: true, dailyLimit: true, currentDaily: true,
        successfulTxn: true, cooldownUntil: true, merchantId: true, isAdmin: true,
      }
    });

    const diagnosis = accounts.map(a => {
      const heartbeatOk = a.lastHeartbeat && a.lastHeartbeat >= heartbeatThreshold;
      const issues: string[] = [];
      if (a.status !== 'ACTIVE') issues.push('NOT_ACTIVE');
      if (a.reviewStatus !== 'APPROVED') issues.push('NOT_APPROVED');
      if (a.sessionStatus !== 'ONLINE') issues.push('NOT_ONLINE');
      if (!heartbeatOk) issues.push('HEARTBEAT_STALE_OR_MISSING');
      if (a.successfulTxn >= 100) issues.push('TXN_LIMIT_REACHED');

      return {
        name: a.name,
        upiId: a.upiId,
        status: a.status,
        reviewStatus: a.reviewStatus,
        sessionStatus: a.sessionStatus,
        heartbeat: a.lastHeartbeat ? `${Math.floor((Date.now() - a.lastHeartbeat.getTime()) / 1000)}s ago` : 'NEVER',
        riskTier: a.riskTier,
        accountType: a.accountType,
        successfulTxn: a.successfulTxn,
        tickets: `${a.minTicket}-${a.maxTicket}`,
        daily: `${a.currentDaily}/${a.dailyLimit}`,
        eligible: issues.length === 0,
        blockedBy: issues,
      };
    });

    const eligible = diagnosis.filter(d => d.eligible);

    return NextResponse.json({
      totalAccounts: accounts.length,
      eligibleAccounts: eligible.length,
      accounts: diagnosis,
      conclusion: eligible.length === 0
        ? "❌ NO ELIGIBLE ACCOUNTS — All VPAs are blocked by one or more conditions"
        : `✅ ${eligible.length} accounts available for routing`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
