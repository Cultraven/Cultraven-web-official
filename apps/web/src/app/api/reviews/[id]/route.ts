import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { isAdminRequest } from "@/lib/admin-auth";
import { syncProductRating } from "@/lib/reviews-server";
import { isObjectIdString, isSameOrigin } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/** DELETE /api/reviews/:id — admin moderation (removes a review and refreshes the product rating). */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  if (!isObjectIdString(id)) return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  try {
    await connectToDatabase();
    const r = (await Review.findByIdAndDelete(id).lean()) as any;
    if (!r) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    await syncProductRating(r.productId, r.slug);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reviews] DELETE failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not delete review" }, { status: 500 });
  }
}
