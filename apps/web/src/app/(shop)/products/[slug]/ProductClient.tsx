/**
 * Product Detail Page — /products/[slug]
 *
 * Premium PDP with:
 * - Large image gallery (main + 4 thumbnails, swap on click)
 * - Sticky product info panel (right side)
 * - Brand, name, price, MRP, discount, rating
 * - Color swatches with selection
 * - Size selector (XS/S/M/L/XL/XXL) with sold-out states
 * - Size guide link
 * - Quantity selector
 * - ADD TO BAG (primary) + BUY NOW + ADD TO WISHLIST
 * - Pincode delivery checker
 * - Accordion: Description, Fabric & Care, Fit & Sizing, Shipping, Returns
 * - YOU MAY ALSO LIKE carousel
 */
"use client";

import React, { useState } from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useBuyNowStore } from "@/store/buyNow";
import { ProductReviews } from "@/components/product/ProductReviews";
import "@/styles/pdp-cta.css";
import { effectiveSizes, priceForSize, priceRange, discountPercent, lineTotal, type PublicSizeOption } from "@/lib/size-pricing";
import { useWishlisted } from "@/store/wishlist";
import { toast } from "@/components/common/Toast";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export interface PdpProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  images: string[];
  pricePaise: number;
  mrpPaise: number;
  rating: number;
  reviewCount: number;
  colors: { hex: string; label: string }[];
  sizes: string[];
  fit?: string;
  inStock?: boolean;
  /** Per-size price overrides + sold-out / low-stock flags. */
  sizeOptions?: PublicSizeOption[];
}
export interface RelatedProduct { id: string; title: string; price: number; image: string; href: string }

// Site-wide policy copy (not product data).
const POLICY_ACCORDIONS = [
  { id: "shipping", title: "Shipping", body: "Free shipping on orders above ₹1,999. Standard: 4–6 business days. Express: 2–3 business days. COD available on select pincodes. We ship across India." },
  { id: "returns", title: "Returns & Exchanges", body: "Easy 7-day returns. Items must be unworn, unwashed with original tags. Initiate a return from your account dashboard. Exchange for a different size available within 15 days." },
];

const MAX_QTY = 10;

/** Product + related items are loaded from the database on the server (see page.tsx). */
export default function ProductDetailClient({ product, related }: { product: PdpProduct; related: RelatedProduct[] }) {
  const router = useRouter();
  const slug = product.slug;
  const GALLERY_IMAGES = product.images.map((src) => ({ type: "image" as const, src }));
  const COLORS = product.colors;
  const SIZES = effectiveSizes(product.sizes);
  const SIZE_OPTS = product.sizeOptions ?? [];
  const ALSO_LIKE = related;
  const ACCORDIONS = [
    ...(product.description ? [{ id: "description", title: "Description", body: product.description }] : []),
    ...POLICY_ACCORDIONS,
  ];

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(SIZES.length === 1 ? SIZES[0] : null);
  const [qty, setQty] = useState(1);
  const [wishlisted, toggleWishlist] = useWishlisted({ id: product.id, title: product.title, href: `/products/${product.slug}`, image: product.image, pricePaise: product.pricePaise, mrpPaise: product.mrpPaise });
  const setWishlisted = (_next?: (w: boolean) => boolean) => toggleWishlist();
  const [added, setAdded] = useState(false);
  const [wishPop, setWishPop] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);

  const soldOut = product.inStock === false;
  const [live, setLive] = useState<{ rating: number; count: number } | null>(null);
  const onSummary = React.useCallback((r: number, c: number) => setLive({ rating: r, count: c }), []);
  const finalName = product.title;
  const basePrice = { pricePaise: product.pricePaise, mrpPaise: product.mrpPaise };
  const unit = priceForSize(basePrice, SIZE_OPTS, selectedSize);   // the price of the chosen size (the base price until one is chosen)
  const range = priceRange(basePrice, SIZE_OPTS, SIZES);
  const showFrom = !selectedSize && range.varies;                    // sizes differ and none chosen yet -> "From ₹X"
  const pricePaise = unit.pricePaise;
  const mrpPaise = unit.mrpPaise;
  const displayPrice = showFrom ? range.min : pricePaise;
  const disc = discountPercent(displayPrice, mrpPaise);
  const total = lineTotal(pricePaise, qty);                          // updates live as the quantity changes
  const selectedOpt = SIZE_OPTS.find((o) => o.size === selectedSize);
  const rating = live ? live.rating : product.rating || 0;
  const reviewCount = live ? live.count : product.reviewCount || 0;

  // One timer for the "please select a size" message: a second tap restarts it instead of the first timer hiding it early.
  const sizeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (sizeTimer.current) clearTimeout(sizeTimer.current); }, []);
  const needSize = () => {
    setSizeError(true);
    if (sizeTimer.current) clearTimeout(sizeTimer.current);
    sizeTimer.current = setTimeout(() => setSizeError(false), 2500);
    document.getElementById("pdp-size")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleAddToBag = () => {
    if (soldOut) return;
    if (!selectedSize) { needSize(); return; }

    // Add to cart store
    useCartStore.getState().addItem({
      productId: product.id,
      slug: slug,
      title: finalName,
      image: product.image,
      sku: `${slug}-${selectedSize}-${(COLORS[selectedColor]?.label ?? 'default').toUpperCase().replace(/\s+/g, '-')}`,
      size: selectedSize,
      color: COLORS[selectedColor]?.label ?? "Default",
      pricePaise: pricePaise,
      mrpPaise: mrpPaise,
    }, qty);

    setAdded(true);
    toast.success("Added to bag ✓");
    setTimeout(() => setAdded(false), 2000);
  };

  /** COP IT NOW: one-item express checkout. The cart is left untouched. */
  const handleCopItNow = () => {
    if (soldOut) return;
    if (!selectedSize) { needSize(); return; }
    useBuyNowStore.getState().set({
      productId: product.id,
      slug,
      title: finalName,
      image: product.image,
      sku: `${slug}-${selectedSize}-${(COLORS[selectedColor]?.label ?? "default").toUpperCase().replace(/\s+/g, "-")}`,
      size: selectedSize,
      color: COLORS[selectedColor]?.label ?? "Default",
      pricePaise,
      mrpPaise,
      quantity: qty,
    });
    router.push("/checkout?mode=buy-now");
  };

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDeliveryMsg(`Delivery available to ${pincode}. Estimated arrival: 3–5 business days.`);
    } else {
      setDeliveryMsg("Please enter a valid 6-digit pincode.");
    }
  };

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* Back + Breadcrumb */}
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)", paddingTop: "2rem", paddingBottom: "0.5rem" }}>
        <nav aria-label="Breadcrumb" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {[{ label: "Home", href: "/" }, { label: "Shop", href: "/collections/all" }, { label: finalName }].map((c, i, arr) => (
            <React.Fragment key={i}>
              {c.href ? <Link href={c.href} style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)", textDecoration: "none" }}>{c.label}</Link> : <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-navy)" }}>{c.label}</span>}
              {i < arr.length - 1 && <span style={{ color: "var(--color-border)", fontSize: "10px" }}>/</span>}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Main PDP grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start", paddingInline: "clamp(1rem,4vw,5rem)", paddingBottom: "6rem" }} className="pdp-grid">
        {/* ── LEFT: Gallery ── */}
        <div className="gallery-container pdp-gallery-sticky">
          {/* Thumbnails (Desktop) */}
          <div className="gallery-thumbs">
            {GALLERY_IMAGES.map((media, i) => (
              <button key={i} onClick={() => setActiveImage(i)} style={{ position: "relative", width: "80px", height: "100px", overflow: "hidden", backgroundColor: "var(--color-mist)", border: `2px solid ${activeImage === i ? "var(--color-navy)" : "transparent"}`, cursor: "pointer", padding: 0 }}>
                {media.type === "image" ? (
                  <Image src={media.src} alt={`View ${i + 1}`} fill sizes="80px" style={{ objectFit: "cover" }} />
                ) : (
                  <video src={media.src} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </button>
            ))}
          </div>
          {/* Main image (Swipeable on mobile) */}
          <div className="gallery-main" style={{ flex: 1, minWidth: 0, width: "100%", backgroundColor: "var(--color-mist)", position: "relative", border: "var(--border-thick)", boxShadow: "var(--shadow-md)" }}>
            <div className="swipe-wrapper">
              {GALLERY_IMAGES.map((media, i) => (
                <div key={i} className="swipe-item" style={{ display: i === activeImage ? "block" : "none", height: "100%" }}>
                  {media.type === "image" ? (
                    <Image src={media.src} alt={finalName} width={900} height={1200} sizes="(max-width: 768px) 100vw, 50vw" style={{ width: "100%", height: "auto", display: "block", objectFit: "cover", transition: "opacity 0.3s ease" }} priority={i === 0} />
                  ) : (
                    <video src={media.src} autoPlay={i === activeImage} loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                </div>
              ))}
            </div>
            {/* Discount badge */}
            {disc > 0 && <span style={{ position: "absolute", top: "16px", left: "16px", backgroundColor: "var(--color-crimson)", color: "var(--color-cream)", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "5px 10px", border: "2px solid var(--color-navy)", boxShadow: "2px 2px 0px 0px var(--color-navy)", transform: "rotate(-3deg)" }}>{disc}% OFF</span>}
          </div>
        </div>

        {/* ── RIGHT: Product Info (sticky) ── */}
        <div style={{ alignSelf: "start", paddingTop: "1rem", minWidth: 0 }}>
          {/* Brand */}
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.5rem" }}>CULTRAVEN</p>

          {/* Product name */}
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,5vw,4.5rem)", fontWeight: 400, color: "var(--color-navy)", lineHeight: 0.9, textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "0.02em", textShadow: "2px 2px 0px rgba(23,37,69,0.2)" }}>{finalName}</h1>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "2px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < Math.floor(rating) ? "var(--color-crimson)" : (i < rating ? "var(--color-crimson)" : "none")} stroke="var(--color-crimson)" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ))}
            </div>
            <Link href="#reviews" style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray)", textDecoration: "underline", padding: "12px 0" }}>{reviewCount} Reviews</Link>
          </div>

          {/* Price: follows the chosen size, and the total follows the quantity */}
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem 0.75rem", marginBottom: "0.5rem", paddingBottom: "0.5rem" }} aria-live="polite">
            {showFrom ? <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.14em", color: "var(--color-smoke)" }}>FROM</span> : null}
            <span key={displayPrice} data-testid="pdp-price" className="pdp-price-val" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "2rem", color: "var(--color-navy)" }}>{fmt(displayPrice)}</span>
            {mrpPaise > displayPrice ? <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.2rem", color: "var(--color-gray)", textDecoration: "line-through" }}>{fmt(mrpPaise)}</span> : null}
            {disc > 0 ? <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.08em", background: "var(--color-lava)", color: "var(--color-navy)", padding: "3px 7px", border: "2px solid var(--color-navy)" }}>{disc}% OFF</span> : null}
          </div>
          <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "var(--border-thick)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-gray)" }}>
              Inclusive of all taxes
              {selectedSize ? <> · <span style={{ color: "var(--color-navy)", fontWeight: 700 }}>{fmt(pricePaise)}</span> for size <b>{selectedSize}</b></> : null}
            </span>
          </div>

          {/* Color */}
          {COLORS.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.75rem" }}>
              COLOR: <span style={{ color: "var(--color-crimson)" }}>{COLORS[selectedColor]?.label}</span>
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {COLORS.map((c, i) => (
                <button key={i} onClick={() => setSelectedColor(i)} title={c.label} aria-label={`Colour ${c.label}`} aria-pressed={selectedColor === i} style={{ width: "40px", height: "40px", borderRadius: "0", backgroundColor: c.hex, border: `3px solid ${selectedColor === i ? "var(--color-navy)" : "var(--color-border)"}`, cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          </div>
          )}

          {/* Size selector */}
          <div id="pdp-size" style={{ marginBottom: "1.5rem", scrollMarginTop: "120px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: sizeError ? "var(--color-crimson)" : "var(--color-navy)" }}>{sizeError ? "PLEASE SELECT A SIZE" : "SIZE"}</p>
              <div style={{ textAlign: "right" }}>
                <Link href="/size-guide" style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, color: "var(--color-navy)", textDecoration: "underline", display: "block", padding: "14px 0" }}>SIZE GUIDE</Link>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "9px", fontWeight: 800, color: "var(--color-gray)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{product.fit ? `FIT: ${product.fit}` : ""}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SIZES.map((sz) => {
                const o = SIZE_OPTS.find((x) => x.size === sz);
                const isOut = !!o?.soldOut || soldOut;
                const sel = selectedSize === sz;
                const szPrice = priceForSize(basePrice, SIZE_OPTS, sz).pricePaise;
                const wide = sz.length > 3;
                return (
                  <button key={sz} type="button" onClick={() => !isOut && setSelectedSize(sz)} disabled={isOut} aria-pressed={sel} title={isOut ? `${sz} is sold out` : o?.low ? `Only a few left in ${sz}` : undefined}
                    style={{ minWidth: wide ? "auto" : "52px", padding: wide ? "0 16px" : 0, height: range.varies ? "58px" : "48px", border: "2px solid var(--color-navy)", backgroundColor: sel ? "var(--color-navy)" : "transparent", color: sel ? "var(--color-cream)" : isOut ? "#9aa0ad" : "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "14px", cursor: isOut ? "not-allowed" : "pointer", position: "relative", textDecoration: isOut ? "line-through" : "none", boxShadow: sel ? "0 0 0 0" : "2px 2px 0 0 var(--color-navy)", opacity: isOut ? 0.55 : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", transition: "transform 0.1s ease, box-shadow 0.1s ease, background-color 0.15s ease" }}>
                    <span>{wide ? sz.toUpperCase() : sz}</span>
                    {range.varies ? <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.03em", opacity: 0.85 }}>{fmt(szPrice)}</span> : null}
                  </button>
                );
              })}
            </div>
            {selectedOpt?.low ? <p role="status" style={{ marginTop: "0.6rem", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "12px", color: "var(--color-crimson)" }}>Only a few left in size {selectedSize}</p> : null}
          </div>

          {/* Quantity — the total beside it updates live */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)" }}>QTY</p>
            <div style={{ display: "flex", alignItems: "center", border: "2px solid var(--color-navy)", boxShadow: "2px 2px 0px 0px var(--color-navy)", backgroundColor: "var(--color-cream)" }}>
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "44px", height: "44px", background: "none", border: "none", cursor: qty <= 1 ? "not-allowed" : "pointer", fontSize: "1.2rem", color: "var(--color-navy)", fontWeight: 900, opacity: qty <= 1 ? 0.35 : 1 }}>−</button>
              <span aria-live="polite" style={{ width: "40px", textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 900, color: "var(--color-navy)" }}>{qty}</span>
              <button type="button" aria-label="Increase quantity" disabled={qty >= MAX_QTY} onClick={() => setQty(Math.min(MAX_QTY, qty + 1))} style={{ width: "44px", height: "44px", background: "none", border: "none", cursor: qty >= MAX_QTY ? "not-allowed" : "pointer", fontSize: "1.2rem", color: "var(--color-navy)", fontWeight: 900, opacity: qty >= MAX_QTY ? 0.35 : 1 }}>+</button>
            </div>
            <div data-testid="pdp-total" style={{ marginLeft: "auto", textAlign: "right", fontFamily: "var(--font-sans)", fontWeight: 900, color: "var(--color-navy)" }} aria-live="polite">
              <span style={{ fontSize: "10px", letterSpacing: "0.14em", color: "var(--color-smoke)" }}>{qty > 1 ? `TOTAL FOR ${qty}` : "TOTAL"}</span>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem" }}>{fmt(showFrom ? lineTotal(range.min, qty) : total)}</div>
            </div>
          </div>

          {/* CTAs — class-based so they respond to hover / press / touch and reflow per screen size (styles/pdp-cta.css) */}
          {soldOut ? <p role="status" className="pdp-sold">SOLD OUT — this piece is currently unavailable</p> : null}
          <div className="pdp-cta">
            <button type="button" className={`pdp-btn pdp-bag${added ? " is-done" : ""}`} onClick={handleAddToBag} disabled={soldOut}>
              {soldOut ? "SOLD OUT" : added ? "BAG MEIN GAYA ✓" : "BAG IT"}
            </button>
            <button type="button" className="pdp-btn pdp-cop" onClick={handleCopItNow} disabled={soldOut}>
              COP IT NOW
            </button>
            <button type="button" className={`pdp-wish${wishPop ? " pop" : ""}`} aria-pressed={wishlisted} onClick={() => { setWishlisted((w) => !w); setWishPop(true); setTimeout(() => setWishPop(false), 400); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? "var(--color-crimson)" : "none"} stroke={wishlisted ? "var(--color-crimson)" : "currentColor"} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {wishlisted ? "WISHLISTED ✓" : "WISHLIST KAR"}
            </button>
          </div>

          {/* Delivery checker */}
          <div style={{ backgroundColor: "var(--color-cream)", padding: "1.25rem", marginBottom: "1.5rem", border: "2px solid var(--color-navy)", boxShadow: "4px 4px 0px 0px var(--color-navy)" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.75rem" }}>DELIVERY</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input aria-label="Delivery pincode" inputMode="numeric" autoComplete="postal-code" onKeyDown={(e) => { if (e.key === "Enter") checkDelivery(); }} value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setDeliveryMsg(null); }} placeholder="Enter Pincode" style={{ flex: 1, padding: "0.65rem 0.875rem", border: "2px solid var(--color-navy)", backgroundColor: "var(--color-cream)", fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 800, color: "var(--color-navy)", outline: "none" }} />
              <button className="btn-primary" onClick={checkDelivery} style={{ padding: "0.65rem 1.25rem", fontSize: "12px" }}>CHECK</button>
            </div>
            {deliveryMsg && <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 800, color: pincode.length === 6 ? "var(--color-navy)" : "var(--color-crimson)", marginTop: "0.625rem", textTransform: "uppercase" }}>{deliveryMsg} (COD AVAILABLE)</p>}
          </div>

          {/* Trust strip */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {[{ icon: "🔒", label: "SECURE PAYMENT" }, { icon: "🔄", label: "EASY RETURNS" }, { icon: "🚚", label: "FREE DELIVERY" }].map((t) => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-navy)" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product details: full-width cards (description / shipping / returns), so the page never has an empty left side ── */}
      <section className="pdp-details" aria-label="Product details">
        {ACCORDIONS.map((acc) => (
          <article key={acc.id} className="pdp-detail">
            <h2>{acc.title}</h2>
            <p>{acc.body}</p>
          </article>
        ))}
      </section>

      {/* ── Shop the Look ── */}
      {ALSO_LIKE.length > 0 && (
      <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(3rem,6vw,6rem) clamp(1rem,4vw,5rem)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(3rem,8vw,6.5rem)", fontWeight: 400, letterSpacing: "0.02em", color: "var(--color-cream)", marginBottom: "3rem", textTransform: "uppercase", textShadow: "4px 4px 0px rgba(0,0,0,0.5)" }}>SHOP THE LOOK</h2>
        
        <div style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ position: "relative", aspectRatio: "3/4", border: "var(--border-thick)", boxShadow: "8px 8px 0px 0px #000" }}>
            <Image src={product.image} alt="Shop the look" fill sizes="100vw" style={{ objectFit: "cover" }} />
            
            {/* Hotspots link to real related products from the database */}
            {ALSO_LIKE.slice(0, 2).map((p, i) => (
              <Link key={p.id} href={p.href} aria-label={`Shop ${p.title}`} style={{ position: "absolute", top: i === 0 ? "35%" : "65%", left: i === 0 ? "45%" : "55%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", transform: "translate(-50%, -50%)", zIndex: 10 }}>
                <span style={{ width: "24px", height: "24px", backgroundColor: "var(--color-crimson)", borderRadius: "50%", border: "2px solid var(--color-cream)", display: "flex", alignItems: "center", justifyContent: "center", animation: `pulse 2s infinite ${i}s` }}>
                  <span style={{ backgroundColor: "var(--color-cream)", width: "8px", height: "8px", borderRadius: "50%" }}></span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ── Reviews: verified-buyer feedback from the database ── */}
      <ProductReviews slug={slug} onSummary={onSummary} />

      {/* ── You May Also Like ── */}
      <div style={{ backgroundColor: "var(--color-cream)", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,5vw,4.5rem)", fontWeight: 400, letterSpacing: "0.02em", color: "var(--color-navy)", marginBottom: "2rem", textTransform: "uppercase" }}>YOU MAY ALSO LIKE</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="also-like-grid">
          {ALSO_LIKE.map((p) => (
            <Link key={p.id} href={p.href} style={{ display: "block", border: "2px solid var(--color-navy)", backgroundColor: "var(--color-cream)", padding: "12px", boxShadow: "4px 4px 0px 0px var(--color-navy)" }}>
              <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-mist)", marginBottom: "0.75rem", border: "2px solid var(--color-navy)" }}>
                <Image src={p.image} alt={p.title} fill sizes="25vw" style={{ objectFit: "cover", transition: "transform 0.5s ease" }} className="also-like-img" />
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "4px", lineHeight: 1.2 }}>{p.title}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px", color: "var(--color-navy)" }}>{fmt(p.price)}</p>
            </Link>
          ))}
        </div>
      </div>
      
      {/* ── Sticky Mobile CTA ── */}
      <div className="mobile-sticky-cta">
        <div className={`pdp-sticky${soldOut ? " single" : ""}`}>
          <button type="button" className={`pdp-btn pdp-bag${added ? " is-done" : ""}`} onClick={handleAddToBag} disabled={soldOut}>
            {soldOut ? "SOLD OUT" : added ? "ADDED ✓" : "BAG IT"}
          </button>
          {!soldOut ? <button type="button" className="pdp-btn pdp-cop" onClick={handleCopItNow}>COP IT NOW</button> : null}
        </div>
      </div>

    </div>
  );
}
