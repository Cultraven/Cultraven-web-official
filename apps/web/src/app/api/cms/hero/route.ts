import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { HeroBanner } from "@/lib/models/HeroBanner";

const MOCK_BANNERS = [
  {
    id: "mock1",
    headline: "THE RAVEN DROP",
    subheadline: "Heavyweight Oversized Tees. Now Live.",
    srcDesktop: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1920&auto=format&fit=crop&q=80",
    imageMobile: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80",
    ctaLabel: "SHOP NOW",
    ctaHref: "/collections/all",
    active: true,
  }
];

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch all banners from DB, sorted by creation date or any other order
    // Convert _id to id for the frontend
    const docs = await HeroBanner.find().lean();
    
    let banners = docs.map((doc: any) => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
      __v: undefined,
    }));

    if (banners.length === 0) {
      banners = MOCK_BANNERS;
    }

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Failed to fetch banners, falling back to mock:", error);
    return NextResponse.json({ banners: MOCK_BANNERS });
  }
}

import crypto from "crypto";

function verifyAdminToken(req: Request): boolean {
  // @ts-ignore
  const cookies = req.headers.get("cookie") || "";
  const match = cookies.match(/cultraven_session=([^;]+)/);
  if (!match) return false;
  const session = match[1];
  if (!session || !session.includes(".")) return false;
  const [encodedPayload, signature] = session.split(".");
  try {
    const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
    const expectedSig = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function PUT(req: Request) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (body.banners && Array.isArray(body.banners)) {
      // For simplicity: clear existing and insert new
      // In a production app, you might want to do upserts based on ID
      await HeroBanner.deleteMany({});
      
      const toInsert = body.banners.map((b: any) => {
        const { id, ...rest } = b; // Strip string id
        return rest;
      });
      
      const newDocs = await HeroBanner.insertMany(toInsert);
      
      const banners = newDocs.map(doc => ({
        ...doc.toObject(),
        id: doc._id.toString(),
        _id: undefined,
        __v: undefined,
      }));

      return NextResponse.json({ success: true, banners });
    }
    
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update banners:", error);
    return NextResponse.json({ error: "Failed to update banners" }, { status: 500 });
  }
}
