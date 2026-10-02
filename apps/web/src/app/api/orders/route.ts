import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { isAdminRequest } from "@/lib/admin-auth";


export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const orders = await Order.find()
      .select("orderNumber userId subtotalPaise discountPaise shippingPaise codFeePaise totalPaise paymentMethod paymentStatus fulfillmentStatus items createdAt deliveryAddress.name deliveryAddress.email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const mapped = orders.map((o: any) => ({
      id: o._id?.toString() || o.orderNumber,
      customer: o.deliveryAddress?.name || "Unknown",
      email: o.deliveryAddress?.email || "",
      items: o.items?.length ?? 0,
      totalPaise: o.totalPaise ?? 0,
      total: o.totalPaise ? `₹${(o.totalPaise / 100).toLocaleString("en-IN")}` : "—",
      status: o.fulfillmentStatus || o.paymentStatus || "Processing",
      paymentMethod: o.paymentMethod || "—",
      date: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "—",
    }));

    return NextResponse.json({ orders: mapped });
  } catch (error) {
    console.error("[orders] Failed to fetch orders:", error);
    return NextResponse.json({ error: "Orders unavailable", orders: [] }, { status: 503 });
  }
}

/** Orders are only ever created server-priced via /api/razorpay/create-order; no mass-assignment endpoint. */
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
