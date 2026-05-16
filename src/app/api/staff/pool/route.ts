import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ════════════════════════════════════════════════════════════════
// GET: List all pool accounts + pending merchant requests
// ════════════════════════════════════════════════════════════════
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All pool accounts with their allocated merchants
  const poolAccounts = await prisma.googlePayAccount.findMany({
    where: { accountType: "PLATFORM_POOL", status: { not: "DELETED" } },
    include: {
      allocatedToMerchant: { select: { id: true, name: true, businessName: true, email: true } },
      merchant: { select: { name: true } }, // Platform owner
    },
    orderBy: { createdAt: "desc" },
  });

  // Merchants requesting pool access
  const pendingRequests = await prisma.merchant.findMany({
    where: { poolRequestStatus: "PENDING" },
    select: { id: true, name: true, businessName: true, email: true, poolRequestedAt: true },
    orderBy: { poolRequestedAt: "desc" },
  });

  // Allocation summary
  const allocated = poolAccounts.filter(a => a.allocationStatus !== "UNASSIGNED").length;
  const available = poolAccounts.filter(a => a.allocationStatus === "UNASSIGNED").length;
  const online = poolAccounts.filter(a => a.sessionStatus === "ONLINE").length;

  return NextResponse.json({
    status: "success",
    data: {
      poolAccounts,
      pendingRequests,
      summary: { total: poolAccounts.length, allocated, available, online, pendingRequests: pendingRequests.length }
    }
  });
}

// ════════════════════════════════════════════════════════════════
// POST: Allocate a pool account to a merchant OR Create a new pool account
// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, accountId, merchantId, totalQuota, minTicket, maxTicket, name, email, password, upiId } = body;

  // -- ACTION: CREATE NEW POOL ACCOUNT --
  if (action === "create") {
    if (!name || !email || !password || !upiId) {
      return NextResponse.json({ error: "Missing required fields for account creation" }, { status: 400 });
    }
    
    try {
      // Find a platform admin merchant to own these pool accounts.
      // If one doesn't exist, create it automatically.
      let platformMerchant = await prisma.merchant.findFirst({
        where: { name: "Platform Pool Admin" }
      });

      if (!platformMerchant) {
        platformMerchant = await prisma.merchant.create({
          data: {
            name: "Platform Pool Admin",
            email: "pool-admin@wavecollect.com",
            status: "ACTIVE",
            processingMode: "OWN_ACCOUNT"
          }
        });
      }

      // Create the account owned by the platform merchant.
      const account = await prisma.googlePayAccount.create({
        data: {
          merchantId: platformMerchant.id,
          name,
          email,
          botPassword: password,
          upiId,
          accountType: "PLATFORM_POOL",
          status: "ACTIVE",
          reviewStatus: "APPROVED", // Pre-approved since staff creates it
          sessionStatus: "OFFLINE",
          minTicket: 0,
          maxTicket: 1000000,
          allocationStatus: "UNASSIGNED",
          totalQuota: 0,
          usedQuota: 0
        }
      });
      return NextResponse.json({ status: "success", data: account });
    } catch (e: any) {
      console.error("[POOL_CREATE_ERROR]", e);
      return NextResponse.json({ error: e.message || "Database error creating pool account" }, { status: 500 });
    }
  }

  // -- ACTION: ALLOCATE --
  if (!accountId || !merchantId) {
    return NextResponse.json({ error: "accountId and merchantId are required" }, { status: 400 });
  }

  // Verify the pool account exists and is unassigned
  const account = await prisma.googlePayAccount.findFirst({
    where: { id: accountId, accountType: "PLATFORM_POOL" }
  });

  if (!account) {
    return NextResponse.json({ error: "Pool account not found" }, { status: 404 });
  }

  if (account.allocationStatus !== "UNASSIGNED") {
    return NextResponse.json({ error: "Account is already assigned. Detach it first." }, { status: 409 });
  }

  // Check if merchant already has an allocated pool account
  const existingAllocation = await prisma.googlePayAccount.findFirst({
    where: { allocatedToMerchantId: merchantId, allocationStatus: { in: ["ASSIGNED", "PAUSED"] } }
  });

  if (existingAllocation) {
    return NextResponse.json({ error: "Merchant already has an allocated pool account. Detach the existing one first." }, { status: 409 });
  }

  // Allocate
  const updated = await prisma.googlePayAccount.update({
    where: { id: accountId },
    data: {
      allocatedToMerchantId: merchantId,
      allocationStatus: "ASSIGNED",
      totalQuota: totalQuota ? parseFloat(totalQuota) : 0,
      usedQuota: 0,
      allocatedAt: new Date(),
      allocatedBy: session.user.id,
      ...(minTicket !== undefined && { minTicket: parseFloat(minTicket) }),
      ...(maxTicket !== undefined && { maxTicket: parseFloat(maxTicket) }),
    }
  });

  // Update merchant status
  await prisma.merchant.update({
    where: { id: merchantId },
    data: { poolRequestStatus: "APPROVED", processingMode: "PLATFORM_POOL" }
  });

  await prisma.apiLog.create({
    data: {
      message: `[POOL] ${session.user.name || session.user.email} allocated pool account "${account.name}" to merchant ${merchantId}. Quota: ₹${totalQuota || 0}`,
      level: "INFO"
    }
  });

  return NextResponse.json({ status: "success", data: updated });
}

// ════════════════════════════════════════════════════════════════
// PUT: Update allocation (quota, reassign, pause, detach)
// ════════════════════════════════════════════════════════════════
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { accountId, action, totalQuota, minTicket, maxTicket } = body;

  if (!accountId || !action) {
    return NextResponse.json({ error: "accountId and action are required" }, { status: 400 });
  }

  const account = await prisma.googlePayAccount.findFirst({
    where: { id: accountId, accountType: "PLATFORM_POOL" }
  });

  if (!account) {
    return NextResponse.json({ error: "Pool account not found" }, { status: 404 });
  }

  const updateData: any = {};

  switch (action) {
    case "update_quota":
      if (totalQuota !== undefined) updateData.totalQuota = parseFloat(totalQuota);
      if (minTicket !== undefined) updateData.minTicket = parseFloat(minTicket);
      if (maxTicket !== undefined) updateData.maxTicket = parseFloat(maxTicket);
      // If quota was increased past used amount, un-exhaust
      if (totalQuota && parseFloat(totalQuota) > Number(account.usedQuota)) {
        updateData.allocationStatus = "ASSIGNED";
      }
      break;

    case "reset_quota":
      updateData.usedQuota = 0;
      if (account.allocationStatus === "EXHAUSTED") {
        updateData.allocationStatus = "ASSIGNED";
      }
      break;

    case "pause":
      updateData.allocationStatus = "PAUSED";
      break;

    case "resume":
      updateData.allocationStatus = Number(account.usedQuota) >= Number(account.totalQuota) && Number(account.totalQuota) > 0
        ? "EXHAUSTED"
        : "ASSIGNED";
      break;

    case "detach":
      updateData.allocatedToMerchantId = null;
      updateData.allocationStatus = "UNASSIGNED";
      updateData.totalQuota = 0;
      updateData.usedQuota = 0;
      updateData.allocatedAt = null;
      updateData.allocatedBy = null;
      updateData.minTicket = 0;
      updateData.maxTicket = 1000000;

      // Reset merchant to OWN_ACCOUNT mode
      if (account.allocatedToMerchantId) {
        await prisma.merchant.update({
          where: { id: account.allocatedToMerchantId },
          data: { processingMode: "OWN_ACCOUNT", poolRequestStatus: "NONE" }
        });
      }
      break;

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.googlePayAccount.update({
    where: { id: accountId },
    data: updateData,
  });

  await prisma.apiLog.create({
    data: {
      message: `[POOL] ${session.user.name || session.user.email} ${action} on pool account "${account.name}"`,
      level: "INFO"
    }
  });

  return NextResponse.json({ status: "success", data: updated });
}
