import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isDeliveryRequest, isAdminRequest } from "@/lib/admin-auth";
import { parseJsonBody } from "@/lib/sanitize";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// Delivery staff may only move to these statuses
const ALLOWED = ["out_for_delivery", "delivered", "delivery_failed"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isDeliveryRequest(req) && !isAdminRequest(req)) {
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
    const Order = mongoose.models.Order;
    if (!Order) return NextResponse.json({ error: "Order model not found" }, { status: 500 });

    const update: any = {
      fulfillmentStatus: status,
      $push: {
        statusHistory: { status, note: body.note ?? "", at: new Date(), by: "admin" },
      },
    };
    if (status === "delivered") update.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(id, update, { new: true })
      .select("_id fulfillmentStatus")
      .lean() as any;

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true, fulfillmentStatus: order.fulfillmentStatus });
  } catch (err) {
    console.error("[delivery/orders/:id/status] PATCH failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
