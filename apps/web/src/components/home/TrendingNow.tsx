import React from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";
import { SectionComingSoon } from "./SectionComingSoon";
export interface TrendItem { id: string; title: string; href: string; image: string; alt?: string }

/** Heading + cards come from the database (home.trending). */
export function TrendingNow({ heading, items }: { heading?: string; items: TrendItem[] }) {
  if (items.length === 0) return <SectionComingSoon heading={heading || "Trending Now"} text="What everyone is wearing will show up here soon." />;
  return (
    <section
      className="cv-auto"
      style={{
        backgroundColor: "var(--color-cream)",
        padding: "clamp(4rem,8vw,8rem) 0",
      }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Section heading */}
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            
            fontSize: "clamp(2rem,4.5vw,3.75rem)",
            fontWeight: 600,
            color: "var(--color-navy)",
            marginBottom: "2.5rem",
            lineHeight: 1,
          }}
        >
          {heading}
        </h2>

        {/* 3-column grid */}
        <div
          className="trend-grid"
        >
          {items.map((item) => (
            <TrendCard key={item.id} item={item} />
          ))}
        </div>
      </div>

    </section>
  );
}

function TrendCard({ item }: { item: TrendItem }) {
  return (
    <div
      style={{ position: "relative", backgroundColor: "var(--color-mist)" }}
      className="trend-card"
    >
      <Link
        href={item.href}
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          aspectRatio: "3/4",
          overflow: "hidden",
        }}
      >
        <Image
          src={item.image}
          alt={item.alt || item.title}
          fill
          sizes="(max-width: 1024px) 75vw, 33vw"
          style={{ objectFit: "cover", transition: "transform 0.65s ease" }}
          className="trend-img"
        />

        {/* Name: plain white text on the photo; a soft fade at the bottom keeps it readable */}
        <div aria-hidden="true" className="trend-fade" />
        <div
          style={{
            position: "absolute",
            zIndex: 1,
            bottom: "1.1rem",
            left: "1.25rem",
            right: "1.25rem",
            textAlign: "left",
          }}
          className="trend-bar"
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 900,
              fontSize: "0.85rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#fff",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.35)",
            }}
          >
            {item.title}
          </span>
        </div>
      </Link>

    </div>
  );
}
