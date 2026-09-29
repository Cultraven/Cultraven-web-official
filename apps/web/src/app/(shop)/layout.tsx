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
      { id: "new-in", label: "NEW IN", href: "/collections/new-in" },
      { id: "sale", label: "SALE", href: "/collections/sale" },
      {
        id: "shop",
        label: "SHOP",
        columns: [
          {
            heading: "Categories",
            items: [
              { label: "Oversized Tees", href: "/category/oversized-tees" },
              { label: "Acid Wash", href: "/category/acid-wash" },
              { label: "Heavyweight Hoodies", href: "/category/hoodies" },
              { label: "Baggy Jeans", href: "/category/jeans" },
              { label: "Street Accessories", href: "/category/accessories" },
            ],
          },
          {
            heading: "Fits",
            items: [
              { label: "Oversized", href: "/collections/oversized" },
              { label: "Relaxed", href: "/collections/relaxed" },
              { label: "Boxy", href: "/collections/boxy" },
            ]
          }
        ],
      },
      {
        id: "collections",
        label: "COLLECTIONS",
        columns: [
          {
            heading: "Featured",
            items: [
              { label: "Dharma Collection", href: "/collections/dharma" },
              { label: "Dragon Blood", href: "/collections/dragon-blood" },
              { label: "Acid State", href: "/collections/acid-state" },
              { label: "Core Essentials", href: "/collections/core" },
            ],
          },
        ],
      },
      { id: "about", label: "ABOUT", href: "/pages/about" },
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
      { id: "a1", text: "Free Shipping on orders above ₹999" },
      { id: "a2", text: "Express delivery in 2–4 business days" },
      { id: "a3", text: "Easy 15-day hassle-free returns" },
      { id: "a4", text: "Exclusive member offers — Join the Cultraven Circle" },
    ],
    bgColor: "#172545",
    textColor: "#F5F1E8",
    intervalMs: 4000,
  };

  return (
    <>
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
