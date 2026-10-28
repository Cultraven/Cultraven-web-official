/**
 * Page banners: the big navy heading strip at the top of the inner pages, with an optional background photo, edited in
 * Admin -> Website content -> Page banners (site.pageBanners). The page's own wording is the default for the text.
 */
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export interface PageBanner { page: string; image?: string; overlay?: number; eyebrow?: string; title?: string; subtitle?: string; active?: boolean }

export async function getPageBanner(slug: string): Promise<PageBanner | null> {
  const s = await getCmsSection<{ items?: PageBanner[] }>("site.pageBanners");
  const hit = liveItems<PageBanner>(s.data?.items).find((b) => b.page === slug);
  return hit ?? null;
}
