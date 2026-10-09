import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getAdminUserId, isAdminRequest, isSuperAdminRequest } from "@/lib/admin-auth";
import { releaseOrderStock } from "@/lib/inventory";
import { isObjectIdString, isSameOrigin, parseJsonBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/** Orders that haven't left the warehouse yet: deleting one puts its reserved stock back on the shelf. */
const NOT_SHIPPED_YET = ["processing", "confirmed", "packed", "on_hold", "shipped", "out_for_delivery", "delivery_failed"];

const Body = z.object({ ids: z.array(z.string()).min(1, "Pick at least one order").max(200, "Delete at most 200 orders at a time"), confirm: z.literal("DELETE", { errorMap: () => ({ message: 'Type DELETE to confirm' }) }) }).strict();

/**
 * DELETE /api/admin/orders — permanently removes the given orders ({ ids: [...], confirm: "DELETE" }).
 * Super admin only (orders are the shop's sales records). Before anything is removed, a full copy of each order is saved to the
 * `deletedorders` collection, so a mistake can still be recovered from the database.
 */
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdminRequest(req)) return NextResponse.json({ error: "Only the owner (super admin) can delete orders." }, { status: 403 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = await parseJsonBody(req, 32 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const p = Body.safeParse(parsed.data);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  const ids = Array.from(new Set(p.data.ids));
  if (!ids.every(isObjectIdString)) return NextResponse.json({ error: "Invalid order id" }, { status: 422 });

  try {
    await connectToDatabase();
    const docs = (await Order.find({ _id: { $in: ids } }).lean()) as any[];
    if (docs.length === 0) return NextResponse.json({ error: "Those orders no longer exist." }, { status: 404 });

    // 1) safety copy
    const by = getAdminUserId(req) ?? "admin";
    const at = new Date();
    await mongoose.connection.collection("deletedorders").bulkWrite(
      docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: { ...d, deletedAt: at, deletedBy: by }, upsert: true } })),
    );
    // 2) stock back on the shelf for orders that never shipped out (safe to repeat: the helper releases only once)
    let stockReleased = 0;
    for (const d of docs) if (NOT_SHIPPED_YET.includes(String(d.fulfillmentStatus)) && (await releaseOrderStock(String(d._id)))) stockReleased++;
    // 3) delete
    const r = await Order.deleteMany({ _id: { $in: docs.map((d) => d._id) } });
    return NextResponse.json({ ok: true, deleted: r.deletedCount ?? 0, stockReleased });
  } catch (e) {
    console.error("[admin/orders] DELETE failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not delete the orders. Nothing was lost — please try again." }, { status: 500 });
  }
}
