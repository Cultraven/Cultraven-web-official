import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";

const MOCK_ORDERS = [
  {
    id: "ORD-9283",
    customer: "Aditya Sharma",
    email: "aditya@example.com",
    items: 2,
    total: "₹4,998",
    status: "Processing",
    paymentMethod: "UPI",
    date: "Oct 24, 2023",
  },
  {
    id: "ORD-9284",
    customer: "Priya Patel",
    email: "priya@example.com",
    items: 1,
    total: "₹1,999",
    status: "Shipped",
    paymentMethod: "Credit Card",
    date: "Oct 23, 2023",
  }
];

export async function GET() {
  try {
    await connectToDatabase();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100).lean();
    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: MOCK_ORDERS });
    }
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders, falling back to mock:", error);
    return NextResponse.json({ orders: MOCK_ORDERS });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const newOrder = await Order.create(body);
    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
