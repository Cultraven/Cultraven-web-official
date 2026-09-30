import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import crypto from "crypto";

function verifyAdminToken(req: NextRequest): boolean {
  const session = req.cookies.get("cultraven_session")?.value;
  if (!session || !session.includes(".")) return false;
  const [encodedPayload, signature] = session.split(".");
  try {
    const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
    const expectedSig = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}

const MOCK_ORDERS = [
  {
    id: "ORD-001",
    customer: "Rohan Sharma",
    email: "rohan@example.com",
    items: 2,
    total: "₹3,498",
    status: "Processing",
    paymentMethod: "UPI",
    date: "2026-09-29",
  },
  {
    id: "ORD-002",
    customer: "Priya Mehta",
    email: "priya@example.com",
    items: 1,
    total: "₹1,999",
    status: "Shipped",
    paymentMethod: "Card",
    date: "2026-09-28",
  },
  {
    id: "ORD-003",
    customer: "Arjun Kapoor",
    email: "arjun@example.com",
    items: 3,
    total: "₹6,497",
    status: "Delivered",
    paymentMethod: "COD",
    date: "2026-09-27",
  },
];

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const orders = await Order.find()
      .select("orderNumber userId subtotalPaise discountPaise shippingPaise codFeePaise totalPaise paymentMethod paymentStatus fulfillmentStatus createdAt deliveryAddress.name deliveryAddress.email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const mapped = orders.map((o: any) => ({
      id: o._id?.toString() || o.orderNumber,
      customer: o.deliveryAddress?.name || "Unknown",
      email: o.deliveryAddress?.email || "",
      items: 1,
      total: o.totalPaise ? `₹${(o.totalPaise / 100).toLocaleString("en-IN")}` : "—",
      status: o.fulfillmentStatus || o.paymentStatus || "Processing",
      paymentMethod: o.paymentMethod || "—",
      date: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "—",
    }));

    return NextResponse.json({ orders: mapped.length > 0 ? mapped : MOCK_ORDERS });
  } catch (error) {
    console.error("Failed to fetch orders, using mock:", error);
    return NextResponse.json({ orders: MOCK_ORDERS });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
