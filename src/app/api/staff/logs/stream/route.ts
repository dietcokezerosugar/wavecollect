import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STAFF") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const botName = searchParams.get("botName");
  if (!botName) return NextResponse.json({ error: "Bot name required" }, { status: 400 });

  // 🛰️ CALC BOT PORT (Match bot.js logic)
  const botPort = 5000 + (parseInt(Buffer.from(botName).toString('hex').slice(0, 4), 16) % 1000);
  const botUrl = `http://localhost:${botPort}/api/control/logs`;

  try {
    const botResponse = await fetch(botUrl, {
      signal: req.signal,
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    if (!botResponse.ok) {
        return NextResponse.json({ error: `Bot ${botName} on port ${botPort} is not responding.` }, { status: 502 });
    }

    return new Response(botResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to connect to Bot Engine: ${e.message}` }, { status: 503 });
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
