/**
 * Shared storefront shell — AnnouncementBar, Header, Back bar, Footer, consent banner.
 * All chrome content (announcement, navigation, footer) is read from MongoDB on the server via getCmsSection().
 * Empty section or unreachable database → the element renders without content (layout preserved); nothing is fabricated.
 */
import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { PageBackBar } from "@/components/common/PageBackBar";
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export async function SiteChrome({ children }: { children: ReactNode }) {
  const [announcement, nav, footer] = await Promise.all([
    getCmsSection<any>("site.announcement"),
    getCmsSection<any>("site.nav"),
    getCmsSection<any>("site.footer"),
  ]);

  const navMenu = {
    items: liveItems<any>(nav.data?.items).map((i) => {
      const columns = (i.columns ?? []).filter((c: any) => c.items?.length);
      return { id: i.id, label: i.label, href: i.href || undefined, columns: columns.length ? columns : undefined };
    }),
  };

  const announcementData = {
    items: liveItems<any>(announcement.data?.items).map((i) => ({ id: i.id, text: i.text, link: i.link || undefined })),
    intervalMs: announcement.data?.intervalMs ?? 4000,
    bgColor: "var(--color-navy)",
    textColor: "var(--color-cream)",
  };

  const footerData = {
    columns: (footer.data?.columns ?? []).map((c: any) => ({ id: c.id, heading: c.heading, links: c.links ?? [] })),
    socialLinks: footer.data?.socialLinks ?? [],
    copyrightText: footer.data?.copyrightText ?? "",
    badgeLogos: [],
  };

  return (
    <>
      <AnnouncementBar data={announcementData as any} />
      <Header navMenu={navMenu as any} deliveryCity="Delhi" />
      <main id="main-content">
        <PageBackBar />
        {children}
      </main>
      <Footer config={footerData as any} />
      <CookieConsentBanner />
    </>
  );
}
