import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) return NextResponse.json({ error: "Bot name required" }, { status: 400 });

    const port = 5000 + (parseInt(Buffer.from(name).toString('hex').slice(0, 4), 16) % 1000);
    
    try {
        const res = await axios.get(`http://127.0.0.1:${port}/api/control/screen`, { 
            responseType: 'arraybuffer',
            timeout: 5000 
        });
        
        return new NextResponse(res.data, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: "Could not capture screen" }, { status: 500 });
    }
}
