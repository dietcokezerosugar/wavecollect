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

  const sessionsDir = path.join(process.cwd(), ".sessions");
  
  // Try exact match first, then lowercase slug match
  let logPath = path.join(sessionsDir, `session-${botName}`, "bot.log");
  if (!fs.existsSync(logPath)) {
    const slugName = botName.toLowerCase().replace(/@/g, '-').replace(/\./g, '-');
    logPath = path.join(sessionsDir, `session-${slugName}`, "bot.log");
  }

  if (!fs.existsSync(logPath)) {
    // If still not found, try common slug variations
    const simpleSlug = botName.split('@')[0].toLowerCase();
    const altPath = path.join(sessionsDir, `session-${simpleSlug}`, "bot.log");
    if (fs.existsSync(altPath)) logPath = altPath;
  }

  if (!fs.existsSync(logPath)) {
    return NextResponse.json({ error: "Log file not found" }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      if (!fs.existsSync(logPath)) {
        controller.enqueue(`data: [SYSTEM] Log file for ${botName} not found yet...\n\n`);
      }

      // Initial tail: send last 50 lines
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n').slice(-50);
        lines.forEach(line => {
          if (line.trim()) controller.enqueue(`data: ${line}\n\n`);
        });
      }

      // Watch for changes
      const watcher = fs.watch(path.dirname(logPath), (eventType, filename) => {
        if (filename === 'bot.log' && eventType === 'change') {
          try {
            const freshContent = fs.readFileSync(logPath, 'utf8');
            const lastLine = freshContent.trim().split('\n').pop();
            if (lastLine) controller.enqueue(`data: ${lastLine}\n\n`);
          } catch (e) {}
        }
      });

      req.signal.addEventListener("abort", () => {
        watcher.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
