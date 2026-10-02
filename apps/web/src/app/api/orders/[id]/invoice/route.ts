import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { isAdminRequest } from "@/lib/admin-auth";
import { customerFromRequest } from "@/lib/customer-auth";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { orderNumber } from "@/lib/email-templates";
import { toMailOrder, validId } from "@/lib/order-view";

export const dynamic = "force-dynamic";

/** GET — the PDF receipt. Only the customer who placed the order, or an admin. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const admin = isAdminRequest(req);
  const me = admin ? null : customerFromRequest(req);
  if (!admin && !me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const o = (await Order.findById(id).lean()) as any;
    if (!o || (!admin && o.userId !== me!.userId)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const bytes = await buildInvoicePdf(toMailOrder(o));
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CULTRAVEN-receipt-${orderNumber(id)}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("[orders/invoice] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not build the receipt" }, { status: 500 });
  }
}
