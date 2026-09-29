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
import Image from "next/image";
import Link from "next/link";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=900&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=900&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&auto=format&fit=crop&q=85",
];

const COLORS = [
  { hex: "#0A0A0A", label: "Acid Black" },
  { hex: "#2C2C2C", label: "Charcoal" },
  { hex: "#C94227", label: "Flame" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SOLD_OUT_SIZES = ["XS"];

const ALSO_LIKE = [
  { id: "al1", title: "DHARMA GRAPHIC HOODIE", price: 299900, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80", href: "/products/dharma-graphic-hoodie-stone" },
  { id: "al2", title: "CARGO WIDE LEG", price: 349900, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80", href: "/products/cargo-wide-leg-military-olive" },
  { id: "al3", title: "CLASSIC TEE WHITE", price: 189900, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop&q=80", href: "/products/classic-oversized-tee-white" },
  { id: "al4", title: "ESSENTIALS HOODIE", price: 319900, image: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=400&auto=format&fit=crop&q=80", href: "/products/essentials-hoodie-jet-black" },
];

const ACCORDIONS = [
  { id: "description", title: "Description", body: "The RAVEN OVERSIZED TEE is built from 260 GSM pre-shrunk heavyweight cotton — a drop-shoulder silhouette designed to make the oversized feel intentional. Washed to a rich acid black finish, screen-printed with the signature CULTRAVEN mark." },
  { id: "fabric", title: "Fabric & Care", body: "100% Combed Ring-Spun Cotton, 260 GSM. Acid-wash finish. Cold machine wash (max 30°C), inside out. Do not tumble dry. Do not bleach. Iron on low heat, inside out." },
  { id: "fit", title: "Fit & Sizing", body: "OVERSIZED FIT — Drops 2–3 sizes below your regular size. If you usually wear M, size down to S for a regular oversized, or stay at M for an extreme drop-shoulder silhouette. Chest: 46\" (M). Length: 29\" (M). Shoulder: 22\" (M)." },
  { id: "shipping", title: "Shipping", body: "Free shipping on orders above ₹1,999. Standard: 4–6 business days. Express: 2–3 business days. COD available on select pincodes. We ship across India." },
  { id: "returns", title: "Returns & Exchanges", body: "Easy 7-day returns. Items must be unworn, unwashed with original tags. Initiate a return from your account dashboard. Exchange for a different size available within 15 days." },
];

export default function ProductDetailClient({ slug, productName }: { slug: string; productName: string }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          const found = data.products.find((p: any) => p.slug === slug);
          if (found) setProduct(found);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>("description");
  const [sizeError, setSizeError] = useState(false);

  const finalName = product?.title || productName;
  const pricePaise = product?.pricePaise || 199900;
  const mrpPaise = product?.mrpPaise || 249900;
  const disc = Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
  const rating = 4.8;
  const reviewCount = 124;

  const handleAddToBag = () => {
    if (!selectedSize) { setSizeError(true); setTimeout(() => setSizeError(false), 2000); return; }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDeliveryMsg(`Delivery available to ${pincode}. Estimated arrival: 3–5 business days.`);
    } else {
      setDeliveryMsg("Please enter a valid 6-digit pincode.");
    }
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)", paddingTop: "calc(80px + 1.5rem)", paddingBottom: "0.5rem" }}>
        <nav style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {[{ label: "Home", href: "/" }, { label: "Shop", href: "/collections/all" }, { label: finalName }].map((c, i, arr) => (
            <React.Fragment key={i}>
              {c.href ? <Link href={c.href} style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B7280", textDecoration: "none" }}>{c.label}</Link> : <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545" }}>{c.label}</span>}
              {i < arr.length - 1 && <span style={{ color: "#D9D3C4", fontSize: "10px" }}>/</span>}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Main PDP grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start", paddingInline: "clamp(1.25rem,4vw,5rem)", paddingBottom: "6rem" }} className="pdp-grid">
        {/* ── LEFT: Gallery ── */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
          {/* Thumbnails */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "80px", flexShrink: 0 }}>
            {[product?.image || GALLERY_IMAGES[0], product?.hoverImage || GALLERY_IMAGES[1]].filter(Boolean).map((src, i) => (
              <button key={i} onClick={() => setActiveImage(i)} style={{ position: "relative", width: "80px", height: "100px", overflow: "hidden", backgroundColor: "#EAE6DB", border: `2px solid ${activeImage === i ? "#172545" : "transparent"}`, cursor: "pointer", padding: 0 }}>
                <Image src={src} alt={`View ${i + 1}`} fill sizes="80px" style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>
          {/* Main image */}
          <div style={{ flex: 1, minWidth: 0, width: "100%", backgroundColor: "#EAE6DB", position: "relative" }}>
            <Image src={[product?.image || GALLERY_IMAGES[0], product?.hoverImage || GALLERY_IMAGES[1]][activeImage]} alt={finalName} width={900} height={1200} sizes="(max-width: 768px) 100vw, 50vw" style={{ width: "100%", height: "auto", display: "block", objectFit: "cover", transition: "opacity 0.3s ease" }} priority />
            {/* Discount badge */}
            <span style={{ position: "absolute", top: "16px", left: "16px", backgroundColor: "#C94227", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", padding: "5px 10px" }}>{disc}% OFF</span>
          </div>
        </div>

        {/* ── RIGHT: Product Info (sticky) ── */}
        <div style={{ position: "sticky", top: "100px", alignSelf: "start", paddingTop: "1rem" }}>
          {/* Brand */}
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.5rem" }}>CULTRAVEN</p>

          {/* Product name */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 600, color: "#172545", lineHeight: 1.1, marginBottom: "1rem" }}>{finalName}</h1>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "2px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < Math.floor(rating) ? "#C94227" : (i < rating ? "#C94227" : "none")} stroke="#C94227" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ))}
            </div>
            <Link href="#reviews" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", textDecoration: "underline" }}>{reviewCount} Reviews</Link>
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #D9D3C4" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#172545" }}>{fmt(pricePaise)}</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "1rem", color: "#6B7280", textDecoration: "line-through" }}>{fmt(mrpPaise)}</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.8rem", color: "#C94227" }}>{disc}% OFF</span>
          </div>

          {/* Color */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", marginBottom: "0.75rem" }}>
              COLOR: <span style={{ fontWeight: 500, color: "#6B7280" }}>{COLORS[selectedColor].label}</span>
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {COLORS.map((c, i) => (
                <button key={c.hex} onClick={() => setSelectedColor(i)} title={c.label} style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: c.hex, border: `3px solid ${selectedColor === i ? "#172545" : "transparent"}`, outline: `1.5px solid rgba(23,37,69,0.25)`, cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: sizeError ? "#C94227" : "#172545" }}>{sizeError ? "PLEASE SELECT A SIZE" : "SIZE"}</p>
              <Link href="/size-guide" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 600, color: "#6B7280", textDecoration: "underline" }}>Size Guide</Link>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SIZES.map((sz) => {
                const isOut = SOLD_OUT_SIZES.includes(sz);
                return (
                  <button key={sz} onClick={() => !isOut && setSelectedSize(sz)} disabled={isOut} style={{ width: "52px", height: "48px", border: `2px solid ${selectedSize === sz ? "#172545" : isOut ? "#D9D3C4" : "#D9D3C4"}`, backgroundColor: selectedSize === sz ? "#172545" : "transparent", color: selectedSize === sz ? "#F5F1E8" : isOut ? "#C4BBAA" : "#172545", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", cursor: isOut ? "not-allowed" : "pointer", position: "relative", textDecoration: isOut ? "line-through" : "none" }}>
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545" }}>QTY</p>
            <div style={{ display: "flex", alignItems: "center", border: "2px solid #D9D3C4" }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "40px", height: "40px", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#172545" }}>−</button>
              <span style={{ width: "40px", textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 700, color: "#172545" }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: "40px", height: "40px", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#172545" }}>+</button>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button onClick={handleAddToBag} style={{ width: "100%", padding: "1.1rem", backgroundColor: added ? "#C94227" : "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "background-color 0.2s" }}>
              {added ? "ADDED TO BAG ✓" : "ADD TO BAG"}
            </button>
            <button style={{ width: "100%", padding: "1.1rem", backgroundColor: "transparent", color: "#172545", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "2px solid #172545", cursor: "pointer" }}>
              BUY NOW
            </button>
            <button onClick={() => setWishlisted((w) => !w)} style={{ width: "100%", padding: "0.9rem", backgroundColor: "transparent", color: wishlisted ? "#C94227" : "#172545", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "#C94227" : "none"} stroke={wishlisted ? "#C94227" : "#172545"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {wishlisted ? "SAVED TO WISHLIST" : "ADD TO WISHLIST"}
            </button>
          </div>

          {/* Delivery checker */}
          <div style={{ backgroundColor: "#EAE6DB", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", marginBottom: "0.75rem" }}>DELIVERY</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setDeliveryMsg(null); }} placeholder="Enter Pincode" style={{ flex: 1, padding: "0.65rem 0.875rem", border: "1.5px solid #D9D3C4", backgroundColor: "#F5F1E8", fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#172545", outline: "none" }} />
              <button onClick={checkDelivery} style={{ padding: "0.65rem 1.25rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>CHECK</button>
            </div>
            {deliveryMsg && <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: pincode.length === 6 ? "#172545" : "#C94227", marginTop: "0.625rem" }}>{deliveryMsg}</p>}
          </div>

          {/* Trust strip */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {[{ icon: "🔒", label: "Secure Payment" }, { icon: "🔄", label: "Easy Returns" }, { icon: "🚚", label: "Free Delivery" }].map((t) => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.9rem" }}>{t.icon}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280" }}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Accordions */}
          <div style={{ borderTop: "1px solid #D9D3C4" }}>
            {ACCORDIONS.map((acc) => (
              <div key={acc.id} style={{ borderBottom: "1px solid #D9D3C4" }}>
                <button onClick={() => setOpenAccordion(openAccordion === acc.id ? null : acc.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "1rem 0", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545" }}>
                  {acc.title}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#172545" strokeWidth="2.5" style={{ transform: openAccordion === acc.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {openAccordion === acc.id && (
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", lineHeight: 1.75, color: "#4B5563", paddingBottom: "1rem" }}>{acc.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div id="reviews" style={{ backgroundColor: "#EAE6DB", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 600, color: "#172545", marginBottom: "0.5rem" }}>Customer Reviews</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "3rem", fontWeight: 600, color: "#172545" }}>{rating}</span>
          <div>
            <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
              {Array.from({ length: 5 }).map((_, i) => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.floor(rating) ? "#C94227" : "none"} stroke="#C94227" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>Based on {reviewCount} reviews</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" }} className="review-grid">
          {[{ author: "Aditya S.", text: "Absolutely fire. The 260 GSM weight feels incredible and the acid black colour is perfect. Sizing is true to the oversized description.", rating: 5, verified: true },
            { author: "Priya M.", text: "Finally a brand that gets the oversized tee right. The drop shoulder and the fabric feel premium. Would buy again.", rating: 5, verified: true },
            { author: "Rohan K.", text: "Great quality but runs a bit small for an oversized fit. Ordered L instead of M, fits perfectly now. Otherwise love it.", rating: 4, verified: true }].map((r, i) => (
            <div key={i} style={{ backgroundColor: "#F5F1E8", padding: "1.5rem" }}>
              <div style={{ display: "flex", gap: "3px", marginBottom: "0.75rem" }}>{Array.from({ length: 5 }).map((_, j) => <svg key={j} width="12" height="12" viewBox="0 0 24 24" fill={j < r.rating ? "#C94227" : "none"} stroke="#C94227" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem", lineHeight: 1.6, color: "#172545", marginBottom: "1rem" }}>"{r.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#172545" }}>{r.author}</span>
                {r.verified && <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B7280" }}>✓ Verified</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── You May Also Like ── */}
      <div style={{ backgroundColor: "#F5F1E8", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.75rem,3vw,2.5rem)", fontWeight: 600, color: "#172545", marginBottom: "2rem" }}>You May Also Like</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="also-like-grid">
          {ALSO_LIKE.map((p) => (
            <Link key={p.id} href={p.href} style={{ display: "block" }}>
              <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#EAE6DB", marginBottom: "0.75rem" }}>
                <Image src={p.image} alt={p.title} fill sizes="25vw" style={{ objectFit: "cover", transition: "transform 0.5s ease" }} className="also-like-img" />
              </div>
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#172545", marginBottom: "4px" }}>{p.title}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>{fmt(p.price)}</p>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .pdp-grid { @media (max-width: 768px) { grid-template-columns: 1fr !important; } }
        .review-grid { @media (max-width: 768px) { grid-template-columns: 1fr !important; } }
        .also-like-grid { @media (max-width: 768px) { grid-template-columns: repeat(2,1fr) !important; } }
        .also-like-img:hover { transform: scale(1.05) !important; }
        @media (max-width: 768px) { .pdp-grid { grid-template-columns: 1fr !important; } .review-grid { grid-template-columns: 1fr !important; } .also-like-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}
