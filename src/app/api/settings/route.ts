import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const merchant = await prisma.merchant.findUnique({
    where: { id: session.user.merchantId },
    select: { 
      webhookUrl: true, 
      webhookSecret: true,
      redirectUrl: true, 
      telegramBotToken: true, 
      telegramChatId: true, 
      webhookWhitelist: true,
    where: { id: session.user.merchantId },
    select: { 
      webhookUrl: true, 
      webhookSecret: true,
      redirectUrl: true, 
      telegramBotToken: true, 
      telegramChatId: true, 
      webhookWhitelist: true,
      apiAccessStatus: true,
      ipWhitelist: true,
      agent: true,
      trialEndsAt: true,
      brandColor: true,
      brandLogo: true,
      brandName: true,
      showSupportEmail: true,
      processingMode: true,
    },
  });
  return NextResponse.json({ status: "success", data: merchant });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const merchant = await prisma.merchant.findUnique({ where: { id: session.user.merchantId } });
  if (!merchant) return NextResponse.json({ status: "failure", message: "No merchant found" }, { status: 404 });

  const body = await req.json();
  const { 
    action, 
    webhookUrl, 
    redirectUrl, 
    telegramBotToken, 
    telegramChatId, 
    webhookWhitelist, 
    ipWhitelist, 
    referralCode,
    brandColor,
    brandLogo,
    brandName,
    showSupportEmail,
    processingMode
  } = body;

  if (action === "ROTATE_SECRET") {
    const crypto = require("crypto");
    const newSecret = crypto.randomBytes(16).toString("hex");
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { webhookSecret: newSecret }
    });
    return NextResponse.json({ status: "success", secret: newSecret });
  }

  // Handle Agent Referral Linking
  let agentIdUpdate = {};
  if (referralCode) {
    const agent = await prisma.agent.findUnique({
      where: { referralCode: referralCode.trim() }
    });
    if (agent) {
      agentIdUpdate = { agentId: agent.id };
    }
  }

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      ...(webhookUrl !== undefined && { webhookUrl }),
      ...(redirectUrl !== undefined && { redirectUrl }),
      ...(telegramBotToken !== undefined && { telegramBotToken }),
      ...(telegramChatId !== undefined && { telegramChatId }),
      ...(webhookWhitelist !== undefined && { webhookWhitelist }),
      ...(ipWhitelist !== undefined && { ipWhitelist }),
      ...(brandColor !== undefined && { brandColor }),
      ...(brandLogo !== undefined && { brandLogo }),
      ...(brandName !== undefined && { brandName }),
      ...(showSupportEmail !== undefined && { showSupportEmail }),
      ...(processingMode !== undefined && { processingMode }),
      ...agentIdUpdate
    },
  });

  return NextResponse.json({ status: "success", data: updated });
}
