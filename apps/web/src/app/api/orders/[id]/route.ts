import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { isAdminRequest } from "@/lib/admin-auth";
import { customerFromRequest } from "@/lib/customer-auth";
import { canAdminTransition, isOrderStatus, isBackward, ORDER_STATUSES, ADMIN_TRANSITIONS } from "@/lib/order-lifecycle";
import { customerOrderView, validId } from "@/lib/order-view";
import { notifyStatusChange } from "@/lib/order-notify";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };
type Ctx = { params: Promise<{ id: string }> };

/** GET — admin sees the full order; the customer who placed it sees a trimmed view with tracking + what they may do. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  // The storefront order page asks for ?view=customer so that someone signed in as BOTH admin and customer in one browser
  // still gets the customer shape there (and the admin panel keeps getting the full order).
  const asCustomer = req.nextUrl.searchParams.get("view") === "customer";
  const admin = !asCustomer && isAdminRequest(req);
  const me = admin ? null : customerFromRequest(req);
  if (!admin && !me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const order = (await Order.findById(id).lean()) as any;
    // Same answer for "doesn't exist" and "not yours" so ids can't be probed.
    if (!order || (!admin && order.userId !== me!.userId)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (admin) return NextResponse.json({ order: { ...order, allowedNext: ADMIN_TRANSITIONS[order.fulfillmentStatus as keyof typeof ADMIN_TRANSITIONS] ?? [] } }, { headers: NO_STORE });
    return NextResponse.json({ order: customerOrderView(order) }, { headers: NO_STORE });
  } catch (err) {
    console.error("[orders/id] GET failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

const Text = (max: number) => z.string().trim().max(max);
const UpdateSchema = z.object({
  fulfillmentStatus: z.enum(ORDER_STATUSES).optional(),
  note: Text(300).optional(),
  courierName: Text(60).optional(),
  trackingNumber: Text(60).regex(/^[A-Za-z0-9\-_/ ]*$/, "Tracking number has invalid characters").optional(),
  trackingUrl: Text(300).refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Tracking link must start with http(s)://").optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refund_pending", "refunded"]).optional(),
  notify: z.boolean().optional(),
});

/** PUT — admin: move the order along its workflow, add courier/tracking, record payment/refund. The customer is emailed. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const p = UpdateSchema.safeParse(raw);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid update", issues: p.error.flatten().fieldErrors }, { status: 422 });
  const d = p.data;
  if (d.fulfillmentStatus === undefined && d.courierName === undefined && d.trackingNumber === undefined && d.trackingUrl === undefined && d.paymentStatus === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const cur = (await Order.findById(id).lean()) as any;
    if (!cur) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const from = cur.fulfillmentStatus as string;

    const $set: Record<string, unknown> = {};
    const now = new Date();
    const changedStatus = d.fulfillmentStatus !== undefined && d.fulfillmentStatus !== from;

    if (changedStatus) {
      const to = d.fulfillmentStatus!;
      if (!canAdminTransition(from, to)) {
        const allowed = isOrderStatus(from) ? ADMIN_TRANSITIONS[from] : [];
        return NextResponse.json({ error: `Can't move an order from "${from}" to "${to}".${allowed.length ? ` Allowed next: ${allowed.join(", ")}.` : " This order is finished."}` }, { status: 409 });
      }
      if ((to === "cancelled" || (from === "return_requested" && to === "delivered")) && !d.note) {
        return NextResponse.json({ error: to === "cancelled" ? "Add a note with the cancellation reason" : "Add a note explaining why the return was rejected" }, { status: 422 });
      }
      $set.fulfillmentStatus = to;
      if (isBackward(from, to)) {
        // Correcting a mis-click: undo what the forward step stamped.
        if (from === "delivered") {
          $set.deliveredAt = null;
          if (cur.paymentMethod === "cod" && cur.paymentStatus === "paid") $set.paymentStatus = "pending";
        }
      }
      if (to === "delivered" && from !== "return_requested") {
        $set.deliveredAt = now;
        if (cur.paymentMethod === "cod" && cur.paymentStatus === "pending") $set.paymentStatus = "paid"; // cash collected by the courier
      }
      if (to === "cancelled") {
        $set.cancelledAt = now;
        $set.cancelReason = d.note;
        if (cur.paymentStatus === "paid") $set.paymentStatus = "refund_pending";
      }
      if (to === "returned" && cur.paymentStatus === "paid") $set.paymentStatus = "refund_pending";
    }
    if (d.courierName !== undefined) $set.courierName = d.courierName;
    if (d.trackingNumber !== undefined) $set.trackingNumber = d.trackingNumber;
    if (d.trackingUrl !== undefined) $set.trackingUrl = d.trackingUrl;
    if (d.paymentStatus !== undefined) $set.paymentStatus = d.paymentStatus;

    const trackingChanged =
      (d.courierName !== undefined && d.courierName !== (cur.courierName ?? "")) ||
      (d.trackingNumber !== undefined && d.trackingNumber !== (cur.trackingNumber ?? "")) ||
      (d.trackingUrl !== undefined && d.trackingUrl !== (cur.trackingUrl ?? ""));
    const backward = changedStatus && isBackward(from, d.fulfillmentStatus!);
    const status = (changedStatus ? d.fulfillmentStatus : from) as string;
    const noteBits = [
      d.note,
      !changedStatus && trackingChanged ? "Tracking details updated" : "",
      backward ? "Status corrected (moved back)" : "",
      d.paymentStatus !== undefined && d.paymentStatus !== cur.paymentStatus ? `Payment marked ${d.paymentStatus.replace("_", " ")}` : "",
    ].filter(Boolean);

    const update: Record<string, unknown> = { $set };
    if (changedStatus || trackingChanged || noteBits.length) update.$push = { statusHistory: { status, note: noteBits.join(" · ") || undefined, at: now, by: "admin" } };

    // Compare-and-set on the status we validated against, so two admins can't both apply conflicting moves.
    const updated = (await Order.findOneAndUpdate({ _id: id, fulfillmentStatus: from }, update, { new: true }).lean()) as any;
    if (!updated) return NextResponse.json({ error: "The order changed while you were editing — refresh and try again." }, { status: 409 });

    // A correction of a mis-click isn't news to the customer unless the admin explicitly asks to notify.
    const shouldNotify = d.notify === true || (d.notify !== false && !backward);
    if (shouldNotify && (changedStatus || trackingChanged)) {
      after(() => notifyStatusChange(id, { status, note: d.note }));
    }
    return NextResponse.json({ success: true, order: { ...updated, allowedNext: ADMIN_TRANSITIONS[updated.fulfillmentStatus as keyof typeof ADMIN_TRANSITIONS] ?? [] } }, { headers: NO_STORE });
  } catch (err) {
    console.error("[orders/id] PUT failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
