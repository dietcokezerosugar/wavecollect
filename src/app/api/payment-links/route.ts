import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  let merchantId = session?.user?.merchantId;

  if (!merchantId) {
    const firstMerchant = await prisma.merchant.findFirst({ select: { id: true } });
    merchantId = firstMerchant?.id;
  }

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.paymentLink.findMany({
    where: { merchantId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ status: "success", data: links });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let merchantId = session?.user?.merchantId;

  if (!merchantId) {
    const firstMerchant = await prisma.merchant.findFirst({ select: { id: true } });
    merchantId = firstMerchant?.id;
  }

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, amount, description } = body;

  if (!title || !amount) {
    return NextResponse.json({ status: "failure", message: "title and amount required" }, { status: 400 });
  }

  const apiKey = await prisma.apiKey.findFirst({
    where: { merchantId, isBlocked: false },
  });

  if (!apiKey) {
    return NextResponse.json({ status: "failure", message: "No active API key" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

  const link = await prisma.paymentLink.create({
    data: {
      merchantId,
      title,
      amount: parseFloat(amount),
      description: description || null,
      slug,
      apiKeyId: apiKey.id,
    },
  });

  return NextResponse.json({ status: "success", data: link });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let merchantId = session?.user?.merchantId;

  if (!merchantId) {
    const firstMerchant = await prisma.merchant.findFirst({ select: { id: true } });
    merchantId = firstMerchant?.id;
  }

  if (!merchantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ status: "failure", message: "Missing id" }, { status: 400 });
  }

  // Verify ownership before "deleting" (marking inactive)
  const link = await prisma.paymentLink.findFirst({
    where: { id, merchantId }
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found or unauthorized" }, { status: 404 });
  }

  await prisma.paymentLink.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ status: "success" });
}
