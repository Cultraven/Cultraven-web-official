import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Review } from "@/lib/models/Review";
import { Product } from "@/lib/models/Product";
import { customerFromRequest } from "@/lib/customer-auth";
import { buildPending, PENDING_WINDOW_DAYS } from "@/lib/review-pending";

export const dynamic = "force-dynamic";

/** GET — delivered items the signed-in customer hasn't reviewed yet (powers the "How was it?" popup). Visitors get an empty list. */
export async function GET(req: NextRequest) {
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  try {
    await connectToDatabase();
    const since = new Date(Date.now() - PENDING_WINDOW_DAYS * 86_400_000);
    const orders = (await Order.find({ userId: me.userId, fulfillmentStatus: "delivered", deliveredAt: { $gte: since } }).sort({ deliveredAt: -1 }).limit(20).select("fulfillmentStatus deliveredAt items.productId items.size").lean()) as any[];
    const ids = Array.from(new Set(orders.flatMap((o) => (o.items ?? []).map((i: any) => String(i.productId)))));
    if (!ids.length) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    const [reviews, prods] = await Promise.all([
      Review.find({ userId: me.userId, productId: { $in: ids } }).select("productId").lean() as Promise<any[]>,
      Product.find({ _id: { $in: ids.filter((i) => /^[a-f0-9]{24}$/i.test(i)) } }).select("slug title image").lean() as Promise<any[]>,
    ]);
    const reviewed = new Set(reviews.map((r) => String(r.productId)));
    const products = new Map(prods.map((p) => [String(p._id), { slug: p.slug, title: p.title, image: p.image }]));
    return NextResponse.json({ items: buildPending(orders, reviewed, products) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[reviews/pending] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
