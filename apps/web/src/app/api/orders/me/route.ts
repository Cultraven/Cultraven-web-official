import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";

function verifyToken(token: string) {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  
  try {
    const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
    const expectedSig = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    
    if (signature !== expectedSig) return null;
    
    const payloadStr = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr);
    
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get("cultraven_session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(sessionToken);
  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const orders = await Order.find({ userId: payload.userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
