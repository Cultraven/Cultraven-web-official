import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function verifyAdminSession(req: NextRequest): boolean {
  const token = req.cookies.get("cultraven_session")?.value;
  if (!token || !token.includes(".")) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const [encodedPayload, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  if (expected !== sig) return false;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
    return payload.role === "admin" && payload.exp > Date.now();
  } catch { return false; }
}

const MOCK_PRODUCTS = [
  {
    id: "mock1",
    slug: "raven-oversized-tee-acid-black",
    title: "RAVEN OVERSIZED TEE — ACID BLACK",
    pricePaise: 199900,
    mrpPaise: 249900,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=900&auto=format&fit=crop&q=85",
    category: "tees"
  },
  {
    id: "mock2",
    slug: "dharma-graphic-hoodie-stone",
    title: "DHARMA GRAPHIC HOODIE — STONE WASH",
    pricePaise: 299900,
    mrpPaise: 399900,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1512411933099-b1d5565538e1?w=900&auto=format&fit=crop&q=85",
    category: "hoodies"
  },
  {
    id: "mock3",
    slug: "cargo-wide-leg-military-olive",
    title: "CARGO WIDE LEG — MILITARY OLIVE",
    pricePaise: 349900,
    mrpPaise: 499900,
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=900&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&auto=format&fit=crop&q=85",
    category: "bottoms"
  }
];

/** Safely normalize a raw DB/mock product so colors & sizes are always clean arrays */
function normalizeProduct(doc: any) {
  const colors: { hex: string; label: string }[] = Array.isArray(doc.colors)
    ? doc.colors
        .filter((c: any) => c && typeof c.hex === "string" && typeof c.label === "string")
        .map((c: any) => ({ hex: c.hex, label: c.label }))
    : [];

  const sizes: string[] = Array.isArray(doc.sizes)
    ? doc.sizes.filter((s: any) => s && typeof s === "string")
    : [];

  return {
    id: doc._id ? doc._id.toString() : String(doc.id ?? ""),
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    href: doc.href ?? `/products/${doc.slug ?? ""}`,
    image: doc.image ?? "",
    hoverImage: doc.hoverImage ?? doc.image ?? "",
    pricePaise: Number(doc.pricePaise) || 0,
    mrpPaise: Number(doc.mrpPaise ?? doc.pricePaise) || 0,
    rating: Number(doc.rating) || 4,
    reviewCount: Number(doc.reviewCount) || 0,
    colors,
    sizes,
    category: doc.category ?? "",
    badge: doc.badge ?? undefined,
    inStock: doc.inStock !== false,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawCategory = searchParams.get("category")?.toLowerCase().trim() ?? "";
  const categoryParam = rawCategory.slice(0, 64); // cap length
  const limitParam = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10), 1), 100);
  // Admin requests skip the mock fallback so the admin sees real DB state
  const noMock = searchParams.get("noMock") === "true" || verifyAdminSession(req);

  try {
    await connectToDatabase();

    // Escape user input before building regex — prevents ReDoS
    const query = categoryParam
      ? { category: { $regex: new RegExp(escapeRegex(categoryParam), "i") } }
      : {};

    const docs = await Product.find(query).sort({ createdAt: -1 }).limit(limitParam).lean();

    let products = docs.map(normalizeProduct);

    if (products.length === 0 && !noMock) {
      // Filter mocks too when a category was requested
      const mocks = categoryParam
        ? MOCK_PRODUCTS.filter((p) => p.category.toLowerCase().includes(categoryParam))
        : MOCK_PRODUCTS;
      products = (mocks.length > 0 ? mocks : MOCK_PRODUCTS).map(normalizeProduct);
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products from DB, falling back to mock:", error);
    if (noMock) return NextResponse.json({ products: [] });
    return NextResponse.json({ products: MOCK_PRODUCTS.map(normalizeProduct) });
  }
}

const ProductCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  pricePaise: z.number().int().positive(),
  mrpPaise: z.number().int().positive().optional(),
  image: z.string().url(),
  hoverImage: z.string().url().optional(),
  category: z.string().min(1).max(50),
  sizes: z.array(z.string().max(20)).max(20).optional(),
  colors: z.array(z.object({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/), label: z.string().max(50) })).max(20).optional(),
  inStock: z.boolean().optional(),
  badge: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = ProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const newProduct = new Product(parsed.data);
    const savedDoc = await newProduct.save();
    const product = { ...savedDoc.toObject(), id: savedDoc._id.toString(), _id: undefined, __v: undefined };
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
