import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { CmsSection } from "@/lib/models/CmsSection";
import { isAdminRequest } from "@/lib/admin-auth";
import { liveItems } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

/** The places a link in the admin can safely point to: every real product, every collection, and the information pages. */
const PAGES = [
  { href: "/", label: "Home" },
  { href: "/collections/all", label: "Shop all" },
  { href: "/pages/our-heritage", label: "Our Story" },
  { href: "/pages/lookbook", label: "Lookbook" },
  { href: "/pages/journal", label: "Journal" },
  { href: "/pages/contact", label: "Contact Us" },
  { href: "/pages/size-guide", label: "Size Guide" },
  { href: "/help", label: "Help Center" },
  { href: "/pages/shipping", label: "Shipping policy" },
  { href: "/pages/returns", label: "Returns & Exchanges policy" },
  { href: "/pages/terms", label: "Terms & Conditions" },
  { href: "/pages/privacy", label: "Privacy Policy" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/account/orders", label: "My Orders" },
];

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const [products, coll] = await Promise.all([
      Product.find({}).sort({ createdAt: -1 }).limit(500).select("slug title image images pricePaise inStock").lean() as Promise<any[]>,
      CmsSection.findOne({ key: "shop.collections" }).lean() as Promise<any>,
    ]);
    const collections = [
      { href: "/collections/all", label: "All products" },
      { href: "/collections/new-in", label: "New In" },
      { href: "/collections/bestsellers", label: "Bestsellers" },
      ...liveItems<any>(coll?.data?.items).filter((c) => c.slug && !["all", "new-in", "bestsellers"].includes(c.slug)).map((c) => ({ href: `/collections/${c.slug}`, label: String(c.name || c.slug) })),
    ];
    return NextResponse.json({
      products: products.map((p) => ({ slug: p.slug, title: p.title, image: p.image || p.images?.[0] || "", inStock: p.inStock !== false })),
      collections,
      pages: PAGES,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[admin/link-targets] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
