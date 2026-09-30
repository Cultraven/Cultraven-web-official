/**
 * Server-side CMS data access — the ONLY way the public website reads CMS content.
 *
 *   Admin → API → MongoDB  ──►  these functions (server-only) ──►  Website
 *
 * Every public page that uses this is rendered per request (`force-dynamic`), and
 * each request reads MongoDB once per collection (batched + de-duplicated with
 * React's request-scoped `cache`). There is deliberately NO cross-request data cache:
 *   - an admin save is visible on the very next page view, with nothing to invalidate;
 *   - a server restart can never resurrect stale content (Next's tag manifest is
 *     in-memory while its data cache is on disk, which can serve old data after restart);
 *   - records written by the seed script or directly in MongoDB show up immediately.
 *
 * Failure behaviour: a DB error is logged and reported as state "error" — callers
 * render nothing / an empty state. Content is never fabricated to hide a failure.
 * Browsers never talk to MongoDB; credentials stay server-side.
 */
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import { CmsSection } from "@/lib/models/CmsSection";
import { HeroBanner, HeroConfig } from "@/lib/models/HeroBanner";
import { ShopLook } from "@/lib/models/ShopLook";
import { Product } from "@/lib/models/Product";
import { normalizeProduct, type PublicProduct } from "@/lib/products";
import { normalizeMode, selectLiveSlides } from "@/lib/hero";

export type CmsState = "ok" | "empty" | "error";
export interface CmsResult<T> { state: CmsState; data: T | null }

const jsonSafe = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function logFailure(what: string, error: unknown) {
  console.error(`[cms] Failed to load ${what} from database:`, error instanceof Error ? error.message : error);
}

// ─── Sections (one query per request for ALL sections) ───────────────────────

const loadAllSections = cache(async (): Promise<Map<string, Record<string, any>>> => {
  await connectToDatabase();
  const docs = (await CmsSection.find().lean()) as any[];
  return new Map(docs.map((d) => [d.key as string, jsonSafe(d.data) as Record<string, any>]));
});

export async function getCmsSection<T = Record<string, any>>(key: string): Promise<CmsResult<T>> {
  try {
    const data = (await loadAllSections()).get(key);
    return data ? { state: "ok", data: data as T } : { state: "empty", data: null };
  } catch (e) {
    logFailure(`section "${key}"`, e);
    return { state: "error", data: null };
  }
}

// ─── Hero ────────────────────────────────────────────────────────────────────

const loadHero = cache(async () => {
  await connectToDatabase();
  const [docs, config] = await Promise.all([
    HeroBanner.find().sort({ sortOrder: 1, createdAt: 1 }).lean(),
    HeroConfig.findOne({ key: "homepage" }).lean() as Promise<any>,
  ]);
  return jsonSafe({
    mode: normalizeMode(config?.mode),
    banners: docs.map((d: any) => ({ ...d, id: String(d._id), _id: undefined, __v: undefined, createdAt: undefined, updatedAt: undefined })),
  });
});

/** Live hero slides: mode, active flag, schedule and order are all applied on the server, per request. */
export async function getHeroSlides(): Promise<CmsResult<any[]>> {
  try {
    const { mode, banners } = await loadHero();
    const live = selectLiveSlides(banners as any[], mode);
    return live.length ? { state: "ok", data: live } : { state: "empty", data: null };
  } catch (e) {
    logFailure("hero", e);
    return { state: "error", data: null };
  }
}

// ─── Shop the Look ───────────────────────────────────────────────────────────

const loadShopLook = cache(async () => {
  await connectToDatabase();
  const doc = (await ShopLook.findOne().lean()) as any;
  if (!doc) return null;
  const { _id, __v, createdAt, updatedAt, ...look } = doc;
  return jsonSafe(look);
});

export async function getShopLook(): Promise<CmsResult<any>> {
  try {
    const look = await loadShopLook();
    return look && Array.isArray(look.products) && look.products.length ? { state: "ok", data: look } : { state: "empty", data: null };
  } catch (e) {
    logFailure("shop-the-look", e);
    return { state: "error", data: null };
  }
}

// ─── Products (catalog) ──────────────────────────────────────────────────────

const loadProducts = cache(async (flag: string, limit: number): Promise<PublicProduct[]> => {
  await connectToDatabase();
  const query = flag === "all" ? {} : { [flag]: true };
  const docs = await Product.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return jsonSafe(docs.map(normalizeProduct));
});

export async function getProducts(flag: "isNewArrival" | "isBestseller" | "all", limit = 12): Promise<CmsResult<PublicProduct[]>> {
  try {
    const products = await loadProducts(flag, limit);
    return products.length ? { state: "ok", data: products } : { state: "empty", data: null };
  } catch (e) {
    logFailure(`products (${flag})`, e);
    return { state: "error", data: null };
  }
}

const loadProductBySlug = cache(async (slug: string): Promise<PublicProduct | null> => {
  await connectToDatabase();
  const doc = await Product.findOne({ slug }).lean();
  return doc ? jsonSafe(normalizeProduct(doc)) : null;
});

export async function getProductBySlug(slug: string): Promise<CmsResult<PublicProduct>> {
  try {
    const p = await loadProductBySlug(slug);
    return p ? { state: "ok", data: p } : { state: "empty", data: null };
  } catch (e) {
    logFailure(`product "${slug}"`, e);
    return { state: "error", data: null };
  }
}
