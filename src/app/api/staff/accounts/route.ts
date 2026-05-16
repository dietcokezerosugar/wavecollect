import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all accounts (for staff review)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.googlePayAccount.findMany({
    where: { status: { not: "DELETED" } },
    include: {
      merchant: {
        select: { name: true, email: true, businessName: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ status: "success", data: accounts });
}

// PUT: Update review status (approve/reject/assign)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action, note } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const updateData: any = {
    reviewedBy: session.user.id,
    reviewedAt: new Date(),
    reviewNote: note || null,
  };

  switch (action) {
    case "approve":
      updateData.reviewStatus = "APPROVED";
      updateData.assignedStaff = session.user.id;
      break;
    case "reject":
      updateData.reviewStatus = "REJECTED";
      break;
    case "suspend":
      updateData.reviewStatus = "SUSPENDED";
      updateData.sessionStatus = "OFFLINE";
      updateData.desiredStatus = "STOP";
      break;
    case "activate":
      // Trigger manual login for staff to complete
      updateData.desiredStatus = "LOGIN_MANUAL";
      updateData.sessionStatus = "STARTING";
      updateData.assignedStaff = session.user.id;
      break;
    case "set_report_id":
      // Staff can manually set the Merchant ID (BCR...) if auto-discovery fails
      if (!body.reportId) {
        return NextResponse.json({ error: "reportId is required" }, { status: 400 });
      }
      updateData.reportId = body.reportId.trim();
      delete updateData.reviewedBy;
      delete updateData.reviewedAt;
      delete updateData.reviewNote;
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const account = await prisma.googlePayAccount.update({
    where: { id },
    data: updateData,
  });

  await prisma.apiLog.create({
    data: {
      message: `[STAFF] ${session.user.name || session.user.email} ${action}d account ${account.name} (${account.email})`,
      level: "INFO"
    }
  });

  return NextResponse.json({ status: "success", data: account });
}

// POST: Create a platform pool account (staff/admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, upiId, password, proxyConfig } = body;

  if (!name || !email || !upiId || !password) {
    return NextResponse.json({ error: "name, email, upiId, password required" }, { status: 400 });
  }

  // Pool accounts need a placeholder merchant — use the first admin merchant or create one
  let platformMerchant = await prisma.merchant.findFirst({ where: { email: "platform@payxmint.com" } });
  if (!platformMerchant) {
    platformMerchant = await prisma.merchant.create({
      data: {
        name: "Platform Pool",
        email: "platform@payxmint.com",
        status: "ACTIVE",
      }
    });
  }

  const account = await prisma.googlePayAccount.create({
    data: {
      merchantId: platformMerchant.id,
      name,
      email,
      upiId,
      botPassword: password,
      status: "ACTIVE",
      accountType: "PLATFORM_POOL",
      reviewStatus: "APPROVED",  // Staff-created = pre-approved
      sessionStatus: "OFFLINE",
      assignedStaff: session.user.id,
      proxyConfig: proxyConfig || null,
    },
  });

  return NextResponse.json({ status: "success", data: account });
}
