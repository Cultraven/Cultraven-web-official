/**
 * /brand/<name>: the logos, the browser-tab icon and the social share picture, served from whatever is set in
 * Admin -> Website content -> Site -> Logo & site images (site.branding). Nothing set there = the built-in file in /public.
 * Used instead of fixed file names so any page, email-free surface and the browser tab all pick up a replaced image.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCmsSection } from "@/lib/cms/server";
import { BRAND_IMAGES, isServableSource } from "@/lib/brand-images";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

async function fetchImage(src: string, origin: string): Promise<{ body: ArrayBuffer; type: string } | null> {
  try {
    const url = src.startsWith("/") ? new URL(src, origin).toString() : src;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "follow" });
    if (!r.ok) return null;
    const type = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml|avif|x-icon|vnd\.microsoft\.icon)$/.test(type)) return null;
    const body = await r.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_BYTES) return null;
    return { body, type };
  } catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const def = Object.prototype.hasOwnProperty.call(BRAND_IMAGES, name) ? BRAND_IMAGES[name] : undefined;
  if (!def) return new NextResponse("Not found", { status: 404 });
  const origin = req.nextUrl.origin;

  const section = await getCmsSection<Record<string, unknown>>("site.branding");
  const chosen = section.data?.[def.field];
  let img = isServableSource(chosen) ? await fetchImage(chosen.trim(), origin) : null;
  const usedFallback = !img;
  if (!img) img = await fetchImage(def.fallback, origin);
  if (!img) return new NextResponse("Image unavailable", { status: 502 });

  return new NextResponse(img.body, {
    headers: {
      "Content-Type": img.type,
      // Short cache so a replaced logo shows up within minutes; the built-in file can be cached longer.
      "Cache-Control": usedFallback ? "public, max-age=300, s-maxage=3600" : "public, max-age=120, s-maxage=300, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
