/**
 * Social links: ONE list, edited in Admin -> Website content -> Social links (CMS section "site.social").
 * The footer icons, the chat window, the contact page and the business details Google reads (JSON-LD "sameAs") all use it.
 */
import { BUSINESS } from "@/lib/business";

export interface SocialLink { id?: string; platform: string; href: string }

/** Only https addresses are ever used as a link target. */
const isHttps = (u: unknown): u is string => {
  if (typeof u !== "string") return false;
  try { return new URL(u).protocol === "https:"; } catch { return false; }
};

/** The brand's own pages. Used only when the database cannot be read, so the site never shows a wrong or empty list by accident. */
export const DEFAULT_SOCIAL: SocialLink[] = [
  { platform: "instagram", href: BUSINESS.instagramUrl },
  { platform: "twitter", href: "https://x.com/cultraven_" },
  { platform: "facebook", href: "https://www.facebook.com/profile.php?id=61595224413709" },
  { platform: "reddit", href: "https://www.reddit.com/user/Cultraven_official/" },
];

type Section = { state?: string; data?: any } | null | undefined;

/**
 * The visible social links, in the admin's order.
 *  - "Social links" section saved  -> that list (an emptied list means no icons at all)
 *  - not saved yet                 -> the list that used to live inside the Footer section
 *  - database could not be read    -> `DEFAULT_SOCIAL` when `fallbackToDefaults` is set (nothing is invented otherwise)
 */
export function resolveSocialLinks(social: Section, footer: Section, opts: { fallbackToDefaults?: boolean } = {}): SocialLink[] {
  let raw: any[] | undefined;
  if (social?.state === "ok" && Array.isArray(social.data?.items)) raw = social.data.items;
  else if (Array.isArray(footer?.data?.socialLinks)) raw = footer!.data.socialLinks;
  if (!raw) return social?.state === "error" && opts.fallbackToDefaults ? DEFAULT_SOCIAL : [];
  const seen = new Set<string>();
  return raw
    .filter((l) => l && l.active !== false && typeof l.platform === "string" && isHttps(l.href))
    .filter((l) => (seen.has(l.platform) ? false : (seen.add(l.platform), true)))
    .map((l) => ({ id: l.id, platform: String(l.platform), href: String(l.href) }));
}

export const socialHref = (links: SocialLink[], platform: string): string => links.find((l) => l.platform === platform)?.href ?? "";

/** "https://www.instagram.com/cultraven._/" -> "cultraven._" (empty when the address has no profile name). */
export function profileName(url: string): string {
  try { return new URL(url).pathname.split("/").filter(Boolean)[0] ?? ""; } catch { return ""; }
}
