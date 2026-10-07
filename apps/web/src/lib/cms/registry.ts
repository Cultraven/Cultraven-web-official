/**
 * CMS section registry — the single definition of every admin-managed content
 * section: what fields it has, how they validate, and where it is edited.
 *
 * Client-safe (no server imports). Used by:
 *   - the Admin editor (renders a form from `fields`)
 *   - the API route (validates every write with `validateFields`)
 *   - the public website (types of the data it receives)
 *
 * Conventions: lists keep their order in array order (persisted), and list
 * items carry an `active` boolean where visibility is admin-controlled.
 */
import { isSafeMediaUrl } from "../hero";

export type Field =
  | { kind: "text" | "textarea" | "link" | "url" | "image" | "video" | "datetime"; key: string; label: string; required?: boolean; max?: number; help?: string }
  | { kind: "number"; key: string; label: string; min: number; max: number; default: number; help?: string }
  | { kind: "boolean"; key: string; label: string; default?: boolean }
  | { kind: "select"; key: string; label: string; options: string[]; default?: string; required?: boolean }
  | { kind: "list"; key: string; label: string; itemTitleKey?: string; max?: number; fields: Field[]; help?: string };

export interface SectionDef {
  key: string;
  group: "Site" | "Homepage" | "Pages" | "Shop";
  label: string;
  description: string;
  /** Public path where the change can be seen. */
  previewPath: string;
  fields: Field[];
}

const active: Field = { kind: "boolean", key: "active", label: "Visible on website", default: true };

export const SECTIONS: SectionDef[] = [
  {
    key: "site.announcement",
    group: "Site",
    label: "Announcement bar",
    description: "Rotating messages at the very top of every page.",
    previewPath: "/",
    fields: [
      { kind: "number", key: "intervalMs", label: "Seconds between messages", min: 2000, max: 15000, default: 4000, help: "In milliseconds" },
      { kind: "list", key: "items", label: "Messages", itemTitleKey: "text", max: 10, fields: [
        { kind: "text", key: "text", label: "Message", required: true, max: 140 },
        { kind: "link", key: "link", label: "Link (optional)" },
        active,
      ] },
    ],
  },
  {
    key: "site.nav",
    group: "Site",
    label: "Main navigation",
    description: "Header menu. Items with columns become dropdown menus.",
    previewPath: "/",
    fields: [
      { kind: "list", key: "items", label: "Menu items", itemTitleKey: "label", max: 10, fields: [
        { kind: "text", key: "label", label: "Label", required: true, max: 30 },
        { kind: "link", key: "href", label: "Link (leave empty if it has a dropdown)" },
        { kind: "list", key: "columns", label: "Dropdown columns", itemTitleKey: "heading", max: 4, fields: [
          { kind: "text", key: "heading", label: "Column heading", required: true, max: 40 },
          { kind: "list", key: "items", label: "Links", itemTitleKey: "label", max: 20, fields: [
            { kind: "text", key: "label", label: "Label", required: true, max: 40 },
            { kind: "link", key: "href", label: "Link", required: true },
            { kind: "boolean", key: "isNew", label: "Show NEW badge" },
          ] },
        ] },
        active,
      ] },
    ],
  },
  {
    key: "site.footer",
    group: "Site",
    label: "Footer",
    description: "Footer link columns, social links and copyright line.",
    previewPath: "/",
    fields: [
      { kind: "text", key: "copyrightText", label: "Copyright text", max: 120 },
      { kind: "list", key: "columns", label: "Link columns", itemTitleKey: "heading", max: 6, fields: [
        { kind: "text", key: "heading", label: "Heading", required: true, max: 40 },
        { kind: "list", key: "links", label: "Links", itemTitleKey: "label", max: 20, fields: [
          { kind: "text", key: "label", label: "Label", required: true, max: 40 },
          { kind: "link", key: "href", label: "Link", required: true },
          { kind: "boolean", key: "openInNew", label: "Open in new tab" },
        ] },
      ] },
      { kind: "list", key: "socialLinks", label: "Social links", itemTitleKey: "platform", max: 8, fields: [
        { kind: "select", key: "platform", label: "Platform", required: true, options: ["instagram", "youtube", "pinterest", "facebook", "twitter", "whatsapp"] },
        { kind: "url", key: "href", label: "Profile URL", required: true },
      ] },
    ],
  },
  {
    key: "site.trustBadges",
    group: "Site",
    label: "Trust badges",
    description: "Service strip above the footer (delivery, returns, payments).",
    previewPath: "/",
    fields: [
      { kind: "list", key: "items", label: "Badges", itemTitleKey: "title", max: 6, fields: [
        { kind: "select", key: "icon", label: "Icon", required: true, options: ["shipping", "returns", "secure", "cod", "genuine", "support"] },
        { kind: "text", key: "title", label: "Title", required: true, max: 50 },
        { kind: "text", key: "subtitle", label: "Subtitle", max: 80 },
        active,
      ] },
    ],
  },
  {
    key: "home.categoryStrip",
    group: "Homepage",
    label: "Category strip",
    description: "Horizontal category links under the hero.",
    previewPath: "/",
    fields: [
      { kind: "list", key: "items", label: "Links", itemTitleKey: "label", max: 14, fields: [
        { kind: "text", key: "label", label: "Label", required: true, max: 30 },
        { kind: "link", key: "href", label: "Link", required: true },
        { kind: "boolean", key: "accent", label: "Highlight (gold)" },
        active,
      ] },
    ],
  },
  {
    key: "home.categoryTiles",
    group: "Homepage",
    label: "Category tiles",
    description: "Image tiles for shop-by-category.",
    previewPath: "/",
    fields: [
      { kind: "list", key: "items", label: "Tiles", itemTitleKey: "title", max: 8, fields: [
        { kind: "text", key: "title", label: "Title", required: true, max: 50 },
        { kind: "text", key: "sub", label: "Subtitle", max: 60 },
        { kind: "link", key: "href", label: "Link", required: true },
        { kind: "image", key: "image", label: "Image", required: true },
        { kind: "select", key: "size", label: "Tile size", options: ["normal", "tall", "wide"], default: "normal" },
        active,
      ] },
    ],
  },
  {
    key: "home.newDrop",
    group: "Homepage",
    label: "New Arrivals section",
    description: "Heading and link. Products shown are those marked 'New arrival' in Products.",
    previewPath: "/",
    fields: [
      { kind: "text", key: "eyebrow", label: "Small label", max: 40 },
      { kind: "text", key: "heading", label: "Heading", required: true, max: 80 },
      { kind: "text", key: "ctaLabel", label: "Button text", max: 30 },
      { kind: "link", key: "ctaHref", label: "Button link" },
    ],
  },
  {
    key: "home.bestsellers",
    group: "Homepage",
    label: "Bestsellers section",
    description: "Heading for the bestsellers carousel. Products are those marked 'Bestseller' in Products.",
    previewPath: "/",
    fields: [
      { kind: "text", key: "eyebrow", label: "Small label", max: 40 },
      { kind: "text", key: "heading", label: "Heading", required: true, max: 80 },
    ],
  },
  {
    key: "home.trending",
    group: "Homepage",
    label: "Trending Now",
    description: "Editorial image cards.",
    previewPath: "/",
    fields: [
      { kind: "text", key: "heading", label: "Heading", max: 60 },
      { kind: "list", key: "items", label: "Cards", itemTitleKey: "title", max: 9, fields: [
        { kind: "text", key: "title", label: "Title", required: true, max: 60 },
        { kind: "link", key: "href", label: "Link", required: true },
        { kind: "image", key: "image", label: "Image", required: true },
        { kind: "text", key: "alt", label: "Alt text", max: 160 },
        active,
      ] },
    ],
  },
  {
    key: "home.community",
    group: "Homepage",
    label: "Community (Customer Photos)",
    description: "Customer / lifestyle photo grid.",
    previewPath: "/",
    fields: [
      { kind: "text", key: "eyebrow", label: "Small label", max: 40 },
      { kind: "text", key: "heading", label: "Heading", max: 80 },
      { kind: "url", key: "instagramUrl", label: "Instagram URL" },
      { kind: "text", key: "ctaText", label: "Tag line", max: 80 },
      { kind: "list", key: "items", label: "Photos", itemTitleKey: "alt", max: 12, fields: [
        { kind: "image", key: "image", label: "Image", required: true },
        { kind: "text", key: "alt", label: "Alt text", max: 160 },
        active,
      ] },
    ],
  },
  {
    key: "home.brandStory",
    group: "Homepage",
    label: "Brand story",
    description: "Full-width manifesto banner with optional background video.",
    previewPath: "/",
    fields: [
      { kind: "text", key: "eyebrow", label: "Small label", max: 40 },
      { kind: "textarea", key: "headline", label: "Headline (new line = line break)", required: true, max: 160 },
      { kind: "textarea", key: "body", label: "Body text", max: 500 },
      { kind: "text", key: "ctaLabel", label: "Button text", max: 40 },
      { kind: "link", key: "ctaHref", label: "Button link" },
      { kind: "image", key: "image", label: "Background image / poster", required: true },
      { kind: "video", key: "videoUrl", label: "Background video (optional, MP4/WebM)" },
    ],
  },
  {
    key: "home.promoBanner",
    group: "Homepage",
    label: "Promotional banners",
    description: "Full-width campaign banners. Shown between Trending and Community only while active and inside their schedule.",
    previewPath: "/",
    fields: [
      { kind: "list", key: "items", label: "Banners", itemTitleKey: "headline", max: 5, fields: [
        { kind: "image", key: "image", label: "Image", required: true },
        { kind: "text", key: "alt", label: "Alt text", max: 160 },
        { kind: "text", key: "tagline", label: "Small label", max: 60 },
        { kind: "text", key: "headline", label: "Headline", required: true, max: 100 },
        { kind: "text", key: "ctaLabel", label: "Button text", max: 40 },
        { kind: "link", key: "ctaHref", label: "Button link" },
        { kind: "select", key: "textPosition", label: "Text position", options: ["left", "center", "right"], default: "center" },
        { kind: "datetime", key: "startAt", label: "Show from (optional)" },
        { kind: "datetime", key: "endAt", label: "Hide after (optional)" },
        active,
      ] },
    ],
  },
  {
    key: "page.lookbook",
    group: "Pages",
    label: "Lookbook",
    description: "Looks shown on /pages/lookbook.",
    previewPath: "/pages/lookbook",
    fields: [
      { kind: "list", key: "items", label: "Looks", itemTitleKey: "title", max: 24, fields: [
        { kind: "text", key: "season", label: "Season tag", max: 20 },
        { kind: "text", key: "title", label: "Title", required: true, max: 60 },
        { kind: "textarea", key: "desc", label: "Description", max: 240 },
        { kind: "image", key: "image", label: "Image", required: true },
        { kind: "link", key: "href", label: "Shop link", required: true },
        { kind: "list", key: "products", label: "Pieces in this look", itemTitleKey: "name", max: 8, fields: [
          { kind: "text", key: "name", label: "Piece name", required: true, max: 60 },
        ] },
        active,
      ] },
    ],
  },
  {
    key: "page.journal",
    group: "Pages",
    label: "Journal",
    description: "Articles shown on /pages/journal. The first visible article is featured.",
    previewPath: "/pages/journal",
    fields: [
      { kind: "list", key: "items", label: "Articles", itemTitleKey: "title", max: 60, fields: [
        { kind: "text", key: "title", label: "Title", required: true, max: 120 },
        { kind: "select", key: "category", label: "Category", required: true, options: ["STYLE", "CULTURE", "FASHION", "PEOPLE", "MUSIC"] },
        { kind: "text", key: "date", label: "Date label (e.g. Sep 2026)", max: 20 },
        { kind: "image", key: "image", label: "Image", required: true },
        { kind: "textarea", key: "excerpt", label: "Excerpt", max: 300 },
        { kind: "textarea", key: "body", label: "Article body (blank line = new paragraph)", max: 8000 },
        { kind: "text", key: "slug", label: "URL slug", required: true, max: 100 },
        active,
      ] },
    ],
  },
  {
    key: "page.heritage",
    group: "Pages",
    label: "Our Story (heritage)",
    description: "Story page hero, sections and values on /pages/our-heritage.",
    previewPath: "/pages/our-heritage",
    fields: [
      { kind: "image", key: "heroImage", label: "Hero background image", required: true },
      { kind: "list", key: "sections", label: "Story sections", itemTitleKey: "heading", max: 10, fields: [
        { kind: "text", key: "tag", label: "Small label", max: 40 },
        { kind: "text", key: "heading", label: "Heading", required: true, max: 120 },
        { kind: "textarea", key: "body", label: "Body", max: 800 },
        { kind: "image", key: "image", label: "Image", required: true },
        { kind: "boolean", key: "reverse", label: "Image on the right" },
        active,
      ] },
      { kind: "list", key: "values", label: "Brand values", itemTitleKey: "title", max: 8, fields: [
        { kind: "text", key: "title", label: "Value", required: true, max: 30 },
        { kind: "text", key: "desc", label: "Description", max: 160 },
      ] },
    ],
  },
  {
    key: "shop.collections",
    group: "Shop",
    label: "Collections",
    description: "Name, description and banner image of each /collections/<slug> page.",
    previewPath: "/collections/all",
    fields: [
      { kind: "list", key: "items", label: "Collections", itemTitleKey: "name", max: 40, fields: [
        { kind: "text", key: "slug", label: "URL slug", required: true, max: 60 },
        { kind: "text", key: "name", label: "Name", required: true, max: 60 },
        { kind: "textarea", key: "description", label: "Description", max: 300 },
        { kind: "image", key: "image", label: "Banner image", required: true },
        active,
      ] },
    ],
  },
];

export const SECTION_MAP: Record<string, SectionDef> = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

// ─── Validation ──────────────────────────────────────────────────────────────

const VIDEO_EXT = /\.(mp4|webm)(\?.*)?$/i;

function safeLink(v: string): boolean {
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  try { return new URL(v).protocol === "https:"; } catch { return false; }
}
function safeUrl(v: string): boolean {
  try { return new URL(v).protocol === "https:"; } catch { return false; }
}
function newId(): string {
  const a = new Uint8Array(6);
  globalThis.crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Validate + normalise `input` against `fields`. Unknown keys are dropped. Never throws. */
export function validateFields(fields: Field[], input: unknown, path = ""): { value: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const out: Record<string, unknown> = {};
  const src = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};

  for (const f of fields) {
    const at = `${path}${f.label}`;
    const raw = src[f.key];

    switch (f.kind) {
      case "text":
      case "textarea":
      case "link":
      case "url":
      case "image":
      case "video":
      case "datetime": {
        const max = f.max ?? (f.kind === "textarea" ? 2000 : f.kind === "text" ? 200 : 2048);
        const s = typeof raw === "string" ? (f.kind === "textarea" ? raw.trim() : raw.trim()) : "";
        if (s.length > max) { errors.push(`${at}: too long (max ${max} characters)`); out[f.key] = s.slice(0, max); break; }
        if (!s) {
          if (f.required) errors.push(`${at} is required`);
          out[f.key] = f.kind === "datetime" ? null : "";
          break;
        }
        if (f.kind === "link" && !safeLink(s)) errors.push(`${at}: must start with "/" or https://`);
        if (f.kind === "url" && !safeUrl(s)) errors.push(`${at}: must be an https:// URL`);
        if ((f.kind === "image" || f.kind === "video") && !isSafeMediaUrl(s, false)) errors.push(`${at}: must be an https:// URL or an uploaded file`);
        if (f.kind === "video" && !VIDEO_EXT.test(s)) errors.push(`${at}: must be an .mp4 or .webm file`);
        if (f.kind === "datetime") {
          const d = new Date(s);
          if (Number.isNaN(d.getTime())) { errors.push(`${at}: invalid date`); out[f.key] = null; break; }
          out[f.key] = d.toISOString();
          break;
        }
        out[f.key] = s;
        break;
      }
      case "number": {
        const n = Number(raw);
        out[f.key] = Number.isFinite(n) && raw !== "" && raw !== null && raw !== undefined ? Math.min(f.max, Math.max(f.min, n)) : f.default;
        break;
      }
      case "boolean":
        out[f.key] = raw === undefined ? (f.default ?? false) : raw === true;
        break;
      case "select": {
        if (typeof raw === "string" && f.options.includes(raw)) out[f.key] = raw;
        else {
          if (f.required) errors.push(`${at} is required`);
          out[f.key] = f.default ?? f.options[0];
        }
        break;
      }
      case "list": {
        const arr = Array.isArray(raw) ? raw : [];
        const max = f.max ?? 50;
        if (arr.length > max) { errors.push(`${at}: at most ${max} entries allowed`); }
        out[f.key] = arr.slice(0, max).map((item, i) => {
          const r = validateFields(f.fields, item, `${at} #${i + 1} › `);
          errors.push(...r.errors);
          const existing = item && typeof item === "object" ? (item as any).id : undefined;
          return { id: typeof existing === "string" && /^[\w-]{1,40}$/.test(existing) ? existing : newId(), ...r.value };
        });
        break;
      }
    }
  }
  return { value: out, errors };
}

/** Items of a list that should appear on the public site right now. */
export function liveItems<T extends { active?: boolean; startAt?: string | null; endAt?: string | null }>(items: T[] | undefined, now = Date.now()): T[] {
  return (items ?? []).filter(
    (i) =>
      i.active !== false &&
      (!i.startAt || new Date(i.startAt).getTime() <= now) &&
      (!i.endAt || new Date(i.endAt).getTime() > now)
  );
}
