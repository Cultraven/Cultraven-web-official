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

export async function GET() {
  try {
    await connectToDatabase();
    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
