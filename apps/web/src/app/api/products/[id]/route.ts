import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";

// ── Auth helper — verify admin session ───────────────────────────────────────
function verifyAdminToken(req: NextRequest): boolean {
  const session = req.cookies.get("cultraven_session")?.value;
  if (!session || !session.includes(".")) return false;
  const [encodedPayload, signature] = session.split(".");
  try {
    const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
    const expectedSig = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}

// ── GET single product ────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  try {
    await connectToDatabase();
    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[products/id] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// ── PUT update product (admin only) ──────────────────────────────────────────
const UpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  pricePaise: z.number().int().min(0).optional(),
  mrpPaise: z.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().trim().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.object({ hex: z.string(), label: z.string() })).optional(),
  inStock: z.boolean().optional(),
  badge: z.string().max(30).optional().nullable(),
  image: z.string().url().optional(),
  hoverImage: z.string().url().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = UpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    await connectToDatabase();
    const updated = await Product.findByIdAndUpdate(id, { $set: result.data }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("[products/id] PUT error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// ── DELETE product (admin only) ───────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

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
