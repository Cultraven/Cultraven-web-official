/**
 * HeroRibbon: the scrolling strip right under the hero banner.
 * Everything comes from the database (home.heroRibbon): an on/off switch, the colour, the speed and the messages.
 * Switched off, or with no visible message, it renders nothing.
 */
import React from "react";
import "./HeroRibbon.css";

export interface HeroRibbonContent {
  enabled?: boolean;
  tone?: string;
  seconds?: number;
  items?: { id?: string; text?: string; active?: boolean }[];
}

const clampSeconds = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.min(120, Math.max(10, Math.round(n))) : 40; };

export function HeroRibbon({ content }: { content?: HeroRibbonContent | null }) {
  if (!content || content.enabled === false) return null;
  const messages = (content.items ?? []).filter((i) => i && i.active !== false && typeof i.text === "string" && i.text.trim()).map((i) => (i.text as string).trim());
  if (messages.length === 0) return null;

  const tone = String(content.tone ?? "").toLowerCase() === "gold" ? "gold" : "navy";
  // One "half" must be wider than a wide screen so the loop never shows a gap; the track holds two identical halves and slides by 50%.
  const repeats = Math.max(1, Math.ceil(10 / messages.length));
  const half = Array.from({ length: repeats }, (_, r) => messages.map((m, i) => (
    <span key={`${r}-${i}`} className="hr-item"><span>{m}</span><i aria-hidden="true">✦</i></span>
  )));

  return (
    <div className={`hr-ribbon hr-${tone}`} role="region" aria-label="Highlights">
      <ul className="hr-sr">{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
      <div className="hr-track" aria-hidden="true" style={{ animationDuration: `${clampSeconds(content.seconds)}s` }}>
        {half}
        {half}
      </div>
    </div>
  );
}
