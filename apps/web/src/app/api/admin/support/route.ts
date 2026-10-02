import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { SupportMessage, supportRef } from "@/lib/models/SupportMessage";
import { isAdminRequest } from "@/lib/admin-auth";
import { isObjectIdString, isSameOrigin, parseJsonBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

/** GET — latest 100 support messages (newest first). Admin-only. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const docs = (await SupportMessage.find({}).sort({ createdAt: -1 }).limit(100).lean()) as any[];
    return NextResponse.json({
      messages: docs.map((d) => ({ id: String(d._id), ref: supportRef(String(d._id)), name: d.name, email: d.email, phone: d.phone, subject: d.subject, message: d.message, orderRef: d.orderRef, status: d.status, at: d.createdAt })),
    }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Could not load messages" }, { status: 500 });
  }
}

const Patch = z.object({ id: z.string(), status: z.enum(["new", "open", "resolved"]) });

/** PATCH — set a message's status. Admin-only, same-origin only. */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const p = Patch.safeParse(body.data);
  if (!p.success || !isObjectIdString(p.data.id)) return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  try {
    await connectToDatabase();
    const r = await SupportMessage.findByIdAndUpdate(p.data.id, { $set: { status: p.data.status } }, { new: true }).lean();
    if (!r) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not update the message" }, { status: 500 });
  }
}
