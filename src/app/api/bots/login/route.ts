import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, action, email, password } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // Update the account in DB with the desired action and credentials
    await prisma.googlePayAccount.updateMany({
      where: { name },
      data: {
        desiredStatus: action === "auto" ? "LOGIN_AUTO" : "LOGIN_MANUAL",
        email: email || undefined,
        botPassword: password || null,
      }
    });

    // Create a log entry
    await prisma.apiLog.create({
      data: {
        message: `[AUTH] ${action === "auto" ? "Automatic" : "Manual"} login requested for ${name}. Home engine syncing...`,
        level: "INFO"
      }
    });

    return NextResponse.json({ 
        status: "success", 
        message: "Login request sent to remote engine.",
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
