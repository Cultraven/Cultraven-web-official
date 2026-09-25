import { z } from "zod";

// ─── Announcement Bar ────────────────────────────────────────────────────────

export const AnnouncementItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  link: z.string().optional(),
  linkLabel: z.string().optional(),
});

export const AnnouncementBarSchema = z.object({
  items: z.array(AnnouncementItemSchema).min(1),
  intervalMs: z.number().int().positive().default(3500),
  bgColor: z.string().default("#0A0A0A"),
  textColor: z.string().default("#F5F0EB"),
});

// ─── Navigation / Mega-Menu ───────────────────────────────────────────────────

export const NavSubItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  isNew: z.boolean().optional(),
});

export const NavColumnSchema = z.object({
  heading: z.string(),
  items: z.array(NavSubItemSchema),
});

export const NavItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string().optional(),
  columns: z.array(NavColumnSchema).optional(),
});

export const NavMenuSchema = z.object({
  items: z.array(NavItemSchema),
});

// ─── Hero Banner ─────────────────────────────────────────────────────────────

export const HeroSlideSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video"]),
  srcDesktop: z.string(),
  srcMobile: z.string(),
  altText: z.string(),
  headline: z.string(),
  subheadline: z.string().optional(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
  textColor: z.string().default("#F5F0EB"),
  overlayOpacity: z.number().min(0).max(1).default(0.35),
});

// ─── Trust Badges ─────────────────────────────────────────────────────────────

export const TrustBadgeSchema = z.object({
  id: z.string(),
  icon: z.enum(["shipping", "returns", "secure", "cod", "genuine", "support"]),
  title: z.string(),
  subtitle: z.string().optional(),
});

// ─── Product Rails ────────────────────────────────────────────────────────────

export const ProductRailConfigSchema = z.object({
  id: z.string(),
  railType: z.enum(["new-arrivals", "bestsellers", "category-spotlight"]),
  title: z.string(),
  subtitle: z.string().optional(),
  viewAllHref: z.string(),
  /** Max products to show. API limits to this count. */
  limit: z.number().int().positive().default(10),
  categoryId: z.string().optional(), // for category-spotlight
});

// ─── Editorial Banner ─────────────────────────────────────────────────────────

export const EditorialBannerSchema = z.object({
  id: z.string(),
  imageSrc: z.string(),
  imageAlt: z.string(),
  tagline: z.string(),
  headline: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
  textPosition: z.enum(["left", "center", "right"]).default("center"),
  textColor: z.string().default("#F5F0EB"),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const ReviewItemSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  rating: z.number().min(1).max(5),
  body: z.string(),
  productName: z.string(),
  productThumb: z.string(),
  productSlug: z.string(),
  verifiedPurchase: z.boolean().default(true),
  publishedAt: z.string(), // ISO date string
});

// ─── Newsletter ───────────────────────────────────────────────────────────────

export const NewsletterConfigSchema = z.object({
  headline: z.string(),
  subtext: z.string().optional(),
  ctaLabel: z.string().default("Subscribe"),
  placeholder: z.string().default("Enter your email"),
});

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FooterLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  openInNew: z.boolean().optional(),
});

export const FooterColumnSchema = z.object({
  id: z.string(),
  heading: z.string(),
  links: z.array(FooterLinkSchema),
});

export const FooterConfigSchema = z.object({
  columns: z.array(FooterColumnSchema),
  socialLinks: z.array(
    z.object({
      platform: z.enum([
        "instagram",
        "facebook",
        "twitter",
        "youtube",
        "linkedin",
        "pinterest",
      ]),
      href: z.string().url(),
    })
  ),
  copyrightText: z.string(),
  badgeLogos: z
    .array(z.object({ src: z.string(), alt: z.string() }))
    .optional(),
});

// ─── Full Homepage CMS Payload ────────────────────────────────────────────────

export const HomepageCmsSchema = z.object({
  announcementBar: AnnouncementBarSchema,
  navMenu: NavMenuSchema,
  heroSlide: HeroSlideSchema,
  trustBadges: z.array(TrustBadgeSchema).min(1).max(6),
  productRails: z.array(ProductRailConfigSchema),
  editorialBanner: EditorialBannerSchema,
  reviewItems: z.array(ReviewItemSchema),
  newsletter: NewsletterConfigSchema,
  footer: FooterConfigSchema,
});

// ─── TypeScript Exports ───────────────────────────────────────────────────────

export type AnnouncementItem = z.infer<typeof AnnouncementItemSchema>;
export type AnnouncementBar = z.infer<typeof AnnouncementBarSchema>;
export type NavSubItem = z.infer<typeof NavSubItemSchema>;
export type NavColumn = z.infer<typeof NavColumnSchema>;
export type NavItem = z.infer<typeof NavItemSchema>;
export type NavMenu = z.infer<typeof NavMenuSchema>;
export type HeroSlide = z.infer<typeof HeroSlideSchema>;
export type TrustBadge = z.infer<typeof TrustBadgeSchema>;
export type ProductRailConfig = z.infer<typeof ProductRailConfigSchema>;
export type EditorialBanner = z.infer<typeof EditorialBannerSchema>;
export type ReviewItem = z.infer<typeof ReviewItemSchema>;
export type NewsletterConfig = z.infer<typeof NewsletterConfigSchema>;
export type FooterLink = z.infer<typeof FooterLinkSchema>;
export type FooterColumn = z.infer<typeof FooterColumnSchema>;
export type FooterConfig = z.infer<typeof FooterConfigSchema>;
export type HomepageCms = z.infer<typeof HomepageCmsSchema>;
