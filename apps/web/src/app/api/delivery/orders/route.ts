import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isDeliveryRequest, isAdminRequest } from "@/lib/admin-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// Orders relevant to delivery staff: everything not yet delivered/cancelled
const DELIVERY_STATUSES = ["confirmed", "packed", "on_hold", "shipped", "out_for_delivery", "delivery_failed"];

export async function GET(req: NextRequest) {
  if (!isDeliveryRequest(req) && !isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);

  try {
    await connectToDatabase();
    const Order = mongoose.models.Order;
    if (!Order) return NextResponse.json({ orders: [] });

    const filter: any = { fulfillmentStatus: { $in: DELIVERY_STATUSES } };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ "deliveryAddress.name": rx }, { "deliveryAddress.phone": rx }];
    }

    const orders = await Order.find(filter)
      .select("_id items totalPaise fulfillmentStatus paymentMethod deliveryAddress createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean() as any[];

    return NextResponse.json({
      orders: orders.map((o: any) => ({
        id: o._id.toString(),
        orderNumber: `CR-${o._id.toString().slice(-6).toUpperCase()}`,
        items: (o.items ?? []).map((i: any) => ({ title: i.title, size: i.size, color: i.color ?? "", quantity: i.quantity })),
        totalPaise: o.totalPaise,
        fulfillmentStatus: o.fulfillmentStatus,
        paymentMethod: o.paymentMethod,
        address: {
          name: o.deliveryAddress?.name ?? "",
          line1: o.deliveryAddress?.line1 ?? "",
          line2: o.deliveryAddress?.line2 ?? "",
          city: o.deliveryAddress?.city ?? "",
          state: o.deliveryAddress?.state ?? "",
          pincode: o.deliveryAddress?.pincode ?? "",
          phone: o.deliveryAddress?.phone ?? "",
        },
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error("[delivery/orders] GET failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
