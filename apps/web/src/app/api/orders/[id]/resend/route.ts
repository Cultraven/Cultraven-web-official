import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { validId } from "@/lib/order-view";
import { resendOrderConfirmation } from "@/lib/order-notify";

export const dynamic = "force-dynamic";

// One resend per order per 15 seconds (in-memory) so the button can't be used to spam a customer.
const last = new Map<string, number>();

/** POST — admin: email the customer their order confirmation + receipt again. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const now = Date.now();
  if (now - (last.get(id) ?? 0) < 15_000) return NextResponse.json({ error: "Just sent — please wait a few seconds" }, { status: 429 });
  last.set(id, now);
  const r = await resendOrderConfirmation(id);
  return r.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: r.reason ?? "Could not send" }, { status: r.reason === "Order not found" ? 404 : 422 });
}
