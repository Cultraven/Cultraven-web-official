import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { EmailLog } from "@/lib/models/Setting";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** GET — the last 40 outgoing email attempts (no bodies, no secrets): what was sent, skipped or failed, and why. Admin-only. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const logs = (await EmailLog.find({}).sort({ createdAt: -1 }).limit(40).lean()) as any[];
    return NextResponse.json({ logs: logs.map((l) => ({ id: String(l._id), kind: l.kind, to: l.to, subject: l.subject, status: l.status, error: l.error ?? "", orderId: l.orderId ?? "", at: l.createdAt })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load the email log" }, { status: 500 });
  }
}
