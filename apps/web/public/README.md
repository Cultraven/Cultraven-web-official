# CULTRAVEN Storefront — public/ image assets

## Required Images

Place the following files in this directory before launching in production.
During development, the hero and editorial banner will show placeholder images.

| Path | Size | Notes |
|---|---|---|
| `images/hero-desktop.jpg` | 1920×1080 (16:9) min | LCP image — optimize for <200KB |
| `images/hero-mobile.jpg` | 750×1334 (portrait) | Mobile hero |
| `images/editorial-banner.jpg` | 1440×800 | Below-fold lifestyle shot |
| `images/logo.png` | 200×60 transparent | Used in JSON-LD + og:image |
| `images/og-default.jpg` | 1200×630 | Open Graph fallback image |

### Product thumbnails (fixture data)
The development fixture uses `https://picsum.photos` as placeholder product images.
In production, product images are served from Google Cloud Storage (configured via `STORAGE_BUCKET`).

### Optimisation guidelines
- Use AVIF/WebP (Next.js auto-converts via `next/image`)
- Hero image must be < 200KB compressed for LCP < 2.5s target
- All images should have proper alt text set in the CMS (HeroSlide.altText, etc.)
