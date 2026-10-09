import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { isAdminRequest } from "@/lib/admin-auth";
import { isObjectIdString } from "@/lib/sanitize";
import { buildOrdersPdf, buildOrdersXlsx, toExportRow } from "@/lib/orders-export";

export const dynamic = "force-dynamic";

const MAX_IDS = 500;
const MAX_ALL = 5000;

/**
 * GET /api/admin/orders/export?format=xlsx|pdf[&ids=a,b,c] — admin only.
 * With `ids` it exports exactly those orders (what the admin has on screen / ticked); without, every order, newest first.
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = req.nextUrl.searchParams;
  const format = params.get("format");
  if (format !== "xlsx" && format !== "pdf") return NextResponse.json({ error: "format must be xlsx or pdf" }, { status: 400 });

  const idsParam = params.get("ids");
  let ids: string[] | null = null;
  if (idsParam !== null) {
    ids = Array.from(new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean)));
    if (ids.length === 0) return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    if (ids.length > MAX_IDS) return NextResponse.json({ error: `Pick at most ${MAX_IDS} orders at a time` }, { status: 400 });
    if (!ids.every(isObjectIdString)) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const docs = (await Order.find(ids ? { _id: { $in: ids } } : {})
      .select("items subtotalPaise discountPaise shippingPaise codFeePaise totalPaise paymentMethod paymentStatus fulfillmentStatus deliveryAddress courierName trackingNumber deliveredAt createdAt")
      .sort({ createdAt: -1 })
      .limit(ids ? MAX_IDS : MAX_ALL)
      .lean()) as any[];
    const rows = docs.map(toExportRow);
    const day = new Date().toISOString().slice(0, 10);
    const scope = ids ? `${rows.length} selected` : "All orders";

    const body = format === "xlsx" ? buildOrdersXlsx(rows) : Buffer.from(await buildOrdersPdf(rows, scope));
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf",
        "Content-Disposition": `attachment; filename="cultraven-orders-${day}.${format}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("[admin/orders/export] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not create the file. Please try again." }, { status: 500 });
  }
}
