import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Optional: lets CI / verification builds use an isolated output dir (defaults to .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@shop/ui", "@shop/types", "@shop/api-client"],

  images: {
    // Domains allowed for next/image — add production CDN here
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      // Add your production image CDN here, e.g.:
      // { protocol: "https", hostname: "cdn.cultraven.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // Qualities requested in code (hero uses 70, optimizedImage defaults to 72); required config from Next 16.
    qualities: [70, 72, 75],
    // Optimized variants are immutable for a given URL — keep them for 30 days instead of the 60s default.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compress output
  compress: true,

  // Strict headers for security (Rule 19 compliance)
  async headers() {
    return [
      {
        // Uploaded media has a random, content-unique filename → safe to cache forever.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // geolocation=(self): the site's own pages may use the browser location API; third-party frames may not.
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Allow Razorpay scripts + checkout, Google Fonts, Meta Pixel, GA4
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://connect.facebook.net https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https:",
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://analytics.google.com https://graph.facebook.com",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Permanent redirects for canonical URL aliases
  async redirects() {
    return [
      // /size-guide → /pages/size-guide (links in Footer, ProductClient, CMS use /size-guide)
      {
        source: "/size-guide",
        destination: "/pages/size-guide",
        permanent: true,
      },
      // The static blog duplicated the CMS-driven Journal and linked to non-existent posts
      { source: "/pages/blog/:path*", destination: "/pages/journal", permanent: false },
      // /shop/t-shirts → /shop/category/t-shirts (canonical for social links)
      {
        source: "/shop/:slug",
        destination: "/category/:slug",
        permanent: false,
      },
    ];
  },
};

export default config;
