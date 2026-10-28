"use client";
/** The list of real products, collections and pages the admin can link to (one shared fetch). */
import { useEffect, useState } from "react";

export interface LinkTargets {
  products: { slug: string; title: string; image: string; inStock: boolean; pricePaise: number; category: string; color: string }[];
  collections: { href: string; label: string }[];
  pages: { href: string; label: string }[];
}

let cache: Promise<LinkTargets | null> | null = null;
const load = () => (cache ??= fetch("/api/admin/link-targets", { cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<LinkTargets>) : null)).catch(() => null).then((d) => { if (!d) cache = null; return d; }));

export function useLinkTargets(): LinkTargets | null {
  const [t, setT] = useState<LinkTargets | null>(null);
  useEffect(() => { let on = true; load().then((d) => { if (on) setT(d); }); return () => { on = false; }; }, []);
  return t;
}
