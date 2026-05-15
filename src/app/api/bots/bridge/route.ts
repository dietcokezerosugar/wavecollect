import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_SECRET = process.env.INTERNAL_BOT_SECRET;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bot-secret");
  
  if (secret !== BOT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, payload } = await req.json();

    if (action === "sync") {
      // Return list of accounts and their desired status
      const accounts = await prisma.googlePayAccount.findMany({
        where: { status: { not: "DELETED" } },
        select: {
          id: true,
          name: true,
          email: true,
          desiredStatus: true,
          botPassword: true,
          reportId: true,
          proxyConfig: true,
          otpCode: true,
        }
      });

      return NextResponse.json({ accounts });
    }

    if (action === "heartbeat") {
      const { name, currentStatus } = payload;
      await prisma.googlePayAccount.updateMany({
        where: { name },
        data: { 
            lastHeartbeat: new Date(),
            sessionStatus: currentStatus === "online" ? "ONLINE" : "OFFLINE",
        }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "report_txn") {
        const { merchantId, utr, amount, payerName, payerUpiId, note, externalId, timestamp } = payload;
        
        // Use a transaction to ensure we don't double count
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.transaction.findUnique({ where: { externalId } });
            if (existing) return existing;

            return await tx.transaction.create({
                data: {
                    externalId,
                    utr,
                    amount: parseFloat(amount),
                    payerName,
                    payerUpiId,
                    note,
                    timestamp: new Date(timestamp),
                }
            });
        });

        return NextResponse.json({ success: true, id: result.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("[BRIDGE_API_ERR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
