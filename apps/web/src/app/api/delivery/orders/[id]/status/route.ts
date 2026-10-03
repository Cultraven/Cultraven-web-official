import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isDeliveryRequest, isAdminRequest } from "@/lib/admin-auth";
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

  let body: { status?: string; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

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
