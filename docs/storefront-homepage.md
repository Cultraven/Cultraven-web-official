# CULTRAVEN Storefront — Homepage Implementation Guide

> **Brand:** CULTRAVEN — Premium Men's D2C Clothing  
> **App:** `apps/web` — Next.js 15 App Router, strict TypeScript  
> **Last updated:** 2026-09-25

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-ink` | `#0A0A0A` | Primary text, backgrounds |
| `--color-cream` | `#F5F0EB` | Page background, light surfaces |
| `--color-gold` | `#C9A84C` | Accent, CTAs, highlights |
| `--color-stone` | `#8A8078` | Secondary text, borders |
| `--color-charcoal` | `#1C1C1C` | Card backgrounds, header |
| `--font-display` | Cormorant Garamond | Hero text, section headings |
| `--font-body` | Inter | UI, body copy, nav |

## Section Components (all in `apps/web/src/components/home/`)

1. **AnnouncementBar** — Rotating ticker, admin-editable messages, 3-4s auto-scroll
2. **Header** — Sticky, logo, mega-menu, search, account, CartBadge, location
3. **MegaMenu** — Desktop columns / mobile accordion drawer
4. **HeroBanner** — Full-width image/video, CTA overlay, JSON-LD, LCP priority
5. **TrustBadges** — 4 icon strip (Free Shipping, Returns, Secure Pay, COD)
6. **ProductCarousel** — Reusable rail, 3 instances (New Arrivals, Bestsellers, Spotlight)
7. **ProductCard** — Hover image swap, price/MRP, "Choose Options" CTA
8. **EditorialBanner** — Full-width lifestyle image + brand statement
9. **ReviewCarousel** — Star ratings, name, product thumb
10. **NewsletterSignup** — Email capture, inline form
11. **Footer** — About, Customer Care, Shop, Social columns

## API Routes (all under `apps/web/src/app/api/`)

- `cms/home/route.ts` — Full homepage CMS payload
- `products/featured/route.ts` — New arrivals + bestsellers + spotlight

## Data Architecture

All section content is fetched server-side in `app/(shop)/page.tsx` and passed as props.
No client components fetch data — only handle interactions (menu open, carousel drag, cart).

## Performance Rules

- `next/image` everywhere; `priority` only on hero image
- Fonts preloaded via `next/font/google`
- Below-fold components use `loading="lazy"` (Next.js default)
- Target LCP < 2.5s, CLS < 0.1, Lighthouse ≥ 90 all categories
