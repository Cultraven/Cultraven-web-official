import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ShopLook } from "@/lib/models/ShopLook";
import { isAdminRequest } from "@/lib/admin-auth";
import { isSafeMediaUrl } from "@/lib/hero";
import { isSameOrigin, parseJsonBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/** A link must be a site path (not protocol-relative, no backslash tricks) or https. javascript:/data: can never be stored. */
const link = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((v) => {
    if (v.startsWith("/")) return !v.startsWith("//") && !v.includes("\\");
    try { return new URL(v).protocol === "https:"; } catch { return false; }
  }, "Links must start with / or https://");
const media = (allowEmpty: boolean) => z.string().max(2048).refine((v) => isSafeMediaUrl(v, allowEmpty), "One or more image URLs are invalid (https:// or uploaded file only)");

/** Whitelist: only these fields can be stored; everything else in the request is dropped. */
const LookSchema = z.object({
  lookLabel: z.string().trim().max(40).optional(),
  modelImage: media(true).optional(),
  products: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        title: z.string().trim().min(1).max(120),
        category: z.string().trim().max(60),
        href: link,
        image: media(false),
        pricePaise: z.number().finite().min(0).max(100_000_000).transform((n) => Math.round(n)),
        color: z.string().trim().max(60),
      })
    )
    .max(12),
});

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
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await parseJsonBody(req, 64 * 1024);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
    const parsed = LookSchema.safeParse(body.data.look);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message;
      return NextResponse.json({ error: msg && /image URLs|Links must/.test(msg) ? msg : "Invalid data" }, { status: 400 });
    }
    // Only validated, whitelisted fields reach the database (never the raw request object).
    const look = parsed.data;
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
