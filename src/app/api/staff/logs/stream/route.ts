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
      let lastSize = 0;
      if (fs.existsSync(logPath)) {
        lastSize = fs.statSync(logPath).size;
        
        // Initial burst: last 50 lines
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n').slice(-50);
        lines.forEach(line => {
          if (line.trim()) controller.enqueue(`data: ${line}\n\n`);
        });
      }

      const pollInterval = setInterval(() => {
        try {
          if (!fs.existsSync(logPath)) return;
          const stats = fs.statSync(logPath);
          if (stats.size > lastSize) {
            const fd = fs.openSync(logPath, 'r');
            const buffer = Buffer.alloc(stats.size - lastSize);
            fs.readSync(fd, buffer, 0, stats.size - lastSize, lastSize);
            fs.closeSync(fd);
            
            const newLogs = buffer.toString('utf8').trim().split('\n');
            newLogs.forEach(line => {
              if (line.trim()) controller.enqueue(`data: ${line}\n\n`);
            });
            lastSize = stats.size;
          }
        } catch (e) {
          // controller.enqueue(`data: [SYSTEM] Stream error: ${e.message}\n\n`);
        }
      }, 1000); // Poll every second for new bytes

      req.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
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
