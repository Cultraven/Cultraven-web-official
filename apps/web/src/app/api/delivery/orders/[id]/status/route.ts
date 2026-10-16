import { NextRequest, NextResponse, after } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { isDeliveryRequest, isAdminRequest, getDeliveryPayload } from "@/lib/admin-auth";
import { parseJsonBody } from "@/lib/sanitize";
import { notifyStatusChange } from "@/lib/order-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // email is sent after the response: leave room for a slow mail server

// Delivery staff may only move to these statuses
const ALLOWED = ["out_for_delivery", "delivered", "delivery_failed"] as const;
// ...and only on an order that is still on its way (the same list the delivery screen shows), so a finished or cancelled order can't be revived
const ACTIVE = ["confirmed", "packed", "on_hold", "shipped", "out_for_delivery", "delivery_failed"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = isAdminRequest(req);
  if (!admin && !isDeliveryRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const parsed = await parseJsonBody(req, 4 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const body = parsed.data as { status?: string; note?: string };
  if (body.note && typeof body.note === "string" && body.note.length > 500) {
    return NextResponse.json({ error: "Note must be 500 characters or less" }, { status: 422 });
  }

  const status = body.status as typeof ALLOWED[number];
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${ALLOWED.join(", ")}` }, { status: 422 });
  }

  try {
    await connectToDatabase();

    // Like the order list, only approved delivery staff may change an order.
    if (!admin) {
      const me = getDeliveryPayload(req);
      const u = me ? ((await User.findById(me.userId).select("verificationStatus").lean()) as any) : null;
      if (!u || u.verificationStatus !== "approved") return NextResponse.json({ error: "Your delivery account is not approved yet" }, { status: 403 });
    }

    const cur = (await Order.findById(id).select("fulfillmentStatus paymentMethod paymentStatus").lean()) as any;
    if (!cur) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // Pressing the same button twice is harmless and does not email the customer twice.
    if (cur.fulfillmentStatus === status) return NextResponse.json({ ok: true, fulfillmentStatus: status, unchanged: true });
    if (!ACTIVE.includes(cur.fulfillmentStatus)) {
      return NextResponse.json({ error: `This order is "${cur.fulfillmentStatus}" and can't be changed from the delivery screen.` }, { status: 409 });
    }

    const now = new Date();
    const $set: Record<string, unknown> = { fulfillmentStatus: status };
    if (status === "delivered") {
      $set.deliveredAt = now;
      if (cur.paymentMethod === "cod" && cur.paymentStatus === "pending") $set.paymentStatus = "paid"; // cash collected at the door
    }
    // Compare-and-set on the status we just read, so two taps (or an admin change at the same moment) can't both win.
    const order = (await Order.findOneAndUpdate(
      { _id: id, fulfillmentStatus: cur.fulfillmentStatus },
      { $set, $push: { statusHistory: { status, note: body.note ?? "", at: now, by: "admin" } } },
      { new: true }
    ).select("_id fulfillmentStatus").lean()) as any;
    if (!order) return NextResponse.json({ error: "The order changed while you were updating it — refresh and try again." }, { status: 409 });

    // The customer hears about it.
    after(() => notifyStatusChange(id, { status }));
    return NextResponse.json({ ok: true, fulfillmentStatus: order.fulfillmentStatus });
  } catch (err) {
    console.error("[delivery/orders/:id/status] PATCH failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
