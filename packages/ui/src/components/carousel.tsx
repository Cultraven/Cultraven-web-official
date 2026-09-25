/**
 * Carousel — horizontally-scrollable rail with:
 *  - Mouse drag / touch drag
 *  - Keyboard arrow navigation (left / right)
 *  - Previous / Next chevron buttons (hidden when at edge)
 *  - CSS scroll-snap for clean per-card stop
 *
 * Consumed by ProductCarousel and ReviewCarousel.
 *
 * Usage:
 *   <Carousel itemMinWidth={280} gap={16} ariaLabel="New Arrivals">
 *     {items.map(item => <ProductCard key={item.id} {...item} />)}
 *   </Carousel>
 */

"use client";

import React, {
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";

export interface CarouselProps {
  children: ReactNode;
  /** Min width of each item in px — used to set scroll amount per arrow click */
  itemMinWidth?: number;
  /** Gap between items in px */
  gap?: number;
  ariaLabel?: string;
  className?: string;
  showArrows?: boolean;
}

export function Carousel({
  children,
  itemMinWidth = 280,
  gap = 16,
  ariaLabel,
  className = "",
  showArrows = true,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ─── Drag state ────────────────────────────────────────────────────────────
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = useCallback(
    (dir: "left" | "right") => {
      const el = trackRef.current;
      if (!el) return;
      const amount = itemMinWidth + gap;
      el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    },
    [itemMinWidth, gap]
  );

  // ─── Mouse drag handlers ───────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (trackRef.current?.offsetLeft ?? 0);
    scrollLeft.current = trackRef.current?.scrollLeft ?? 0;
    if (trackRef.current) trackRef.current.style.cursor = "grabbing";
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - (trackRef.current.offsetLeft ?? 0);
    const walk = (x - startX.current) * 1.5;
    trackRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // ─── Keyboard navigation ───────────────────────────────────────────────────
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); scroll("left"); }
    if (e.key === "ArrowRight") { e.preventDefault(); scroll("right"); }
  };

  return (
    <div className={`relative ${className}`}>
      {/* ── Left arrow ───────────────────────────────────────────────────── */}
      {showArrows && (
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          className={[
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1/2",
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-[var(--color-charcoal)] text-[var(--color-cream)] shadow-[var(--shadow-md)]",
            "transition-all duration-200 hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]",
            "disabled:opacity-0 disabled:pointer-events-none",
          ].join(" ")}
        >
          <ChevronLeft />
        </button>
      )}

      {/* ── Scroll track ─────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onScroll={updateScrollButtons}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        style={{ gap: `${gap}px`, cursor: "grab" }}
        className={[
          "flex overflow-x-auto overscroll-x-contain",
          "scroll-smooth snap-x snap-mandatory",
          // hide scrollbar cross-browser
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          "select-none outline-none",
        ].join(" ")}
      >
        {children}
      </div>

      {/* ── Right arrow ──────────────────────────────────────────────────── */}
      {showArrows && (
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          className={[
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-1/2",
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-[var(--color-charcoal)] text-[var(--color-cream)] shadow-[var(--shadow-md)]",
            "transition-all duration-200 hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)]",
            "disabled:opacity-0 disabled:pointer-events-none",
          ].join(" ")}
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}

// ─── Inline SVG chevrons (no extra dependency) ────────────────────────────────

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
