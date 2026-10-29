/**
 * Admin · Subscribers: the people who asked (on the website) to be told about new drops.
 *   GET    list (newest first) with counts. Optional ?q= (part of an email) and ?status=subscribed|unsubscribed
 *   POST   add one by hand            { email, interest?, note? }
 *   PATCH  change status / note       { id, status?, note? }
 *   DELETE remove people              { ids: [...] }
 * Admin-only; every change must come from the admin site itself (same-origin).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { isAdminRequest } from "@/lib/admin-auth";
import { isObjectIdString, isSameOrigin, parseJsonBody, stripControlChars } from "@/lib/sanitize";
import { escapeRegex, interestField, toRow } from "@/lib/subscribers";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };
const LIMIT = 1000;

const note = z.string().max(600).transform((v) => stripControlChars(v).replace(/\s+/g, " ").trim().slice(0, 300));

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
    const status = req.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (q) filter.email = { $regex: escapeRegex(q.toLowerCase()) };
    if (status === "subscribed" || status === "unsubscribed") filter.status = status === "unsubscribed" ? "unsubscribed" : { $ne: "unsubscribed" };
    const [docs, all, unsubscribed] = await Promise.all([
      NewsletterSubscriber.find(filter).sort({ createdAt: -1 }).limit(LIMIT).lean() as Promise<any[]>,
      NewsletterSubscriber.countDocuments({}),
      NewsletterSubscriber.countDocuments({ status: "unsubscribed" }),
    ]);
    return NextResponse.json({ subscribers: docs.map(toRow), counts: { all: Number(all), subscribed: Number(all) - Number(unsubscribed), unsubscribed: Number(unsubscribed) }, limit: LIMIT }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Could not load the subscribers" }, { status: 500 });
  }
}

const Add = z.object({
  email: z.string().trim().max(254, "That email is too long").email("Please enter a valid email address").toLowerCase(),
  interest: interestField,
  note: note.optional(),
});

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await parseJsonBody(req, 4 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const p = Add.safeParse(body.data);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  try {
    await connectToDatabase();
    const res = await NewsletterSubscriber.updateOne(
      { email: p.data.email },
      { $setOnInsert: { email: p.data.email, source: "admin", interest: p.data.interest ?? "", note: p.data.note ?? "", page: "", status: "subscribed" } },
      { upsert: true }
    );
    if (!res?.upsertedCount) return NextResponse.json({ error: "That email is already on the list." }, { status: 409 });
    const doc = (await NewsletterSubscriber.findOne({ email: p.data.email }).lean()) as any;
    return NextResponse.json({ success: true, subscriber: toRow(doc) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not add that email. Nothing was changed." }, { status: 500 });
  }
}

const Patch = z.object({ id: z.string(), status: z.enum(["subscribed", "unsubscribed"]).optional(), note: note.optional() }).refine((v) => v.status !== undefined || v.note !== undefined, { message: "Nothing to change" });

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await parseJsonBody(req, 4 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const p = Patch.safeParse(body.data);
  if (!p.success || !isObjectIdString(p.data.id)) return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  try {
    await connectToDatabase();
    const $set: Record<string, unknown> = {};
    if (p.data.status !== undefined) $set.status = p.data.status;
    if (p.data.note !== undefined) $set.note = p.data.note;
    const r = (await NewsletterSubscriber.findByIdAndUpdate(p.data.id, { $set }, { new: true }).lean()) as any;
    if (!r) return NextResponse.json({ error: "That person is no longer on the list." }, { status: 404 });
    return NextResponse.json({ success: true, subscriber: toRow(r) });
  } catch {
    return NextResponse.json({ error: "Could not update. Nothing was changed." }, { status: 500 });
  }
}

const Remove = z.object({ ids: z.array(z.string()).min(1, "Pick at least one person").max(100, "Remove at most 100 at a time") }).strict();

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await parseJsonBody(req, 8 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const p = Remove.safeParse(body.data);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  const ids = Array.from(new Set(p.data.ids));
  if (!ids.every(isObjectIdString)) return NextResponse.json({ error: "Invalid id" }, { status: 422 });
  try {
    await connectToDatabase();
    const r = await NewsletterSubscriber.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true, deleted: Number(r?.deletedCount ?? 0) });
  } catch {
    return NextResponse.json({ error: "Could not remove them. Nothing was changed." }, { status: 500 });
  }
}
