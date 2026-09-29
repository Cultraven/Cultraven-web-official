import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";

export async function GET() {
  try {
    await connectToDatabase();
    
    const docs = await Product.find().sort({ createdAt: -1 }).lean();
    
    const products = docs.map((doc: any) => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
      __v: undefined,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
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
