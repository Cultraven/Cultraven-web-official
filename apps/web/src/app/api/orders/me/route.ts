import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { customerFromRequest } from "@/lib/customer-auth";

export async function GET(req: NextRequest) {
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const orders = await Order.find({ userId: me.userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
