import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { isAdminRequest } from "@/lib/admin-auth";
import { validId } from "@/lib/order-view";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:id/feedback — admin only. The customer reviews written for this order (each review remembers the order it
 * came from). An admin removes one with DELETE /api/reviews/:id, which also refreshes the product's star rating.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  try {
    await connectToDatabase();
    const rows = (await Review.find({ orderId: id }).sort({ createdAt: -1 }).limit(50).lean()) as any[];
    return NextResponse.json(
      { reviews: rows.map((r) => ({ id: String(r._id), productId: r.productId, slug: r.slug, name: r.name, rating: r.rating, title: r.title, comment: r.comment, size: r.size, createdAt: r.createdAt })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[orders/feedback] GET failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load feedback" }, { status: 500 });
  }
}
