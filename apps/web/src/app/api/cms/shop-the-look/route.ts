import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ShopLook } from "@/lib/models/ShopLook";
import { isAdminRequest } from "@/lib/admin-auth";
import { isSafeMediaUrl } from "@/lib/hero";

export const dynamic = "force-dynamic";

/** Admin read of the saved look. The website reads the same record server-side. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const doc = (await ShopLook.findOne().lean()) as any;
    if (!doc) return NextResponse.json({ state: "empty", look: null });
    const { _id, __v, createdAt, updatedAt, ...look } = doc;
    return NextResponse.json({ state: "ok", look });
  } catch (error) {
    console.error("[cms] GET shop-the-look failed:", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
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
    const stored = (await ShopLook.findOne().lean()) as any;
    const { _id, __v, createdAt, updatedAt, ...saved } = stored;
    return NextResponse.json({ success: true, look: saved });
  } catch (error) {
    console.error("[cms] PUT shop-the-look failed:", error);
    return NextResponse.json({ error: "Database write failed. Nothing was changed." }, { status: 500 });
  }
}
