import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { ShopLook } from "@/lib/models/ShopLook";

const DEFAULT_LOOK = {
  lookLabel: "LOOK 01",
  modelImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=85",
  products: [
    { id: "l1", title: "RAVEN OVERSIZED TEE — ACID BLACK", category: "T-SHIRT", href: "/products/raven-oversized-tee-acid-black", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80", pricePaise: 199900, color: "Acid Black" },
    { id: "l2", title: "CARGO WIDE LEG — MILITARY OLIVE", category: "CARGO", href: "/products/cargo-wide-leg-military-olive", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&auto=format&fit=crop&q=80", pricePaise: 349900, color: "Military Olive" },
    { id: "l3", title: "ESSENTIALS HOODIE — WASHED NAVY", category: "HOODIE", href: "/products/essentials-hoodie-washed-navy", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&auto=format&fit=crop&q=80", pricePaise: 319900, color: "Washed Navy" },
  ],
};

function verifyAdminToken(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  const match = cookies.match(/cultraven_session=([^;]+)/);
  if (!match) return false;
  const session = match[1];
  if (!session?.includes(".")) return false;
  const [encodedPayload, signature] = session.split(".");
  try {
    const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
    const expectedSig = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return false;
    return payload.role === "admin";
  } catch { return false; }
}

export async function GET() {
  try {
    await connectToDatabase();
    const doc = await ShopLook.findOne().lean() as any;
    if (!doc) return NextResponse.json({ look: DEFAULT_LOOK });
    const { _id, __v, createdAt, updatedAt, ...look } = doc;
    return NextResponse.json({ look });
  } catch {
    return NextResponse.json({ look: DEFAULT_LOOK });
  }
}

export async function PUT(req: Request) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (!body.look) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    await connectToDatabase();
    await ShopLook.deleteMany({});
    await ShopLook.create(body.look);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save shop-the-look:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
