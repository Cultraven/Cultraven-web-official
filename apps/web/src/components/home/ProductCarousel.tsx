import React from "react";
import { Carousel } from "@shop/ui";
import type { Product, ProductRailConfig } from "@shop/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import Link from "next/link";

interface ProductCarouselProps {
  config: ProductRailConfig;
  products: Product[];
  loading?: boolean;
}

const CARD_WIDTH = 300;
const CARD_GAP = 20;

export function ProductCarousel({ config, products, loading = false }: ProductCarouselProps) {
  const skeletonCount = config.limit ?? 4;

  return (
    <section style={{ backgroundColor: "var(--color-cream)", padding: "clamp(4rem,8vw,8rem) 0" }}>
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2.5rem",
            borderBottom: "2px solid var(--color-navy)",
            paddingBottom: "1rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                
                fontSize: "clamp(2rem,4.5vw,3.75rem)",
                fontWeight: 600,
                color: "var(--color-navy)",
                lineHeight: 1,
              }}
            >
              {config.title}
            </h2>
            {config.subtitle && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  color: "var(--color-gray)",
                  marginTop: "0.4rem",
                }}
              >
                {config.subtitle}
              </p>
            )}
          </div>

          <Link
            href={config.viewAllHref}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
              borderBottom: "2px solid var(--color-navy)",
              paddingBottom: "2px",
              whiteSpace: "nowrap",
            }}
          >
            VIEW ALL
          </Link>
        </div>

        {/* Carousel */}
        <Carousel
          itemMinWidth={CARD_WIDTH}
          gap={CARD_GAP}
          ariaLabel={config.title}
          showArrows
        >
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <ProductCardSkeleton key={i} cardWidth={CARD_WIDTH} />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} cardWidth={CARD_WIDTH} />
              ))}
        </Carousel>
      </div>
    </section>
  );
}
