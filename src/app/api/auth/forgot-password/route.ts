import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { EmailService } from "@/services/notifications/EmailService";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // For security reasons, we do not reveal whether an email exists or not.
    // Always return success even if the user doesn't exist.
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://payxmint.com";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // Send actual email
    try {
      await EmailService.sendPasswordResetEmail(email, resetLink);
    } catch (emailError: any) {
      console.error("[FORGOT_PASSWORD] Email send failed:", emailError.message);
      // We still return success to the user for security, 
      // but log the error for infrastructure monitoring
    }

    return NextResponse.json({ 
      success: true, 
      message: "If an account exists, a reset link has been sent." 
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
