"use client";
/**
 * HeroRibbon: the scrolling strip right under the hero banner.
 * Everything comes from the database (home.heroRibbon): an on/off switch, the colour, the speed, the messages and whether visitors get a
 * close (✕) button. Switched off, or with no visible message, it renders nothing.
 * A visitor who closes it does not see it again for the rest of their visit; new messages bring it back.
 */
import React, { useEffect, useState } from "react";
import "./HeroRibbon.css";

export interface HeroRibbonContent {
  enabled?: boolean;
  tone?: string;
  seconds?: number;
  /** Show the ✕ close button (on unless the owner switched it off). */
  dismissible?: boolean;
  items?: { id?: string; text?: string; active?: boolean }[];
}

const CLOSED_KEY = "cultraven-ribbon-closed";
const clampSeconds = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.min(120, Math.max(10, Math.round(n))) : 40; };
/** Small fingerprint of the messages, so a changed ribbon shows again for people who closed the old one. */
const fingerprint = (messages: string[]) => { let h = 5381; for (const ch of messages.join("\u0001")) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return String(h >>> 0); };

export function HeroRibbon({ content }: { content?: HeroRibbonContent | null }) {
  const messages = content && content.enabled !== false
    ? (content.items ?? []).filter((i) => i && i.active !== false && typeof i.text === "string" && i.text.trim()).map((i) => (i.text as string).trim())
    : [];
  const key = fingerprint(messages);
  const [closed, setClosed] = useState(false);

  // Remembered for the visit (this tab). Storage can be blocked (private mode): then it simply shows again next time.
  useEffect(() => {
    try { setClosed(sessionStorage.getItem(CLOSED_KEY) === key); } catch { /* storage unavailable */ }
  }, [key]);

  if (!content || content.enabled === false || messages.length === 0 || closed) return null;

  const tone = String(content.tone ?? "").toLowerCase() === "gold" ? "gold" : "navy";
  const dismissible = content.dismissible !== false;
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
      {dismissible ? (
        <button
          type="button"
          className="hr-close"
          aria-label="Close this ribbon"
          onClick={() => {
            setClosed(true);
            try { sessionStorage.setItem(CLOSED_KEY, key); } catch { /* storage unavailable */ }
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
