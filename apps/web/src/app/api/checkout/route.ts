import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";

const ItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  title: z.string().min(1),
  image: z.string().min(1),
  size: z.string().min(1),
  color: z.string().default(""),
  pricePaise: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const CheckoutSchema = z.object({
  items: z.array(ItemSchema).min(1),
  deliveryAddress: z.object({
    name: z.string().min(2).max(100),
    line1: z.string().min(3).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    pincode: z.string().regex(/^\d{6}$/),
    phone: z.string().regex(/^\d{10}$/),
  }),
  paymentMethod: z.enum(["razorpay", "cod"]).default("cod"),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { items, deliveryAddress, paymentMethod } = parsed.data;

  // Calculate pricing
  const subtotalPaise = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const FREE_SHIPPING = 199900;
  const SHIPPING_FEE = 9900;
  const COD_FEE = 4900;
  const shippingPaise = subtotalPaise >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  const codFeePaise = paymentMethod === "cod" ? COD_FEE : 0;
  const totalPaise = subtotalPaise + shippingPaise + codFeePaise;

  try {
    await connectToDatabase();

    const order = await Order.create({
      userId: "guest",
      items,
      subtotalPaise,
      discountPaise: 0,
      shippingPaise,
      codFeePaise,
      totalPaise,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      fulfillmentStatus: "processing",
      statusHistory: [{ status: "processing", at: new Date() }],
    });

    return NextResponse.json({
      success: true,
      orderId: order._id.toString(),
      orderNumber: `CR-${order._id.toString().slice(-6).toUpperCase()}`,
      totalPaise,
      paymentMethod,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 });
  }
}
