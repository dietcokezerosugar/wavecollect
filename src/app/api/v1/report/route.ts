import { NextRequest, NextResponse } from "next/server";
import { MatchingEngine } from "@/services/matching/MatchingEngine";
import { logApi } from "@/lib/log";
import { parseSafeJson } from "@/lib/safe-body";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Security check: Bot Secret (MANDATORY)
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.INTERNAL_BOT_SECRET;
    
    if (!secret) {
      return NextResponse.json({ status: "failure", message: "Server misconfiguration: bot secret not set" }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ status: "failure", message: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await parseSafeJson(req, 500 * 1024); // Cap at 500KB for large bot reports
    } catch (e: any) {
      return NextResponse.json({ status: "failure", message: e.message || "Invalid JSON payload" }, { status: 400 });
    }
    const { account, transactions } = body;

    if (!account || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ status: "failure", message: "Invalid payload" }, { status: 400 });
    }

    await logApi("INFO", "Received bot report", undefined, { account, count: transactions.length });

    // --- HIGH-PERFORMANCE BATCH FILTERING ---
    // Extract external IDs to check in a single database query rather than sequentially
    const externalIds = transactions
      .map((t: any) => String(t.externalId || "").trim().toUpperCase())
      .filter(Boolean);

    let existingIds = new Set<string>();
    if (externalIds.length > 0) {
      const existingTxns = await prisma.transaction.findMany({
        where: { externalId: { in: externalIds } },
        select: { externalId: true }
      });
      existingIds = new Set(existingTxns.map((t: any) => t.externalId));
    }

    // Only process actual new transactions, skipping database round-trips for duplicates
    const newTransactions = transactions.filter((t: any) => {
      const id = String(t.externalId || "").trim().toUpperCase();
      return !existingIds.has(id);
    });

    let newCount = 0;
    for (const trx of newTransactions) {
      const isNew = await MatchingEngine.onTransactionDetected(trx);
      if (isNew) newCount++;
    }

    return NextResponse.json({ status: "success", newCount });
  } catch (error: any) {
    await logApi("ERROR", "Bot report processing failed", undefined, { error: error.message });
    return NextResponse.json({ status: "failure", message: error.message }, { status: 500 });
  }
}
