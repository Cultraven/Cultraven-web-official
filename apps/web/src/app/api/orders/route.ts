import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  id: String,
  customer: String,
  email: String,
  items: Number,
  total: String,
  status: String,
  paymentMethod: String,
  date: String,
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

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
    let orders = await Order.find().sort({ createdAt: -1 });
    if (!orders || orders.length === 0) {
      orders = MOCK_ORDERS;
    }
    return NextResponse.json({ orders });
  } catch (error: any) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
