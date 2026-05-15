import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    let session = await getServerSession(authOptions);
    let merchantId = session?.user?.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    // 1. Fetch Latest Intents (Matched or Pending) for this merchant
    let intents: any[] = [];
    try {
      intents = await prisma.paymentIntent.findMany({
        where: { merchantId },
        include: { transaction: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    } catch (e) {
      console.warn("Could not fetch activity feed from DB");
    }

    // 2. Fetch Recent Transactions that are NOT linked to an intent (Orphans)
    // NOTE: In multi-tenant mode, we can only show orphans if they belong to the merchant's bot.
    // Since the current Transaction model lacks merchantId, we disable orphans for now to ensure 100% isolation.
    const unlinkedTxns: any[] = [];

    // 3. Merge and Sort
    const activity = [
      ...intents.map(i => ({ ...i, type: 'INTENT' })),
      ...unlinkedTxns.map(t => ({ 
        id: t.id,
        amount: t.amount,
        status: 'DETECTED_UNMATCHED',
        createdAt: t.timestamp,
        referenceId: t.note || 'No Note',
        type: 'ORPHAN',
        utr: t.utr
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ status: "success", data: activity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
