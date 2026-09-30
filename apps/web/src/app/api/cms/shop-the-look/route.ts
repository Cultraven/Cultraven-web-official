import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ShopLook } from "@/lib/models/ShopLook";
import { isAdminRequest } from "@/lib/admin-auth";
import { isSafeMediaUrl } from "@/lib/hero";

const DEFAULT_LOOK = {
  lookLabel: "LOOK 01",
  modelImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=85",
  products: [
    { id: "l1", title: "RAVEN OVERSIZED TEE — ACID BLACK", category: "T-SHIRT", href: "/products/raven-oversized-tee-acid-black", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80", pricePaise: 199900, color: "Acid Black" },
    { id: "l2", title: "CARGO WIDE LEG — MILITARY OLIVE", category: "CARGO", href: "/products/cargo-wide-leg-military-olive", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&auto=format&fit=crop&q=80", pricePaise: 349900, color: "Military Olive" },
    { id: "l3", title: "ESSENTIALS HOODIE — WASHED NAVY", category: "HOODIE", href: "/products/essentials-hoodie-washed-navy", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&auto=format&fit=crop&q=80", pricePaise: 319900, color: "Washed Navy" },
  ],
};

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
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const look = body?.look;
    if (!look || typeof look !== "object" || !Array.isArray(look.products) || look.products.length > 12) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    if (!isSafeMediaUrl(look.modelImage ?? "") || look.products.some((p: any) => !isSafeMediaUrl(p?.image, false))) {
      return NextResponse.json({ error: "One or more image URLs are invalid (https:// or uploaded file only)" }, { status: 400 });
    }
    await connectToDatabase();
    // Replace in place (never delete first) so a failed save cannot wipe the existing look.
    await ShopLook.findOneAndReplace({}, look, { upsert: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save shop-the-look:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
