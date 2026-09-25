/**
 * AnnouncementBar — ticker strip that rotates 1-line offers.
 * Navy background (#172545) with cream text (#F5F1E8).
 * Auto-scrolling marquee, pauses on hover.
 */
"use client";

import React, { useState } from "react";
import type { AnnouncementBar as AnnouncementBarData } from "@shop/types";

interface AnnouncementBarProps {
  data: AnnouncementBarData;
}

const DEFAULT_ITEMS = [
  "Free Shipping on orders above ₹999",
  "Express delivery in 2–4 business days",
  "Easy 15-day hassle-free returns",
  "Exclusive member offers — Join the Cultraven Circle",
  "New Arrivals: Pigmentum Collection — Shop Now",
];

export function AnnouncementBar({ data }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const items: string[] =
    data?.items?.length > 0 ? data.items.map((i) => i.text) : DEFAULT_ITEMS;

  // Double for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: "#172545",
        height: "36px",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Ticker track */}
      <div
        className="ticker-track"
        style={{ gap: "0", animationDuration: `${items.length * 7}s` }}
      >
        {doubled.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center"
            style={{
              color: "#F5F1E8",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              fontFamily: "var(--font-body)",
              paddingRight: "0",
            }}
          >
            {text}
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#C94227",
                margin: "0 2.5rem",
                flexShrink: 0,
              }}
            />
          </span>
        ))}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-5 rounded-full opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: "#F5F1E8" }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Subtle left/right fade */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16"
        style={{ background: "linear-gradient(to right, #172545, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16"
        style={{ background: "linear-gradient(to left, #172545, transparent)" }}
      />
    </div>
  );
}
