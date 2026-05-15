import { NextRequest, NextResponse } from "next/server";
import { SettlementEngine } from "@/services/settlement/SettlementEngine";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const hours = body.hoursThreshold !== undefined ? Number(body.hoursThreshold) : 24;
    
    const result = await SettlementEngine.processBatch(hours);
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Batch Settlement Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
