/**
 * ReviewCarousel — compact social-proof ticker.
 *
 * Renders 8-10 review cards in a horizontally-scrollable carousel:
 *   ★★★★★  Author Name
 *   "Review text snippet..."
 *   [Product thumb] Product name
 *
 * Keyboard: left/right arrows via Carousel primitive.
 * Accessibility: role="list", semantic article per review.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Carousel } from "@shop/ui";
import type { ReviewItem } from "@shop/types";

interface ReviewCarouselProps {
  reviews: ReviewItem[];
}

const CARD_WIDTH = 340;

export function ReviewCarousel({ reviews }: ReviewCarouselProps) {
  if (reviews.length === 0) return null;

  return (
    <section
      aria-labelledby="reviews-heading"
      className="section-pad bg-[var(--navy)]"
    >
      <div className="container-full px-4 md:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <p
            className="label-tag text-[var(--crimson)] mb-2 block"
          >
            Social Proof
          </p>
          <h2
            id="reviews-heading"
            className="heading-display"
            style={{
              fontSize: "clamp(2rem, 3.5vw, 3rem)",
              color: "var(--cream)",
            }}
          >
            What Our Patrons Say
          </h2>
          <div className="w-12 h-0.5 bg-[var(--crimson)] mx-auto mt-4" />
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            itemMinWidth={CARD_WIDTH}
            gap={24}
            ariaLabel="Customer reviews"
            showArrows
            className="-mx-4 px-4 md:-mx-8 md:px-8"
          >
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}

// ─── Single review card ───────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <article
      aria-label={`Review by ${review.authorName}`}
      className="snap-item flex-shrink-0 flex flex-col justify-between p-6 rounded-[var(--radius-md)] bg-[var(--navy-deep)] border border-[var(--navy-mid)] hover:border-[var(--crimson)] transition-colors duration-300"
      style={{ width: `${CARD_WIDTH}px`, minHeight: "220px" }}
    >
      {/* Stars + Author */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <StarRating rating={review.rating} />
          <p className="mt-2 text-[var(--text-base)] font-semibold text-[var(--cream)]">
            {review.authorName}
          </p>
          {review.verifiedPurchase && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--mist)] opacity-70 mt-1">
              ✓ Verified Patron
            </p>
          )}
        </div>
      </div>

      {/* Review body */}
      <p
        className="text-[var(--text-sm)] text-[var(--mist)] opacity-90 leading-relaxed line-clamp-4 flex-1 mb-6 font-serif italic"
      >
        &ldquo;{review.body}&rdquo;
      </p>

      {/* Product thumb + name */}
      <Link
        href={`/product/${review.productSlug}`}
        className="flex items-center gap-3 pt-4 border-t border-[var(--navy-mid)] group"
      >
        <div
          className="relative flex-shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--navy)]"
          style={{ width: 48, height: 48 }}
        >
          <Image
            src={review.productThumb}
            alt={review.productName}
            fill
            sizes="48px"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <p className="text-[var(--text-xs)] font-medium text-[var(--cream)] line-clamp-2 leading-snug group-hover:text-[var(--crimson)] transition-colors">
          {review.productName}
        </p>
      </Link>
    </article>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill={i < rating ? "var(--crimson)" : "none"}
          stroke={i < rating ? "var(--crimson)" : "var(--navy-mid)"}
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M7 1l1.55 3.14L12 4.58l-2.5 2.44.59 3.44L7 8.77 4.91 10.46l.59-3.44L3 4.58l3.45-.44L7 1z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}
