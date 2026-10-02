import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { customerFromRequest } from "@/lib/customer-auth";
import { ReviewWriteSchema, publicName, averageRating } from "@/lib/review-schema";
import { syncProductRating } from "@/lib/reviews-server";
import { z } from "zod";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
/** Product slugs are lowercase letters, digits and dashes (see ProductWriteSchema); nothing else is ever looked up. */
const SLUG = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Invalid product");
const WriteSchema = ReviewWriteSchema.extend({ slug: SLUG });
/** Orders in these states don't entitle the buyer to review. */
const NOT_REVIEWABLE = ["cancelled", "returned"];

/** The signed-in customer's valid order containing this product, or null. */
async function purchase(userId: string, productId: string) {
  // Cash on Delivery, or an online payment that actually went through (an abandoned/failed payment doesn't count).
  const order = (await Order.findOne({ userId, fulfillmentStatus: { $nin: NOT_REVIEWABLE }, "items.productId": productId, $or: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }] }).sort({ createdAt: -1 }).lean()) as any;
  if (!order) return null;
  const item = order.items.find((i: any) => i.productId === productId);
  return { orderId: String(order._id), size: item?.size ?? "" };
}

/** GET /api/reviews?slug=… — public list + summary; `canReview` tells the page whether to show the form. */
export async function GET(req: NextRequest) {
  const slugParsed = SLUG.safeParse(req.nextUrl.searchParams.get("slug") ?? "");
  if (!slugParsed.success) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const slug = slugParsed.data;
  try {
    await connectToDatabase();
    const reviews = (await Review.find({ slug }).sort({ createdAt: -1 }).limit(100).lean()) as any[];
    const me = customerFromRequest(req);
    let canReview = false;
    let hasReviewed = false;
    if (me) {
      hasReviewed = reviews.some((r) => r.userId === me.userId);
      if (!hasReviewed) {
        const product = (await Product.findOne({ slug }).select("_id").lean()) as any;
        canReview = !!(product && (await purchase(me.userId, String(product._id))));
      }
    }
    return NextResponse.json({
      count: reviews.length,
      rating: averageRating(reviews.map((r) => r.rating)),
      signedIn: !!me,
      canReview,
      hasReviewed,
      reviews: reviews.map((r) => ({ id: String(r._id), name: r.name, rating: r.rating, title: r.title, comment: r.comment, size: r.size, createdAt: r.createdAt })),
    }, { headers: NO_STORE });
  } catch (e) {
    console.error("[reviews] GET failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load reviews" }, { status: 500 });
  }
}

/** POST /api/reviews — signed-in customers who bought the product; one review per product. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ error: "Please sign in to review" }, { status: 401 });

  // 5 / minute per person (and 20 / minute per IP) is plenty for writing a review and blocks scripted spam.
  const rl = rateLimit(`review-user:${me.userId}`, 5, 60_000);
  const rlIp = rl.ok ? rateLimit(`review-ip:${clientIp(req)}`, 20, 60_000) : rl;
  if (!rl.ok || !rlIp.ok) return NextResponse.json({ error: "You're posting too fast. Please wait a moment." }, { status: 429, headers: retryHeaders(!rl.ok ? rl : rlIp) });

  const body = await parseJsonBody(req, 8 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const parsed = WriteSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { slug, rating, title, comment } = parsed.data;

  try {
    await connectToDatabase();
    const product = (await Product.findOne({ slug }).select("_id").lean()) as any;
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const productId = String(product._id);

    const bought = await purchase(me.userId, productId);
    if (!bought) return NextResponse.json({ error: "Only customers who bought this product can review it" }, { status: 403 });

    let user: any = null;
    try { user = await User.findById(me.userId).select("firstName lastName email").lean(); } catch { user = null; } // a stale / malformed session id just falls back to the email for the display name
    try {
      await Review.create({ productId, slug, userId: me.userId, orderId: bought.orderId, name: publicName(user?.firstName, user?.lastName, user?.email ?? me.email), rating, title, comment, size: bought.size });
    } catch (e: any) {
      if (e?.code === 11000) return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
      throw e;
    }
    await syncProductRating(productId, slug);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("[reviews] POST failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not save your review. Please try again." }, { status: 500 });
  }
}
