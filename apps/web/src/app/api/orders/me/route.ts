import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { customerFromRequest } from "@/lib/customer-auth";
import { customerOrderView } from "@/lib/order-view";

export const dynamic = "force-dynamic";

/** GET — the signed-in customer's orders (newest first) in the same trimmed shape as the order page. */
export async function GET(req: NextRequest) {
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const orders = await Order.find({ userId: me.userId }).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ orders: orders.map(customerOrderView) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch orders:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
