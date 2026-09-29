import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import crypto from "crypto";
import { z } from "zod";

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await connectToDatabase();
    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  fulfillmentStatus: z.enum(["processing", "shipped", "delivered", "cancelled"]),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    await connectToDatabase();
    const order = await Order.findByIdAndUpdate(
      id,
      { fulfillmentStatus: parsed.data.fulfillmentStatus },
      { new: true }
    );

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
