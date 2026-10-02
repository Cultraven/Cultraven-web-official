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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const colors = (p.colors ?? []).filter((c) => c && c.hex && c.label);
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

        {!v.soldOut ? (
          <div className="sc-quick" role="group" aria-label={`Add ${p.title} to bag`}>
            <span className="sc-quick-label" aria-live="polite">{added ? "Added to bag ✓" : single ? "Add to bag" : "Add your size"}</span>
            <div className="sc-chips">
              {v.sizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  className="sc-chip"
                  disabled={s.soldOut}
                  data-added={added === s.size ? "true" : undefined}
                  aria-label={s.soldOut ? `Size ${s.size} sold out` : `Add size ${s.size} to bag`}
                  onClick={() => quickAdd(s.size)}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

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
        {v.sizeLabel ? (
          <span className="sc-sizes">{single ? v.sizeLabel : <><span>Size</span> {v.sizeLabel}</>}</span>
        ) : (
          <span className="sc-sizes sc-sizes-sold">Currently unavailable</span>
        )}
        {colors.length ? (
          <span className="sc-colors" aria-label={`Colours: ${colors.map((c) => c.label).join(", ")}`}>
            {colors.slice(0, 5).map((c) => <i key={c.hex + c.label} title={c.label} style={{ background: c.hex }} />)}
            {colors.length > 5 ? <em>+{colors.length - 5}</em> : null}
          </span>
        ) : null}
      </Link>
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
