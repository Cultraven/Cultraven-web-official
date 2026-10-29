/**
 * manifest.ts: web app manifest, served at /manifest.webmanifest.
 * Lets phones "Add to Home Screen" with the CULTRAVEN icon and brand colours, and is part of a clean Lighthouse / SEO report.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CULTRAVEN",
    short_name: "CULTRAVEN",
    description: "Oversized t-shirts, hoodies and cargo pants from an Indian streetwear brand. Free delivery above ₹1,999, Cash on Delivery and easy 7-day returns.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F6F1E7",
    theme_color: "#172554",
    lang: "en-IN",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
