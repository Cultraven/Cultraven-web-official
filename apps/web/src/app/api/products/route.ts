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

export async function GET() {
  try {
    await connectToDatabase();
    
    const docs = await Product.find().sort({ createdAt: -1 }).lean();
    
    let products = docs.map((doc: any) => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
      __v: undefined,
    }));

    if (products.length === 0) {
      products = MOCK_PRODUCTS;
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products from DB, falling back to mock:", error);
    return NextResponse.json({ products: MOCK_PRODUCTS });
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
