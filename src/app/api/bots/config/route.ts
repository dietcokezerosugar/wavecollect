import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_SECRET = process.env.INTERNAL_BOT_SECRET;

function checkAuth(req: NextRequest) {
  const secret = req.headers.get("x-bot-secret");
  return secret === BOT_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const account = await prisma.googlePayAccount.findFirst({
      where: { name, status: { not: "DELETED" } },
      include: { merchant: true }
    });

    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // In production, we fetch merchant credentials for self-healing
    // Here we return reportId and basic info
    return NextResponse.json({
      data: {
        report_id: account.reportId,
        email: account.email,
        download_interval_sec: 40,
        proxyConfig: account.proxyConfig,
        password: account.botPassword,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, report_id } = await req.json();
    if (!name || !report_id) return NextResponse.json({ error: "Name and report_id required" }, { status: 400 });

    const account = await prisma.googlePayAccount.updateMany({
      where: { name },
      data: { reportId: report_id }
    });

    return NextResponse.json({ data: account });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
