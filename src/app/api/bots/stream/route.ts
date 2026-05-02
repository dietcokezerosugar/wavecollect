import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) return NextResponse.json({ error: "Bot name required" }, { status: 400 });

    const port = 5000 + (parseInt(Buffer.from(name).toString('hex').slice(0, 4), 16) % 1000);
    
    try {
        // GPay 9 Deep Fix: Use Axios for zero-cache internal communication
        const res = await axios.get(`http://127.0.0.1:${port}/internal/stats`, { timeout: 2000 });
        
        return NextResponse.json({ 
            status: "online", 
            logs: res.data.recentLogs || [],
            stats: res.data
        });
    } catch (e: any) {
        // console.log(`[DEBUG] Stream Proxy could not reach bot on port ${port}: ${e.message}`);
        return NextResponse.json({ status: "offline", logs: [] });
    }
}
