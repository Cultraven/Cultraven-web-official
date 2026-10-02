"use client";
/**
 * ShopCard — the one product card used by every listing (collections, category, search, home sections).
 *
 * Photo (second photo + size picker on hover), wishlist heart, one tag; then brand, title, price + MRP + "% off",
 * "Only few left" and the sizes in stock. On a mouse, hovering the card slides up the size chips: pick one and it goes
 * straight into the bag at that size's price. On touch the sizes are listed under the price and a tap opens the product.
 */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "@/components/common/CmsImage";
import { formatPriceINR } from "@shop/types";
import { useCartStore } from "@/store/cart";
import { useWishlisted } from "@/store/wishlist";
import { cardView, isFreeSizeOnly, slugFromHref, type CardProduct } from "@/lib/card-info";
import "@/styles/shop-card.css";

const SIZES_ATTR = "(max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw";

export function ShopCard({ product: p, priority = false }: { product: CardProduct; priority?: boolean }) {
  const v = cardView(p);
  const slug = slugFromHref(p.href);
  const addItem = useCartStore((s) => s.addItem);
  const [wishlisted, toggleWishlist] = useWishlisted({ id: p.id, title: p.title, href: p.href, image: p.image, pricePaise: v.pricePaise, mrpPaise: v.mrpPaise });
  const [added, setAdded] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ hex: string; label: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const colors = (p.colors ?? []).filter((c) => c && c.hex && c.label);
  const activeColor = selectedColor ?? colors[0] ?? null;
  const hover = p.hoverImage && p.hoverImage !== p.image ? p.hoverImage : "";
  const single = isFreeSizeOnly(v.sizes);

  const quickAdd = (size: string) => {
    const s = v.sizes.find((x) => x.size === size);
    if (!s || s.soldOut) return;
    const color = colors[0]?.label ?? "Default";
    addItem({
      productId: p.id,
      slug,
      title: p.title,
      image: p.image,
      sku: `${slug}-${size}-${color.toUpperCase().replace(/\s+/g, "-")}`,
      size,
      color,
      pricePaise: s.pricePaise,
      mrpPaise: s.mrpPaise,
    });
    setAdded(size);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(null), 1600);
  };

  const rating = p.rating && p.reviewCount ? p.rating : 0;

  return (
    <article className="sc" data-testid="shop-card" data-sold-out={v.soldOut ? "true" : undefined}>
      {/* ── Photo ── */}
      <div className="sc-media">
        <Link href={p.href} className="sc-photo" aria-label={p.title} tabIndex={-1}>
          <Image src={p.image} alt={p.title} fill sizes={SIZES_ATTR} priority={priority} className="sc-img sc-img-1" />
          {hover ? <Image src={hover} alt="" aria-hidden="true" fill sizes={SIZES_ATTR} className="sc-img sc-img-2" /> : null}
        </Link>
        {v.badge ? <span className="sc-badge" data-kind={v.soldOut ? "sold" : "tag"}>{v.badge}</span> : null}
        <button type="button" className="sc-heart" aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wishlisted} onClick={toggleWishlist}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* ── Text info ── */}
      <Link href={p.href} className="sc-info">
        <span className="sc-meta">
          <span className="sc-brand">CULTRAVEN</span>
          {rating ? <span className="sc-rating" aria-label={`Rated ${rating} out of 5`}>★ {rating.toFixed(1)} <i>({p.reviewCount})</i></span> : null}
        </span>
        <h3 className="sc-title">{p.title}</h3>
        <span className="sc-price">
          <b data-testid="sc-price">{formatPriceINR(v.pricePaise)}</b>
          {v.off > 0 ? (
            <>
              <s>{formatPriceINR(v.mrpPaise)}</s>
              <span className="sc-off" data-testid="sc-off">{v.off}% off</span>
            </>
          ) : null}
          {v.varies ? <em>onwards</em> : null}
        </span>
        {v.fewLeft ? <span className="sc-few">Only few left</span> : null}
      </Link>

      {/* ── Color swatches — clickable, always visible when admin sets colors ── */}
      {colors.length > 0 ? (
        <div className="sc-color-row" aria-label={`Colour options for ${p.title}`}>
          <span className="sc-color-label">
            Color: <strong>{activeColor?.label}</strong>
          </span>
          <div className="sc-color-swatches">
            {colors.slice(0, 6).map((c) => (
              <button
                key={c.hex + c.label}
                type="button"
                className="sc-color-swatch"
                title={c.label}
                style={{ background: c.hex }}
                data-selected={activeColor?.hex === c.hex && activeColor?.label === c.label ? "true" : undefined}
                aria-label={`Colour: ${c.label}`}
                aria-pressed={activeColor?.hex === c.hex && activeColor?.label === c.label}
                onClick={(e) => { e.preventDefault(); setSelectedColor(c); }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Quick-add panel — two options: size chips (bag it) + cop it now ── */}
      {!v.soldOut ? (
        <div className="sc-size-row" role="group" aria-label={`Quick add ${p.title}`}>
          {/* Row 1: size chips (each click = add to bag) */}
          <div className="sc-chips-row">
            {single ? (
              <button type="button" className="sc-chip sc-chip-full" aria-live="polite" onClick={() => quickAdd(v.sizes[0].size)} data-added={added ? "true" : undefined}>
                {added ? "Added to bag ✓" : "Add to bag"}
              </button>
            ) : (
              v.sizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  className="sc-chip"
                  disabled={s.soldOut}
                  data-added={added === s.size ? "true" : undefined}
                  aria-label={s.soldOut ? `Size ${s.size} sold out` : `Add size ${s.size} to bag`}
                  onClick={() => quickAdd(s.size)}
                >
                  <span className="sc-chip-sz">{s.size}</span>
                  {v.varies ? <span className="sc-chip-price">{formatPriceINR(s.pricePaise)}</span> : null}
                </button>
              ))
            )}
          </div>
          {/* Row 2: cop it now — goes straight to the product page */}
          <Link href={p.href} className="sc-cop-btn">COP IT NOW →</Link>
        </div>
      ) : (
        <div className="sc-size-row sc-size-row-sold">
          <span className="sc-sizes-sold">Currently unavailable</span>
        </div>
      )}
    </article>
  );
}

/** Loading placeholder with the same proportions, so the grid doesn't jump when the products arrive. */
export function ShopCardSkeleton() {
  return (
    <div className="sc sc-skel" aria-hidden="true">
      <div className="sc-media" />
      <div className="sc-info"><span className="sc-line" style={{ width: "35%" }} /><span className="sc-line" style={{ width: "85%" }} /><span className="sc-line" style={{ width: "50%" }} /></div>
    </div>
  );
}
