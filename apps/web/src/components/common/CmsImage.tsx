import NextImage, { type ImageProps } from "next/image";

// Hosts next.config.ts allows for the image optimizer. Admin-entered URLs from any other
// https host render unoptimized instead of crashing the page — without opening the
// optimizer to arbitrary hosts.
const OPTIMIZED_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com", "picsum.photos", "storage.googleapis.com"]);

/** Drop-in for next/image that tolerates CMS-provided URLs. Empty src renders nothing. */
export default function CmsImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  if (typeof props.src === "string" && !src) return null;

  let unoptimized = props.unoptimized;
  if (src.startsWith("http")) {
    try {
      if (!OPTIMIZED_HOSTS.has(new URL(src).hostname)) unoptimized = true;
    } catch {
      unoptimized = true;
    }
  }
  // eslint-disable-next-line jsx-a11y/alt-text
  return <NextImage {...props} unoptimized={unoptimized} />;
}
