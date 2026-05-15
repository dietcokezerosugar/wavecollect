import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    const { name, type, x, y, key } = await req.json();

    if (!name) return NextResponse.json({ error: "Bot name required" }, { status: 400 });

    const port = 5000 + (parseInt(Buffer.from(name).toString('hex').slice(0, 4), 16) % 1000);
    
    try {
        const res = await axios.post(`http://127.0.0.1:${port}/api/control/interact`, { 
            type, x, y, key 
        }, { timeout: 5000 });
        
        return NextResponse.json(res.data);
    } catch (e: any) {
        return NextResponse.json({ error: "Could not send interaction" }, { status: 500 });
    }
}
