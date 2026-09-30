"use client";

import React, { useState } from "react";
import type { AnnouncementBar as AnnouncementBarData } from "@shop/types";

interface AnnouncementBarProps {
  data: AnnouncementBarData;
}

export function AnnouncementBar({ data }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  // Messages come from the database (site.announcement). None configured → no bar.
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  // Repeat items to make a seamless marquee
  const marqueeItems = [...items, ...items, ...items];

  return (
    <div
      role="region"
      aria-label="Announcements"
      style={{
        position: "relative",
        width: "100%",
        height: "36px",
        backgroundColor: "var(--color-navy)",
        color: "var(--color-bone)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Scrolling ticker */}
      <div
        className="ann-track"
        style={{
          display: "flex",
          whiteSpace: "nowrap",
          animation: "annTicker 28s linear infinite",
          willChange: "transform",
        }}
      >
        {marqueeItems.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2.5rem",
              paddingRight: "2.5rem",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {item.text}
            <span style={{ color: "var(--color-lava)", fontSize: "10px" }}>◆</span>
          </span>
        ))}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        style={{
          position: "absolute",
          right: "1rem",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          width: "20px",
          height: "20px",
          color: "rgba(245,241,232,0.5)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
        </svg>
      </button>

      <style>{`
        @keyframes annTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .ann-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
