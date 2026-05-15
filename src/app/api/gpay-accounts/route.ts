import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  let merchantId = session?.user?.merchantId;

  // Fallback removed for security

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let accounts: any[] = [];
  try {
    accounts = await prisma.googlePayAccount.findMany({
      where: { 
        merchantId, 
        status: { not: "DELETED" } 
      },
      orderBy: { createdAt: "desc" },
    });
    } catch (e) {
      console.error("Could not fetch accounts:", e);
    }

  return NextResponse.json({ status: "success", data: accounts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let merchantId = session?.user?.merchantId;

  // Fallback removed for security

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, upiId, reportId, minTicket, maxTicket, proxyConfig, password } = body;

  if (!name || !email || !upiId) {
    return NextResponse.json({ status: "failure", message: "name, email, upiId are required" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ status: "failure", message: "Google account password is required" }, { status: 400 });
  }

  // GPay 9 Singleton Pattern: Check if account already exists
  const existing = await prisma.googlePayAccount.findFirst({
    where: { name, merchantId }
  });

  if (existing) {
    const updated = await prisma.googlePayAccount.update({
      where: { id: existing.id },
      data: { 
        email, upiId, 
        reportId: reportId || existing.reportId, 
        // Do NOT reset reviewStatus — staff controls that
        ...(minTicket !== undefined && { minTicket: parseFloat(minTicket) }),
        ...(maxTicket !== undefined && { maxTicket: parseFloat(maxTicket) }),
        ...(proxyConfig !== undefined && { proxyConfig }),
        ...(password && { botPassword: password }),
      }
    });
    return NextResponse.json({ status: "success", data: updated });
  }

  const account = await prisma.googlePayAccount.create({
    data: {
      merchantId,
      name,
      email,
      upiId,
      status: "ACTIVE",
      reviewStatus: "PENDING_REVIEW",  // Staff must approve
      sessionStatus: "OFFLINE",         // Bot not yet active
      accountType: "MERCHANT_OWNED",
      botPassword: password,
      reportId: reportId || null,
      minTicket: minTicket ? parseFloat(minTicket) : 0,
      maxTicket: maxTicket ? parseFloat(maxTicket) : 1000000,
      proxyConfig: proxyConfig || null,
    },
  });

  return NextResponse.json({ status: "success", data: account });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let merchantId = session?.user?.merchantId;

  // Fallback removed for security

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ status: "failure", message: "Missing id" }, { status: 400 });
  }

  // Verify ownership
  const account = await prisma.googlePayAccount.findFirst({
    where: { id, merchantId }
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
  }

  // Truly hide from UI but keep in DB for history
  await prisma.googlePayAccount.update({
    where: { id },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ status: "success" });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let merchantId = session?.user?.merchantId;

  // Fallback removed for security

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, monthlyLimit, minTicket, maxTicket, proxyConfig } = body;

  if (!id) {
    return NextResponse.json({ status: "failure", message: "id is required" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.googlePayAccount.findFirst({
    where: { id, merchantId }
  });

  if (!existing) {
    return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
  }

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (monthlyLimit !== undefined) updateData.monthlyLimit = parseFloat(monthlyLimit);
  if (minTicket !== undefined) updateData.minTicket = parseFloat(minTicket);
  if (maxTicket !== undefined) updateData.maxTicket = parseFloat(maxTicket);
  if (proxyConfig !== undefined) updateData.proxyConfig = proxyConfig;

  const account = await prisma.googlePayAccount.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ status: "success", data: account });
}
