import NextImage, { getImageProps, type ImageProps } from "next/image";

// Hosts next.config.ts allows for the image optimizer. Admin-entered URLs from any other
// https host render unoptimized instead of crashing the page — without opening the
// optimizer to arbitrary hosts.
const OPTIMIZED_HOSTS = new Set(["images.unsplash.com", "plus.unsplash.com", "picsum.photos", "storage.googleapis.com"]);

/** True when the URL can go through the Next image optimizer (local path or an allow-listed host). */
export function canOptimize(src: string): boolean {
  if (!src.startsWith("http")) return src.startsWith("/");
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

/** Drop-in for next/image that tolerates CMS-provided URLs. Empty src renders nothing. */
export default function CmsImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  if (typeof props.src === "string" && !src) return null;
  const unoptimized = props.unoptimized ?? (typeof props.src === "string" ? !canOptimize(src) : undefined);
  // eslint-disable-next-line jsx-a11y/alt-text
  return <NextImage {...props} unoptimized={unoptimized} />;
}

/**
 * Responsive, optimized props for art-directed <picture> markup (separate desktop / mobile crops).
 * Returns the same srcSet/sizes next/image would generate (AVIF/WebP, right-sized).
 */
export function optimizedImage(src: string, opts: { alt: string; sizes: string; priority?: boolean; quality?: number }) {
  return getImageProps({
    src,
    alt: opts.alt,
    fill: true,
    sizes: opts.sizes,
    quality: opts.quality ?? 72,
    priority: opts.priority,
    unoptimized: !canOptimize(src),
  }).props;
}
