import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CmsSection } from "@/lib/models/CmsSection";
import { isAdminRequest } from "@/lib/admin-auth";
import { SECTION_MAP, validateFields } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

/**
 * Admin read — returns the saved database record (including hidden/scheduled items).
 * The public site reads the same record server-side via lib/cms/server.ts.
 */
export async function GET(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;
  if (!SECTION_MAP[key]) return NextResponse.json({ error: "Unknown section" }, { status: 404 });

  try {
    await connectToDatabase();
    const doc = (await CmsSection.findOne({ key }).lean()) as any;
    return NextResponse.json(
      { key, state: doc ? "ok" : "empty", data: doc?.data ?? null, updatedAt: doc?.updatedAt ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(`[cms] GET ${key} failed:`, error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

/** Admin save: validate → write to MongoDB → revalidate → return the record as stored. */
export async function PUT(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;
  const def = SECTION_MAP[key];
  if (!def) return NextResponse.json({ error: "Unknown section" }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { value, errors } = validateFields(def.fields, body?.data);
  if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

  try {
    await connectToDatabase();
    await CmsSection.updateOne({ key }, { $set: { data: value } }, { upsert: true });
    const stored = (await CmsSection.findOne({ key }).lean()) as any;
    return NextResponse.json({ success: true, key, state: "ok", data: stored.data, updatedAt: stored.updatedAt });
  } catch (error) {
    console.error(`[cms] PUT ${key} failed:`, error);
    return NextResponse.json({ error: "Database write failed. Nothing was changed." }, { status: 500 });
  }
}
