import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) return NextResponse.json({ error: "Bot name required" }, { status: 400 });

    const port = 5000 + (parseInt(Buffer.from(name).toString('hex').slice(0, 4), 16) % 1000);
    
    try {
        // Use native fetch to avoid axios issues with binary data
        const res = await fetch(`http://127.0.0.1:${port}/api/control/screen`, { 
            signal: AbortSignal.timeout(3000),
            cache: 'no-store'
        });
        
        if (!res.ok) throw new Error("Bot returned error");
        
        const buffer = await res.arrayBuffer();
        
        return new NextResponse(Buffer.from(buffer), {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
            }
        });
    } catch (e: any) {
        // Return a 1x1 transparent pixel so the img tag doesn't break
        return NextResponse.json(
            { error: "Bot not ready. Waiting for Cloud Browser to start..." }, 
            { status: 503 }
        );
    }
}
