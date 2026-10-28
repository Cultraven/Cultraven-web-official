/** The brand images served at /brand/<name> (see app/brand/[name]/route.ts) and the admin field that controls each. */
/** name -> the field in site.branding, and the built-in file used when that field is empty */
export const BRAND_IMAGES: Record<string, { field: string; fallback: string }> = {
  "logo-horizontal": { field: "logoHorizontal", fallback: "/logo-horizontal.png" },
  "logo-stacked": { field: "logoStacked", fallback: "/logo-stacked.png" },
  "logo-mark": { field: "logoMark", fallback: "/logo-mark.png" },
  favicon: { field: "favicon", fallback: "/icon.png" },
  share: { field: "shareImage", fallback: "/og-default.jpg" },
};

/** Only an uploaded file (a path on this site) or an https image address can be served. */
export function isServableSource(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (s.startsWith("/")) return !s.startsWith("//") && !s.includes("\\") && !s.includes("..");
  try { return new URL(s).protocol === "https:"; } catch { return false; }
}

