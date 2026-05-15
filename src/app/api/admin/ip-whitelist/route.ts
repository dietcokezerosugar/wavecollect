import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET: List all IP whitelist requests (admin view)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });

  try {
    const requests = await prisma.ipWhitelistRequest.findMany({
      include: {
        merchant: { select: { name: true, email: true, ipWhitelist: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ status: "success", data: requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Approve or reject an IP whitelist request
 */
export async function POST(req: NextRequest) {
  try {
    const { id, action, note } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ error: "id and action (APPROVE/REJECT) are required" }, { status: 400 });
    }

    const request = await prisma.ipWhitelistRequest.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    if (action === "APPROVE") {
      // Update request status
      await prisma.ipWhitelistRequest.update({
        where: { id },
        data: { status: "APPROVED", note, reviewedAt: new Date() },
      });

      // Add IP to merchant whitelist
      const currentIps = request.merchant.ipWhitelist
        ? request.merchant.ipWhitelist.split(",").map((ip) => ip.trim()).filter(Boolean)
        : [];

      if (!currentIps.includes(request.ipAddress)) {
        currentIps.push(request.ipAddress);
      }

      await prisma.merchant.update({
        where: { id: request.merchantId },
        data: { 
          ipWhitelist: currentIps.join(","),
          webhookUrl: request.webhookUrl || request.merchant.webhookUrl, // Only update if a new one is proposed
          apiAccessStatus: "APPROVED"
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: "SYSTEM_ADMIN",
          action: "IP_WHITELIST_APPROVED",
          metadata: JSON.stringify({ requestId: id, ip: request.ipAddress, merchantId: request.merchantId }),
        },
      });
    } else if (action === "REJECT") {
      await prisma.$transaction([
        prisma.ipWhitelistRequest.update({
          where: { id },
          data: { status: "REJECTED", note, reviewedAt: new Date() },
        }),
        prisma.merchant.update({
          where: { id: request.merchantId },
          data: { apiAccessStatus: "NOT_REQUESTED" }
        })
      ]);

      await prisma.auditLog.create({
        data: {
          userId: "SYSTEM_ADMIN",
          action: "IP_WHITELIST_REJECTED",
          metadata: JSON.stringify({ requestId: id, ip: request.ipAddress, merchantId: request.merchantId }),
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
