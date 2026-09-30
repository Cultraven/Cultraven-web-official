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
  "FREE DELIVERY ABOVE ₹999",
  "CASH ON DELIVERY AVAILABLE",
  "7-DAY HASSLE-FREE RETURNS",
  "EXTRA 10% OFF ON PREPAID ORDERS",
];

export function AnnouncementBar({ data }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const items: string[] =
    data?.items?.length > 0 ? data.items.map((i) => i.text.toUpperCase()) : DEFAULT_ITEMS;

  // Double for seamless loop
  const doubled = [...items, ...items, ...items, ...items];

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: "#172545",
        height: "44px",
        display: "flex",
        alignItems: "center",
        borderBottom: "var(--border-thick)",
        boxSizing: "border-box",
      }}
    >
      {/* Ticker track */}
      <div
        className="ticker-track"
        style={{ gap: "0", animationDuration: `${items.length * 5}s` }}
      >
        {doubled.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center"
            style={{
              color: "#F5F1E8",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.1em",
              fontFamily: "var(--font-sans)",
              paddingRight: "0",
              whiteSpace: "nowrap",
            }}
          >
            {text}
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                background: "#C94227",
                margin: "0 2rem",
                flexShrink: 0,
                transform: "rotate(45deg)",
              }}
            />
          </span>
        ))}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-none transition-transform"
        style={{ color: "#172545", backgroundColor: "#F5F1E8", border: "2px solid #172545" }}
      >
        <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </button>
    </div>
  );
}
