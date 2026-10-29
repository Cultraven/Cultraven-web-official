import type { ReactNode } from "react";
import { Archivo, Hanken_Grotesk, Noto_Sans_Devanagari } from "next/font/google";
import "@/styles/globals.css";
import { ChatWidgetGate } from "@/components/common/ChatWidgetGate";
import { StoreRehydrator } from "@/components/common/StoreRehydrator";
import { ToastProvider } from "@/components/common/Toast";
import { BUSINESS } from "@/lib/business";

// ─── Font loading (next/font — zero layout shift) ─────────────────────────────
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["800", "900"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-deva",
  display: "swap",
  weight: "600",
  preload: false,
});

// ─── JSON-LD — Organization ───────────────────────────────────────────────────
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CULTRAVEN",
  alternateName: "Cultraven Clothing",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com"}/logo-stacked.png`,
  description:
    "CULTRAVEN is an Indian clothing brand selling oversized t-shirts, hoodies, cargo pants and streetwear online, with Cash on Delivery and easy 7-day returns.",
  slogan: "Wear Your Difference.",
  sameAs: [
    BUSINESS.instagramUrl,
    "https://x.com/cultraven_",
    "https://www.facebook.com/profile.php?id=61595224413709",
    "https://www.reddit.com/user/Cultraven_official/",
  ],
  email: BUSINESS.supportEmail,
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.addressLines[0],
    addressLocality: "Indore",
    addressRegion: "Madhya Pradesh",
    postalCode: "452005",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: `+${BUSINESS.supportPhoneDigits}`,
    email: BUSINESS.supportEmail,
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
};

// ─── JSON-LD — WebSite (names the site for search results) ────────────────────
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CULTRAVEN",
  alternateName: "Cultraven Clothing",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com",
  inLanguage: "en-IN",
};

// ─── Default Metadata ─────────────────────────────────────────────────────────
export const metadata = {
  metadataBase: new URL("https://cultraven.com"),
  title: {
    default: "CULTRAVEN | Oversized T-Shirts, Hoodies & Cargo Pants",
    template: "%s | CULTRAVEN",
  },
  description:
    "Shop oversized t-shirts, hoodies and cargo pants online at CULTRAVEN. Free delivery above ₹1,999, Cash on Delivery and easy 7-day returns.",
  keywords: [
    "buy oversized t-shirts online india",
    "oversized t-shirts india",
    "cultraven",
    "acid wash tshirt",
    "heavyweight streetwear",
    "graphic tees india",
    "streetwear brand india",
    "oversized hoodies india",
    "cargo pants india",
    "wear your difference",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "CULTRAVEN",
    title: "CULTRAVEN | Oversized T-Shirts, Hoodies & Cargo Pants",
    description:
      "Shop oversized t-shirts, hoodies and cargo pants online. Free delivery above ₹1,999, Cash on Delivery and easy returns.",
    images: [
      {
        url: "/brand/share",
        width: 1200,
        height: 630,
        alt: "CULTRAVEN — Wear Your Difference",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@cultraven_",
    title: "CULTRAVEN — Wear Your Difference",
    description:
      "Oversized t-shirts, hoodies & cargo pants. Free delivery above ₹1,999. Cash on Delivery & easy returns.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  icons: {
    // PNG logo icons (?v= makes browsers drop a cached older tab icon). /favicon.ico stays on disk for crawlers that ask for it by default.
    icon: [{ url: "/brand/favicon?v=7", type: "image/png" }],
    apple: [{ url: "/brand/favicon?v=7" }],
  },
};

/** Colours the phone's browser bar in the brand navy. */
export const viewport = { themeColor: "#172554" };

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${archivo.variable} ${hanken.variable} ${notoDeva.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* JSON-LD — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* JSON-LD — WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* Analytics: nothing loads until the visitor consents (cookie banner dispatches "cookie_consent") */}
        <script
          id="ga4-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var id = ${JSON.stringify(process.env.NEXT_PUBLIC_GA_ID || "")};
                if (!id || /X{4,}/.test(id)) return;
                window.dataLayer = window.dataLayer || [];
                function gtag(){ dataLayer.push(arguments); }
                var started = false;
                function start() {
                  if (started) return; started = true;
                  var s = document.createElement('script'); s.async = true;
                  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
                  document.head.appendChild(s);
                  gtag('js', new Date()); gtag('config', id);
                }
                window.addEventListener('cookie_consent', function (e) { if (e.detail && e.detail.accepted) start(); });
                try { if (localStorage.getItem('cultraven_cookie_consent') === 'accepted') start(); } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          <StoreRehydrator />
          {children}
          <ChatWidgetGate />
        </ToastProvider>
      </body>
    </html>
  );
}
