/**
 * PageHero: the heading strip at the top of an inner page. Text and background photo are editable in
 * Admin -> Website content -> Page banners; blank fields fall back to the page's own wording.
 */
import React from "react";
import { getPageBanner } from "@/lib/page-banners";
import "./pageHero.css";

export interface HeroDefaults { eyebrow?: string; title: string; subtitle?: string }

export async function PageHero({ slug, defaults, align = "left", tall = false, fallbackImage = "" }: { slug: string; defaults: HeroDefaults; align?: "left" | "center"; tall?: boolean; fallbackImage?: string }) {
  const b = await getPageBanner(slug);
  const eyebrow = b?.eyebrow || defaults.eyebrow;
  const title = b?.title || defaults.title;
  const subtitle = b?.subtitle || defaults.subtitle;
  const image = b?.image || fallbackImage;
  const overlay = Math.min(90, Math.max(0, typeof b?.overlay === "number" ? b.overlay : 55)) / 100;
  return (
    <header className={`ph${tall ? " ph-tall" : ""}${align === "center" ? " ph-center" : ""}`}>
      {image ? <div className="ph-bg" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" /> : null}
      {image ? <div className="ph-shade" style={{ background: `rgba(23, 37, 84, ${overlay})` }} aria-hidden="true" /> : null}
      <div className="ph-in">
        {eyebrow ? <p className="ph-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="ph-sub">{subtitle}</p> : null}
      </div>
    </header>
  );
}
