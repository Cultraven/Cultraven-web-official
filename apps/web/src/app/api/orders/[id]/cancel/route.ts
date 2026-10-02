import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { customerFromRequest } from "@/lib/customer-auth";
import { cancelEligibility, CANCEL_WINDOW_DAYS } from "@/lib/order-lifecycle";
import { validId } from "@/lib/order-view";
import { notifyStatusChange, notifyAdminCustomerAction } from "@/lib/order-notify";

export const dynamic = "force-dynamic";

const Body = z.object({ reason: z.string().trim().min(3, "Please choose a reason").max(120), note: z.string().trim().max(200).optional() });

/** POST — the customer cancels their own order (before it ships, within 7 days). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const p = Body.safeParse(raw);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  const reason = p.data.note ? `${p.data.reason} — ${p.data.note}` : p.data.reason;

  try {
    await connectToDatabase();
    const cur = (await Order.findOne({ _id: id, userId: me.userId }).lean()) as any;
    if (!cur) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const el = cancelEligibility({ fulfillmentStatus: cur.fulfillmentStatus, createdAt: cur.createdAt });
    if (!el.ok) return NextResponse.json({ error: el.reason }, { status: 409 });

    const now = new Date();
    const cutoff = new Date(now.getTime() - CANCEL_WINDOW_DAYS * 86_400_000);
    // Atomic: only succeeds if the order is still unshipped and inside the window at this very moment.
    const upd = (await Order.findOneAndUpdate(
      { _id: id, userId: me.userId, fulfillmentStatus: { $in: ["processing", "confirmed"] }, createdAt: { $gte: cutoff } },
      {
        $set: { fulfillmentStatus: "cancelled", cancelledAt: now, cancelReason: reason, ...(cur.paymentStatus === "paid" ? { paymentStatus: "refund_pending" } : {}) },
        $push: { statusHistory: { status: "cancelled", note: reason, at: now, by: "customer" } },
      },
      { new: true }
    ).lean()) as any;
    if (!upd) return NextResponse.json({ error: "This order can no longer be cancelled (it may have just shipped)." }, { status: 409 });

    after(async () => {
      await notifyStatusChange(id, { status: "cancelled", note: reason });
      await notifyAdminCustomerAction(id, "cancelled", reason);
    });
    return NextResponse.json({ success: true, refund: cur.paymentStatus === "paid" ? "A refund will be issued to your original payment method within 5–7 business days." : null });
  } catch (e) {
    console.error("[orders/cancel] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not cancel the order. Please try again." }, { status: 500 });
  }
}
