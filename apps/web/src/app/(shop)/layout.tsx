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
      { id: "home", label: "Home", href: "/" },
      { id: "shop", label: "Shop", href: "/collections/all" },
    ],
  };

  const defaultFooter = {
    columns: [],
    socialLinks: [],
    copyrightText: `© ${new Date().getFullYear()} CULTRAVEN`,
    badgeLogos: [],
  };

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────────────── */}

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
    </>
  );
}
