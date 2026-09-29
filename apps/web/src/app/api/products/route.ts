import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";

const MOCK_PRODUCTS = [
  {
    id: "mock1",
    slug: "raven-oversized-tee-acid-black",
    title: "RAVEN OVERSIZED TEE — ACID BLACK",
    pricePaise: 199900,
    mrpPaise: 249900,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=85",
    category: "tees"
  },
  {
    id: "mock2",
    slug: "dharma-graphic-hoodie-stone",
    title: "DHARMA GRAPHIC HOODIE — STONE WASH",
    pricePaise: 299900,
    mrpPaise: 399900,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=900&auto=format&fit=crop&q=85",
    category: "hoodies"
  },
  {
    id: "mock3",
    slug: "cargo-wide-leg-military-olive",
    title: "CARGO WIDE LEG — MILITARY OLIVE",
    pricePaise: 349900,
    mrpPaise: 499900,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop&q=85",
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get("category")?.toLowerCase().trim() ?? "";
  const limitParam = parseInt(searchParams.get("limit") ?? "100", 10);

  try {
    await connectToDatabase();

    // Build Mongo query — if a category filter is provided, apply it case-insensitively
    const query = categoryParam
      ? { category: { $regex: new RegExp(categoryParam, "i") } }
      : {};

    const docs = await Product.find(query).sort({ createdAt: -1 }).limit(limitParam).lean();

    let products = docs.map(normalizeProduct);

    if (products.length === 0) {
      // Filter mocks too when a category was requested
      const mocks = categoryParam
        ? MOCK_PRODUCTS.filter((p) => p.category.toLowerCase().includes(categoryParam))
        : MOCK_PRODUCTS;
      products = (mocks.length > 0 ? mocks : MOCK_PRODUCTS).map(normalizeProduct);
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products from DB, falling back to mock:", error);
    return NextResponse.json({ products: MOCK_PRODUCTS.map(normalizeProduct) });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const newProduct = new Product(body);
    const savedDoc = await newProduct.save();
    
    const product = {
      ...savedDoc.toObject(),
      id: savedDoc._id.toString(),
      _id: undefined,
      __v: undefined,
    };

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
