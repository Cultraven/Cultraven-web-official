/**
 * TrustBadges — 3-4 icon strip displayed directly under the hero.
 * Icons: Free Shipping | Easy Returns | Secure Payments | COD Available
 * All content is admin-editable via CMS (TrustBadge[]).
 */

import React from "react";
import type { TrustBadge } from "@shop/types";

interface TrustBadgesProps {
  badges: TrustBadge[];
}

type TrustBadgeIcon = TrustBadge["icon"];

const ICON_MAP: Record<TrustBadgeIcon, React.ReactElement> = {
  shipping: (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2" y="8" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M18 10l6 4v6h-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="7" cy="21" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="21" cy="21" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  returns: (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M4 14a10 10 0 1010-10H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 10l-4-6 4 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  secure: (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 3L4 7v8c0 5.25 4.5 9.75 10 11 5.5-1.25 10-5.75 10-11V7L14 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M9 14l3.5 3.5L19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  cod: (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="22" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 12h22" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  genuine: (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 14l3.5 3.5L19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  support: (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 12a4 4 0 018 0c0 3-4 5-4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="21" r="1" fill="currentColor"/>
    </svg>
  ),
};

export function TrustBadges({ badges }: TrustBadgesProps) {
  return (
    <section
      aria-label="Why shop at CULTRAVEN"
      className="bg-[var(--color-black)] text-[var(--color-white)] border-y-4 border-[var(--color-white)]"
    >
      <div className="container-full px-6 md:px-12 py-6">
        <ul
          role="list"
          className="flex flex-wrap justify-between gap-6"
        >
          {badges.map((badge) => (
            <li
              key={badge.id}
              className="flex items-center gap-4 min-w-[180px]"
            >
              {/* Icon */}
              <span
                className="flex-shrink-0"
                aria-hidden="true"
              >
                {ICON_MAP[badge.icon]}
              </span>

              {/* Text */}
              <div>
                <p className="font-display text-[11px] font-black tracking-widest uppercase">
                  {badge.title}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
