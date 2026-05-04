import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET: List merchant's own IP whitelist requests
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchantId = session.user.merchantId;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return NextResponse.json({ error: "No merchant found" }, { status: 404 });

    const requests = await prisma.ipWhitelistRequest.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      status: "success",
      data: requests,
      currentIps: merchant.ipWhitelist || "",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Submit a new IP whitelist request
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.merchantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchantId = session.user.merchantId;

    const body = await req.json();
    let { ipAddress, webhookUrl, acceptedTerms } = body;

    if (!acceptedTerms) {
      return NextResponse.json({ error: "You must accept the legal terms to proceed." }, { status: 400 });
    }

    if (!ipAddress) {
      const forwardedFor = req.headers.get("x-forwarded-for");
      ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
      if (ipAddress === "::1" || ipAddress === "127.0.0.1") ipAddress = "192.168.1.100";
    }

    if (!ipAddress || ipAddress === "unknown") {
      return NextResponse.json({ error: "Could not detect your IP address. Please enter it manually." }, { status: 400 });
    }

    // Check if already requested
    const existing = await prisma.ipWhitelistRequest.findFirst({
      where: { merchantId, ipAddress: ipAddress.trim(), status: "PENDING" },
    });

    if (existing) {
      return NextResponse.json({ error: "This IP is already pending approval" }, { status: 409 });
    }

    const request = await prisma.ipWhitelistRequest.create({
      data: {
        merchantId,
        ipAddress: ipAddress.trim(),
        webhookUrl: webhookUrl || null,
        acceptedTerms: true,
      },
    });

    return NextResponse.json({ status: "success", data: request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
