import React from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";
export interface TrendItem { id: string; title: string; href: string; image: string; alt?: string }

/** Heading + cards come from the database (home.trending). */
export function TrendingNow({ heading, items }: { heading?: string; items: TrendItem[] }) {
  if (items.length === 0) return null;
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
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "1.5rem",
          }}
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
          maxHeight: "clamp(280px, 30vw, 460px)",
          overflow: "hidden",
        }}
      >
        <Image
          src={item.image}
          alt={item.alt || item.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{ objectFit: "cover", transition: "transform 0.65s ease" }}
          className="trend-img"
        />

        {/* Bottom bar CTA */}
        <div
          style={{
            position: "absolute",
            bottom: "1.25rem",
            left: "1.25rem",
            right: "1.25rem",
            padding: "0.85rem 1rem",
            backgroundColor: "var(--color-cream)",
            border: "2px solid var(--color-navy)",
            textAlign: "center",
            transition: "background-color 0.2s ease",
          }}
          className="trend-bar"
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 900,
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
            }}
          >
            {item.title}
          </span>
        </div>
      </Link>

    </div>
  );
}
