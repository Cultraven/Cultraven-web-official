import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CmsSection } from "@/lib/models/CmsSection";
import { isAdminRequest } from "@/lib/admin-auth";
import { SECTION_MAP, validateFields } from "@/lib/cms/registry";
import { hasOwn, isSameOrigin, parseJsonBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

/**
 * Admin read — returns the saved database record (including hidden/scheduled items).
 * The public site reads the same record server-side via lib/cms/server.ts.
 */
export async function GET(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;
  // hasOwn: SECTION_MAP["constructor"] / ["__proto__"] must not count as a section
  if (!hasOwn(SECTION_MAP, key)) return NextResponse.json({ error: "Unknown section" }, { status: 404 });

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
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { key } = await params;
  const def = hasOwn(SECTION_MAP, key) ? SECTION_MAP[key] : undefined;
  if (!def) return NextResponse.json({ error: "Unknown section" }, { status: 404 });

  // Size cap, JSON only, no $-operator / prototype keys; validateFields then whitelists keys and bounds every value
  const parsedBody = await parseJsonBody(req, 512 * 1024);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  const body: any = parsedBody.data;

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
