import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });
  if (!merchant) return new NextResponse("No merchant found", { status: 404 });

  const intents = await prisma.paymentIntent.findMany({
    where: { merchantId: merchant.id },
    include: { transaction: true, allocatedAccount: true },
    orderBy: { createdAt: "desc" },
  });

  // CSV header
  const header = "Reference ID,Amount,Status,Payer Name,Payer UPI,UTR,GPay Account Name,GPay Account UPI,Created At,Expire At\n";

  const rows = intents.map((i) => {
    return [
      i.referenceId,
      i.amount,
      i.status,
      i.payerName || i.transaction?.payerName || "",
      i.payerUpiId || i.transaction?.payerUpiId || "",
      i.transaction?.utr || "",
      i.allocatedAccount?.name || "",
      i.allocatedAccount?.upiId || "",
      i.createdAt.toISOString(),
      i.expireAt?.toISOString() || "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payxmint-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
