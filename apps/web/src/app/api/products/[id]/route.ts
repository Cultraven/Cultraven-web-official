import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { isAdminRequest } from "@/lib/admin-auth";
import { normalizeProduct } from "@/lib/products";
import { ProductWriteSchema } from "@/lib/product-schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function parseId(ctx: Ctx) {
  const { id } = await ctx.params;
  return mongoose.isValidObjectId(id) ? id : null;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  try {
    await connectToDatabase();
    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product: normalizeProduct(product) });
  } catch (error) {
    console.error("[products/id] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const result = ProductWriteSchema.partial().safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", issues: result.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const { hoverImage, badge, ...rest } = result.data;
    const $set: Record<string, unknown> = { ...rest };
    const $unset: Record<string, 1> = {};
    if (hoverImage) $set.hoverImage = hoverImage; else if (hoverImage === "") $unset.hoverImage = 1;
    if (badge) $set.badge = badge; else if (badge === null || badge === "") $unset.badge = 1;
    const ops: Record<string, unknown> = { $set };
    if (Object.keys($unset).length) ops.$unset = $unset;

    const updated = await Product.findByIdAndUpdate(id, ops, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, product: normalizeProduct(updated.toObject()) });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    console.error("[products/id] PUT error:", error);
    return NextResponse.json({ error: "Database write failed. Nothing was changed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  try {
    await connectToDatabase();
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("[products/id] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
