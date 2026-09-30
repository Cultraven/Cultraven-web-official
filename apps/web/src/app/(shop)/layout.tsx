/**
 * Shop shell layout — wraps all storefront pages with:
 *   - AnnouncementBar (top)
 *   - Header (sticky)
 *   - Main content
 *   - Footer (bottom)
 *
 * Data is fetched server-side and passed as props to client components.
 */

import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { getHomepageCms } from "@/lib/api";

interface ShopLayoutProps {
  children: ReactNode;
}

export default async function ShopLayout({ children }: ShopLayoutProps) {
  // Fetch CMS data for persistent layout elements (header nav, footer, announcement bar)
  let cms;
  try {
    cms = await getHomepageCms();
  } catch {
    // Graceful fallback — show minimal layout without CMS data
    cms = null;
  }

  const defaultNav = {
    items: [
      { id: "new-in", label: "NEW", href: "/collections/new-in" },
      {
        id: "shop",
        label: "SHOP",
        columns: [
          {
            heading: "Categories",
            items: [
              { label: "T-Shirts & Tees", href: "/collections/tees" },
              { label: "Hoodies", href: "/collections/hoodies" },
              { label: "Sweatshirts", href: "/collections/sweatshirts" },
              { label: "Cargo & Bottoms", href: "/collections/bottoms" },
              { label: "Shirts", href: "/collections/shirts" },
              { label: "Outerwear", href: "/collections/outerwear" },
              { label: "Accessories", href: "/collections/accessories" },
            ],
          },
          {
            heading: "By Fit",
            items: [
              { label: "Oversized", href: "/collections/oversized" },
              { label: "Relaxed Fit", href: "/collections/relaxed" },
              { label: "Boxy", href: "/collections/boxy" },
              { label: "Slim", href: "/collections/slim" },
            ]
          }
        ],
      },
      {
        id: "drops",
        label: "DROPS",
        columns: [
          {
            heading: "Collections",
            items: [
              { label: "Dharma Series", href: "/collections/dharma" },
              { label: "Dragon Blood", href: "/collections/dragon-blood" },
              { label: "Acid State", href: "/collections/acid-state" },
              { label: "Core Essentials", href: "/collections/core" },
              { label: "All Collections", href: "/collections" },
            ],
          },
          {
            heading: "Explore",
            items: [
              { label: "Latest Drops", href: "/collections/new-in" },
              { label: "Best Sellers", href: "/collections/bestsellers" },
              { label: "Under ₹1,999", href: "/collections/sale" },
            ],
          },
        ],
      },
      { id: "sale", label: "SALE", href: "/collections/sale" },
      { id: "about", label: "ABOUT", href: "/pages/our-heritage" },
    ],
  };

  const defaultFooter = {
    columns: [],
    socialLinks: [],
    copyrightText: `© ${new Date().getFullYear()} CULTRAVEN`,
    badgeLogos: [],
  };

  const defaultAnnouncement = {
    items: [
      { id: "a1", text: "ACID STATE DROP OUT NOW" },
      { id: "a2", text: "FREE SHIPPING ON ORDERS ABOVE ₹1,999" },
      { id: "a3", text: "CASH ON DELIVERY AVAILABLE" },
      { id: "a4", text: "EASY 7-DAY RETURNS" },
    ],
    bgColor: "var(--color-navy)",
    textColor: "var(--color-cream)",
    intervalMs: 4000,
  };

  return (
    <>
      {/* ── Announcement bar ──────────────────────────────────────────── */}
      <AnnouncementBar data={(cms as any)?.announcementBar ?? defaultAnnouncement} />

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <Header
        navMenu={cms?.navMenu ?? defaultNav}
        deliveryCity="Delhi"
      />

      {/* ── Page content ──────────────────────────────────────────────── */}
      <main id="main-content">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <Footer config={cms?.footer ?? defaultFooter} />

      {/* ── Cookie consent banner ─────────────────────────────────────── */}
      <CookieConsentBanner />
    </>
  );
}
