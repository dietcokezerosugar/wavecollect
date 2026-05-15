import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // Find the token
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetRecord) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Check expiration
    if (resetRecord.expires < new Date()) {
      // Clean it up
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetRecord.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User associated with this token no longer exists" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Transaction: Update password and delete all tokens for this user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { email: user.email }
      })
    ]);

    return NextResponse.json({ success: true, message: "Password has been successfully reset" });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
