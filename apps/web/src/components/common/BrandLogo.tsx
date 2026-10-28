import Image from "next/image";

/** The CULTRAVEN logo (emblem + wordmark side by side). tone="light" renders it white for dark backgrounds. */
export function BrandLogo({ height = 40, tone = "dark", priority = false }: { height?: number; tone?: "dark" | "light"; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo-horizontal"
      alt="CULTRAVEN"
      width={Math.round((height * 1100) / 242)}
      height={height}
      priority={priority}
      style={{ height, width: "auto", alignSelf: "flex-start", objectFit: "contain", display: "block", filter: tone === "light" ? "brightness(0) invert(1)" : "none" }}
    />
  );
}
