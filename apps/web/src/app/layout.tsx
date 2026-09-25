import type { ReactNode } from "react";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@/styles/globals.css";

// ─── Font loading (next/font — zero layout shift) ─────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// ─── JSON-LD — Organization ───────────────────────────────────────────────────
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CULTRAVEN",
  alternateName: "Cultraven Clothing",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com"}/images/logo.png`,
  description:
    "CULTRAVEN is a Gen-Z Indian streetwear brand for those who don't dress to fit in — they create their own identity. Oversized heavyweights, acid washes, mythic graphics.",
  slogan: "Wear Your Difference.",
  sameAs: [
    "https://www.instagram.com/cultraven",
    "https://www.facebook.com/cultraven",
    "https://twitter.com/cultraven",
    "https://www.youtube.com/cultraven",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "English",
  },
};

// ─── Default Metadata ─────────────────────────────────────────────────────────
export const metadata = {
  metadataBase: new URL("https://cultraven.com"),
  title: {
    default: "CULTRAVEN — Wear Your Difference | Gen Z Streetwear India",
    template: "%s | CULTRAVEN",
  },
  description:
    "CULTRAVEN is India's boldest Gen-Z streetwear brand. Shop oversized essentials, acid-wash heavyweights, mythic graphic tees, and limited-edition drops. Free delivery above ₹999.",
  keywords: [
    "gen z streetwear india",
    "oversized t-shirts india",
    "cultraven",
    "acid wash tshirt",
    "heavyweight streetwear",
    "graphic tees india",
    "streetwear brand india",
    "dharma collection",
    "dragon blood tshirt",
    "wear your difference",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "CULTRAVEN",
    title: "CULTRAVEN — Wear Your Difference | Gen Z Streetwear India",
    description:
      "A generation that doesn't dress to fit in. Shop CULTRAVEN — oversized heavyweights, acid-state washes, mythic graphics, and street-ready drops.",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "CULTRAVEN — Wear Your Difference",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@cultraven",
    title: "CULTRAVEN — Wear Your Difference",
    description:
      "India's boldest Gen Z streetwear brand. Oversized. Washed. Heavy. Different.",
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
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* JSON-LD — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
