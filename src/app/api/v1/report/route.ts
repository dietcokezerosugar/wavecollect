import { NextRequest, NextResponse } from "next/server";
import { MatchingEngine } from "@/services/matching/MatchingEngine";
import { logApi } from "@/lib/log";

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

    const body = await req.json();
    const { account, transactions } = body;

    if (!account || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ status: "failure", message: "Invalid payload" }, { status: 400 });
    }

    await logApi("INFO", "Received bot report", undefined, { account, count: transactions.length });

    let newCount = 0;
    for (const trx of transactions) {
      const isNew = await MatchingEngine.onTransactionDetected(trx);
      if (isNew) newCount++;
    }

    return NextResponse.json({ status: "success", newCount });
  } catch (error: any) {
    await logApi("ERROR", "Bot report processing failed", undefined, { error: error.message });
    return NextResponse.json({ status: "failure", message: error.message }, { status: 500 });
  }
}
