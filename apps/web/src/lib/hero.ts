/**
 * Hero media — shared validation/normalisation used by the /api/cms/hero route.
 * Single source of truth for what a hero slide looks like in the DB and API.
 */

export const HERO_MODES = ["image", "video", "slideshow"] as const;
export type HeroMode = (typeof HERO_MODES)[number];

export interface HeroSlideInput {
  id?: string;
  type: "image" | "video";
  srcDesktop: string;
  srcMobile: string;
  posterSrc: string;
  altText: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  objectPosition: string;
  overlayOpacity: number;
  durationMs: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  sortOrder: number;
}

const UPLOAD_URL = /^\/uploads\/[a-f0-9]{32}\.(jpg|jpeg|png|webp|avif|gif|mp4|webm)$/;
const VIDEO_EXT = /\.(mp4|webm)(\?.*)?$/i;
const POSITIONS = new Set(
  ["left", "center", "right"].flatMap((x) => ["top", "center", "bottom"].map((y) => `${x} ${y}`))
);

/** Accepts our own upload paths or absolute https URLs. Blocks javascript:, data:, protocol-relative, traversal. */
export function isSafeMediaUrl(value: unknown, allowEmpty = true): boolean {
  if (typeof value !== "string") return false;
  if (value === "") return allowEmpty;
  if (value.length > 2048) return false;
  if (UPLOAD_URL.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !!u.hostname;
  } catch {
    return false;
  }
}

function isSafeLink(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 512) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function dateOrNull(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function normalizeMode(v: unknown): HeroMode {
  return HERO_MODES.includes(v as HeroMode) ? (v as HeroMode) : "slideshow";
}

/** Validates the whole payload before anything is written. Returns cleaned slides or a list of errors. */
export function validateSlides(raw: unknown): { slides: HeroSlideInput[]; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(raw)) return { slides: [], errors: ["banners must be an array"] };
  if (raw.length > 12) return { slides: [], errors: ["A maximum of 12 hero slides is allowed"] };

  const slides: HeroSlideInput[] = raw.map((r: any, i: number) => {
    const label = `Slide ${i + 1}`;
    const type: "image" | "video" = r?.type === "video" ? "video" : "image";
    const srcDesktop = str(r?.srcDesktop, 2048);
    const srcMobile = str(r?.srcMobile ?? r?.imageMobile, 2048);
    const posterSrc = str(r?.posterSrc, 2048);

    if (!srcDesktop) errors.push(`${label}: desktop ${type} is required`);
    if (!isSafeMediaUrl(srcDesktop, false)) errors.push(`${label}: desktop media URL is invalid (https:// or uploaded file only)`);
    if (!isSafeMediaUrl(srcMobile)) errors.push(`${label}: mobile media URL is invalid`);
    if (!isSafeMediaUrl(posterSrc)) errors.push(`${label}: poster URL is invalid`);
    if (type === "video") {
      if (srcDesktop && !VIDEO_EXT.test(srcDesktop)) errors.push(`${label}: desktop video must be .mp4 or .webm`);
      if (srcMobile && !VIDEO_EXT.test(srcMobile)) errors.push(`${label}: mobile video must be .mp4 or .webm`);
    }

    const ctaHref = str(r?.ctaHref, 512) || "/collections/all";
    if (!isSafeLink(ctaHref)) errors.push(`${label}: CTA link must start with "/" or https://`);

    const objectPosition = POSITIONS.has(r?.objectPosition) ? r.objectPosition : "center center";
    const overlay = Number(r?.overlayOpacity);
    const duration = Number(r?.durationMs);
    const startsAt = dateOrNull(r?.startsAt);
    const endsAt = dateOrNull(r?.endsAt);
    if (startsAt && endsAt && startsAt >= endsAt) errors.push(`${label}: end date must be after start date`);

    return {
      type,
      srcDesktop,
      srcMobile,
      posterSrc,
      altText: str(r?.altText, 200),
      eyebrow: str(r?.eyebrow, 60),
      headline: str(r?.headline, 120),
      subheadline: str(r?.subheadline, 200),
      ctaLabel: str(r?.ctaLabel, 40) || "SHOP NOW",
      ctaHref,
      objectPosition,
      overlayOpacity: Number.isFinite(overlay) ? Math.min(0.8, Math.max(0, overlay)) : 0.4,
      durationMs: Number.isFinite(duration) ? Math.min(20000, Math.max(2000, duration)) : 5000,
      startsAt,
      endsAt,
      active: r?.active !== false,
      sortOrder: i,
    };
  });

  return { slides, errors };
}

/** Which stored slides the storefront should show right now, honouring mode, active flag, schedule and order. */
export function selectLiveSlides<T extends { type?: string; active?: boolean; startsAt?: string | null; endsAt?: string | null; sortOrder?: number }>(
  banners: T[],
  mode: HeroMode,
  now: number = Date.now()
): T[] {
  const live = banners
    .filter((b) => b.active !== false)
    .filter((b) => !b.startsAt || new Date(b.startsAt).getTime() <= now)
    .filter((b) => !b.endsAt || new Date(b.endsAt).getTime() > now)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (mode === "slideshow") return live;
  const wanted = live.filter((b) => (b.type ?? "image") === mode);
  return wanted.slice(0, 1);
}
