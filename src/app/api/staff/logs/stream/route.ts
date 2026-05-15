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
  const pm2LogDir = path.join(require('os').homedir(), ".pm2", "logs");
  if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

  // 🔍 FUZZY DISCOVERY: Scan for the best matching session folder
  let logPath = "";
  const availableSessions = fs.readdirSync(sessionsDir);
  
  // 1. Try to find a folder that contains the botName (slugified)
  const targetSlug = botName.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '');
  const match = availableSessions.find(s => {
    const folderSlug = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return folderSlug.includes(targetSlug) || targetSlug.includes(folderSlug);
  });

  if (match) {
    logPath = path.join(sessionsDir, match, "bot.log");
  } 

  // 2. PM2 FALLBACK: Check if there is a PM2 log for this bot
  if (!logPath || !fs.existsSync(logPath)) {
    const pm2Match = `bot-${targetSlug}-out.log`;
    const pm2Path = path.join(pm2LogDir, pm2Match);
    
    if (fs.existsSync(pm2Path)) {
      logPath = pm2Path;
    } else {
      // Try with hyphens
      const hyphenMatch = availableSessions.find(s => s.includes(botName.split('@')[0].toLowerCase()));
      if (hyphenMatch) {
         logPath = path.join(sessionsDir, hyphenMatch, "bot.log");
      }
    }
  }

  // 3. Last Resort: Try exact path
  if (!logPath || !fs.existsSync(logPath)) {
    logPath = path.join(sessionsDir, `session-${botName}`, "bot.log");
  }

  if (!fs.existsSync(logPath)) {
    // Check PM2 dir again with fuzzy
    if (fs.existsSync(pm2LogDir)) {
      const pm2Files = fs.readdirSync(pm2LogDir);
      const pm2Fuzzy = pm2Files.find(f => f.toLowerCase().includes(targetSlug) && f.endsWith('-out.log'));
      if (pm2Fuzzy) logPath = path.join(pm2LogDir, pm2Fuzzy);
    }
  }

  if (!logPath || !fs.existsSync(logPath)) {
    return NextResponse.json({ error: `Log file not found. Searched sessions and PM2 for: ${targetSlug}` }, { status: 404 });
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
