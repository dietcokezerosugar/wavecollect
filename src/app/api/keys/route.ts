import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });
  if (!merchant) return NextResponse.json({ status: "success", data: [] });

  const keys = await prisma.apiKey.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ status: "success", data: keys });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });
  if (!merchant) return NextResponse.json({ status: "failure", message: "No merchant found" }, { status: 404 });

  if (merchant.apiAccessStatus !== "APPROVED") {
    return NextResponse.json({ status: "failure", message: "Security compliance not met. API Access requires approved IP Whitelist." }, { status: 403 });
  }

  const body = await req.json();
  const { monthly_limit } = body;

  const key = `wc_${crypto.randomBytes(16).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      key,
      merchantId: merchant.id,
      monthlyLimit: monthly_limit || 100000,
    },
  });

  return NextResponse.json({ status: "success", data: apiKey });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, isBlocked, monthlyLimit } = body;

  if (!id) {
    return NextResponse.json({ status: "failure", message: "Missing key id" }, { status: 400 });
  }

  // SECURITY: Verify the key belongs to the logged-in merchant
  const existing = await prisma.apiKey.findFirst({
    where: { id, merchantId: session.user.merchantId }
  });
  if (!existing) {
    return NextResponse.json({ status: "failure", message: "Key not found" }, { status: 404 });
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: {
      ...(typeof isBlocked === "boolean" && { isBlocked }),
      ...(monthlyLimit && { monthlyLimit: parseFloat(monthlyLimit) }),
    },
  });

  return NextResponse.json({ status: "success", data: updated });
}
