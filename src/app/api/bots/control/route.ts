import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let action = searchParams.get("action");
    let name = "";

    let body: any = {};
    try {
      body = await req.json();
      if (body.action) action = body.action;
      if (body.name) name = body.name;
    } catch (e) {}

    if (action === "status") {
      // In hybrid mode, we check heartbeats
      const accounts = await prisma.googlePayAccount.findMany({
        where: { status: { not: "DELETED" } },
        select: { name: true, lastHeartbeat: true, desiredStatus: true }
      });
      
      const bots: Record<string, string> = {};
      const now = new Date();
      
      accounts.forEach(acc => {
        const isAlive = acc.lastHeartbeat && (now.getTime() - new Date(acc.lastHeartbeat).getTime() < 60000); // 1 min timeout
        bots[acc.name] = isAlive ? (acc.desiredStatus === "START" ? "online" : "stopped") : "offline";
      });
      
      return NextResponse.json({ bots });
    }

    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    let desiredStatus = "STOP";
    switch (action) {
      case "start":
        desiredStatus = "START";
        break;
      case "stop":
        desiredStatus = "STOP";
        break;
      case "restart":
        desiredStatus = "RESTART";
        break;
      case "waiting_otp":
        desiredStatus = "WAITING_OTP";
        break;
      case "submit_otp":
        desiredStatus = "OTP_READY";
        const otpCode = (body as any).otpCode;
        await prisma.googlePayAccount.updateMany({
            where: { name },
            data: { desiredStatus, otpCode }
        });
        return NextResponse.json({ status: "success" });
      case "delete":
        // For delete, we still might want to mark as deleted in DB
        await prisma.googlePayAccount.updateMany({
            where: { name },
            data: { status: "DELETED", desiredStatus: "STOP" }
        });
        return NextResponse.json({ status: "success" });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.googlePayAccount.updateMany({
      where: { name },
      data: { desiredStatus }
    });

    await prisma.apiLog.create({ 
        data: { 
            message: `[COMMAND] Bot ${name} requested to ${action}. Remote engine will sync shortly.`, 
            level: "INFO" 
        } 
    });

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Control Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
