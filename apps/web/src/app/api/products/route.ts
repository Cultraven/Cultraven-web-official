import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { isAdminRequest } from "@/lib/admin-auth";
import { ProductWriteSchema } from "@/lib/product-schema";
import { normalizeProduct } from "@/lib/products";
import { escapeRegex, isSameOrigin, parseJsonBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/**
 * GET /api/products — products straight from MongoDB. No mock fallback:
 * an empty catalog returns an empty list; a database failure returns 503.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Query values are always strings; the text is regex-escaped below so it can never inject a pattern (ReDoS / operator).
  const categoryParam = (searchParams.get("category")?.toLowerCase().trim() ?? "").slice(0, 64);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);

  try {
    await connectToDatabase();
    const query = categoryParam ? { category: { $regex: new RegExp(escapeRegex(categoryParam), "i") } } : {};
    const docs = await Product.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    // Inventory counts + timestamps are only exposed to an authenticated admin.
    const admin = isAdminRequest(req);
    return NextResponse.json({
      products: docs.map((d: any) => ({
        ...normalizeProduct(d),
        ...(admin ? { stockCount: Number(d.stockCount) || 0, updatedAt: d.updatedAt ?? null } : {}),
      })),
    });
  } catch (error) {
    console.error("[products] GET failed:", error);
    return NextResponse.json({ error: "Products unavailable", products: [] }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Size cap, JSON only, no $-operator / prototype keys; zod then whitelists and bounds every field.
  const body = await parseJsonBody(req, 64 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const parsed = ProductWriteSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const data = { ...parsed.data, hoverImage: parsed.data.hoverImage || undefined, mrpPaise: parsed.data.mrpPaise ?? parsed.data.pricePaise };
    const saved = await new Product(data).save();
    return NextResponse.json({ success: true, product: normalizeProduct(saved.toObject()) }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    console.error("[products] POST failed:", error);
    return NextResponse.json({ error: "Database write failed. Nothing was saved." }, { status: 500 });
  }
}
