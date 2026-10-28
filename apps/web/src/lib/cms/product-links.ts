/** Every "/products/<slug>" link found anywhere inside a CMS section value (used to refuse saving a link to a product that does not exist). */
export function productSlugsIn(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") {
    const m = /^\/products\/([^/?#\s]+)/.exec(v.trim());
    if (m) { try { out.push(decodeURIComponent(m[1])); } catch { out.push(m[1]); } }
  } else if (Array.isArray(v)) v.forEach((x) => productSlugsIn(x, out));
  else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach((x) => productSlugsIn(x, out));
  return out;
}
