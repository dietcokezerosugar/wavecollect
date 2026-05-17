import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Check merchant's pool allocation status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: session.user.merchantId },
    select: { processingMode: true, poolRequestStatus: true, poolRequestedAt: true }
  });

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // If allocated, fetch all pool account details
  let allocations: any[] = [];
  if (merchant.poolRequestStatus === "APPROVED") {
    allocations = await prisma.googlePayAccount.findMany({
      where: {
        allocatedToMerchantId: session.user.merchantId,
        allocationStatus: { in: ["ASSIGNED", "PAUSED", "EXHAUSTED"] }
      },
      select: {
        id: true,
        upiId: true,
        sessionStatus: true,
        allocationStatus: true,
        totalQuota: true,
        usedQuota: true,
        minTicket: true,
        maxTicket: true,
      }
    });
  }

  return NextResponse.json({
    status: "success",
    data: {
      processingMode: merchant.processingMode,
      poolRequestStatus: merchant.poolRequestStatus,
      poolRequestedAt: merchant.poolRequestedAt,
      allocations,
    }
  });
}

// POST: Merchant applies for pool access
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: session.user.merchantId }
  });

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Can't request if already pending or approved
  if (merchant.poolRequestStatus === "PENDING") {
    return NextResponse.json({ error: "Request already pending" }, { status: 409 });
  }

  if (merchant.poolRequestStatus === "APPROVED") {
    return NextResponse.json({ error: "Pool account already allocated" }, { status: 409 });
  }

  await prisma.merchant.update({
    where: { id: session.user.merchantId },
    data: {
      poolRequestStatus: "PENDING",
      poolRequestedAt: new Date(),
      processingMode: "PLATFORM_POOL",
    }
  });

  return NextResponse.json({ status: "success", message: "Pool account request submitted" });
}

// PUT: Merchant toggles back to own account mode
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { mode } = body; // "OWN_ACCOUNT" or "PLATFORM_POOL"

  if (mode !== "OWN_ACCOUNT" && mode !== "PLATFORM_POOL") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  // If switching to PLATFORM_POOL without an approved allocation, just set the mode
  // The merchant would still need to apply for a pool account
  await prisma.merchant.update({
    where: { id: session.user.merchantId },
    data: { processingMode: mode }
  });

  return NextResponse.json({ status: "success" });
}
