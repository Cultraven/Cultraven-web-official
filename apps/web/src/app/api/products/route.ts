import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { isAdminRequest } from "@/lib/admin-auth";
import { ProductWriteSchema } from "@/lib/product-schema";
import { escapeRegex, normalizeProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

/**
 * GET /api/products — products straight from MongoDB. No mock fallback:
 * an empty catalog returns an empty list; a database failure returns 503.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
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

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const parsed = ProductWriteSchema.safeParse(body);
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
