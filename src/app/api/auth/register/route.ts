import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create Merchant & User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Merchant
      const merchant = await tx.merchant.create({
        data: {
          name: `${name}'s Hub`,
          businessName: name,
          email: email,
          status: "ACTIVE",
          commissionRate: 2.0, // Default 2% commission
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day trial
          walletBalance: 0,
        }
      });

      // Create User
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "MERCHANT",
          merchantId: merchant.id
        }
      });

      // Generate first API Key
      const apiKey = `wc_live_${crypto.randomBytes(12).toString("hex")}`;
      await tx.apiKey.create({
        data: {
          key: apiKey,
          merchantId: merchant.id,
          monthlyLimit: 1000000 // 10 Lakh limit for new accounts
        }
      });

      return { user, merchant, apiKey };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully",
      merchantId: result.merchant.id
    });

  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
