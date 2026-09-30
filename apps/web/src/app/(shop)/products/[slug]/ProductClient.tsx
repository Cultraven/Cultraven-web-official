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
import { useCartStore } from "@/store/cart";
import { toast } from "@/components/common/Toast";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const GALLERY_IMAGES = [
  { type: "image", src: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&auto=format&fit=crop&q=85" },
  { type: "video", src: "https://assets.mixkit.co/videos/preview/mixkit-young-man-in-streetwear-standing-outdoors-42289-large.mp4" },
  { type: "image", src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=85" },
  { type: "image", src: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=900&auto=format&fit=crop&q=85" },
  { type: "image", src: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=900&auto=format&fit=crop&q=85" },
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
    if (!selectedSize) { 
      setSizeError(true); 
      setTimeout(() => setSizeError(false), 2000); 
      return; 
    }
    
    // Add to cart store
    useCartStore.getState().addItem({
      productId: product?.id || "fallback-id",
      slug: slug,
      title: finalName,
      image: product?.image || GALLERY_IMAGES[0],
      sku: `${slug}-${selectedSize}-${COLORS[selectedColor].label.toUpperCase().replace(/\s+/g, '-')}`,
      size: selectedSize,
      color: COLORS[selectedColor].label,
      pricePaise: pricePaise,
      mrpPaise: mrpPaise,
    }, qty);

    setAdded(true);
    toast.success("BAG MEIN GAYA ✓");
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
              {c.href ? <Link href={c.href} style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B7280", textDecoration: "none" }}>{c.label}</Link> : <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545" }}>{c.label}</span>}
              {i < arr.length - 1 && <span style={{ color: "#D9D3C4", fontSize: "10px" }}>/</span>}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Main PDP grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start", paddingInline: "clamp(1rem,4vw,5rem)", paddingBottom: "6rem" }} className="pdp-grid">
        {/* ── LEFT: Gallery ── */}
        <div className="gallery-container">
          {/* Thumbnails (Desktop) */}
          <div className="gallery-thumbs">
            {GALLERY_IMAGES.map((media, i) => (
              <button key={i} onClick={() => setActiveImage(i)} style={{ position: "relative", width: "80px", height: "100px", overflow: "hidden", backgroundColor: "#EAE6DB", border: `2px solid ${activeImage === i ? "#172545" : "transparent"}`, cursor: "pointer", padding: 0 }}>
                {media.type === "image" ? (
                  <Image src={media.src} alt={`View ${i + 1}`} fill sizes="80px" style={{ objectFit: "cover" }} />
                ) : (
                  <video src={media.src} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </button>
            ))}
          </div>
          {/* Main image (Swipeable on mobile) */}
          <div className="gallery-main" style={{ flex: 1, minWidth: 0, width: "100%", backgroundColor: "#EAE6DB", position: "relative", border: "var(--border-thick)", boxShadow: "var(--shadow-md)" }}>
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
            <span style={{ position: "absolute", top: "16px", left: "16px", backgroundColor: "#C94227", color: "#F5F1E8", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "5px 10px", border: "2px solid #172545", boxShadow: "2px 2px 0px 0px #172545", transform: "rotate(-3deg)" }}>{disc}% OFF</span>
          </div>
        </div>

        {/* ── RIGHT: Product Info (sticky) ── */}
        <div style={{ position: "sticky", top: "100px", alignSelf: "start", paddingTop: "1rem" }}>
          {/* Brand */}
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.5rem" }}>CULTRAVEN</p>

          {/* Product name */}
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,5vw,4.5rem)", fontWeight: 400, color: "#172545", lineHeight: 0.9, textTransform: "uppercase", marginBottom: "1rem", letterSpacing: "0.02em", textShadow: "2px 2px 0px rgba(23,37,69,0.2)" }}>{finalName}</h1>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "2px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < Math.floor(rating) ? "#C94227" : (i < rating ? "#C94227" : "none")} stroke="#C94227" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ))}
            </div>
            <Link href="#reviews" style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", textDecoration: "underline" }}>{reviewCount} Reviews</Link>
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.5rem", paddingBottom: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "2rem", color: "#172545" }}>{fmt(pricePaise)}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.2rem", color: "#6B7280", textDecoration: "line-through" }}>{fmt(mrpPaise)}</span>
          </div>
          <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "var(--border-thick)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {disc > 0 && (
              <span style={{ backgroundColor: "#172545", color: "#F5F1E8", padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                FINAL SALE - NO RETURNS
              </span>
            )}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6B7280" }}>Inclusive of all taxes</span>
          </div>

          {/* Color */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", marginBottom: "0.75rem" }}>
              COLOR: <span style={{ color: "#C94227" }}>{COLORS[selectedColor].label}</span>
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {COLORS.map((c, i) => (
                <button key={c.hex} onClick={() => setSelectedColor(i)} title={c.label} style={{ width: "36px", height: "36px", borderRadius: "0", backgroundColor: c.hex, border: `3px solid ${selectedColor === i ? "#172545" : "#D9D3C4"}`, cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: sizeError ? "#C94227" : "#172545" }}>{sizeError ? "SIZE KAHAN HAI BRO?" : "SIZE"}</p>
              <div style={{ textAlign: "right" }}>
                <Link href="/size-guide" style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, color: "#172545", textDecoration: "underline", display: "block", marginBottom: "2px" }}>SIZE GUIDE</Link>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "9px", fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>FIT NOTE: SIZE DOWN FOR REGULAR</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SIZES.map((sz) => {
                const isOut = SOLD_OUT_SIZES.includes(sz);
                return (
                  <button key={sz} onClick={() => !isOut && setSelectedSize(sz)} disabled={isOut} style={{ width: "52px", height: "48px", border: "2px solid #172545", backgroundColor: selectedSize === sz ? "#172545" : "transparent", color: selectedSize === sz ? "#F5F1E8" : isOut ? "#C4BBAA" : "#172545", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "14px", cursor: isOut ? "not-allowed" : "pointer", position: "relative", textDecoration: isOut ? "line-through" : "none", boxShadow: selectedSize === sz ? "0px 0px 0px" : "2px 2px 0px 0px #172545", opacity: isOut ? 0.5 : 1 }}>
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545" }}>QTY</p>
            <div style={{ display: "flex", alignItems: "center", border: "2px solid #172545", boxShadow: "2px 2px 0px 0px #172545", backgroundColor: "#F5F1E8" }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "40px", height: "40px", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#172545", fontWeight: 900 }}>−</button>
              <span style={{ width: "40px", textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 900, color: "#172545" }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: "40px", height: "40px", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#172545", fontWeight: 900 }}>+</button>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            <button className="btn-primary" onClick={handleAddToBag} style={{ width: "100%", padding: "16px", fontSize: "16px" }}>
              {added ? "BAG MEIN GAYA ✓" : "BAG IT"}
            </button>
            <button style={{ width: "100%", padding: "16px", backgroundColor: "#EAE6DB", color: "#172545", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "16px", textTransform: "uppercase", border: "2px solid #172545", cursor: "pointer", boxShadow: "4px 4px 0px 0px #172545", transition: "transform 0.1s ease, box-shadow 0.1s ease" }}>
              COP IT NOW
            </button>
            <button onClick={() => setWishlisted((w) => !w)} style={{ width: "100%", padding: "12px", backgroundColor: "transparent", color: wishlisted ? "#C94227" : "#172545", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "#C94227" : "none"} stroke={wishlisted ? "#C94227" : "#172545"} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {wishlisted ? "WISHLISTED ✓" : "WISHLIST KAR"}
            </button>
          </div>


          {/* Delivery checker */}
          <div style={{ backgroundColor: "#F5F1E8", padding: "1.25rem", marginBottom: "1.5rem", border: "2px solid #172545", boxShadow: "4px 4px 0px 0px #172545" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", marginBottom: "0.75rem" }}>DELIVERY</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setDeliveryMsg(null); }} placeholder="Enter Pincode" style={{ flex: 1, padding: "0.65rem 0.875rem", border: "2px solid #172545", backgroundColor: "#F5F1E8", fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 800, color: "#172545", outline: "none" }} />
              <button className="btn-primary" onClick={checkDelivery} style={{ padding: "0.65rem 1.25rem", fontSize: "12px" }}>CHECK</button>
            </div>
            {deliveryMsg && <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 800, color: pincode.length === 6 ? "#172545" : "#C94227", marginTop: "0.625rem", textTransform: "uppercase" }}>{deliveryMsg} (COD AVAILABLE)</p>}
          </div>

          {/* Trust strip */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {[{ icon: "🔒", label: "SECURE PAYMENT" }, { icon: "🔄", label: "EASY RETURNS" }, { icon: "🚚", label: "FREE DELIVERY" }].map((t) => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#172545" }}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Accordions */}
          <div style={{ borderTop: "var(--border-thick)" }}>
            {ACCORDIONS.map((acc) => (
              <div key={acc.id} style={{ borderBottom: "var(--border-thick)" }}>
                <button onClick={() => setOpenAccordion(openAccordion === acc.id ? null : acc.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "1rem 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "14px", textTransform: "uppercase", color: "#172545" }}>
                  {acc.title}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#172545" strokeWidth="2.5" style={{ transform: openAccordion === acc.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {openAccordion === acc.id && (
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", lineHeight: 1.5, color: "#172545", paddingBottom: "1rem", fontWeight: 600 }}>{acc.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shop the Look ── */}
      <div style={{ backgroundColor: "#172545", padding: "clamp(3rem,6vw,6rem) clamp(1rem,4vw,5rem)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(3rem,8vw,6.5rem)", fontWeight: 400, letterSpacing: "0.02em", color: "#F5F1E8", marginBottom: "3rem", textTransform: "uppercase", textShadow: "4px 4px 0px rgba(0,0,0,0.5)" }}>SHOP THE LOOK</h2>
        
        <div style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ position: "relative", aspectRatio: "3/4", border: "var(--border-thick)", boxShadow: "8px 8px 0px 0px #000" }}>
            <Image src={product?.image || GALLERY_IMAGES[0]} alt="Shop the look" fill sizes="100vw" style={{ objectFit: "cover" }} />
            
            {/* Hotspot 1 */}
            <Link href="/products/raven-oversized-tee-acid-black" style={{ position: "absolute", top: "35%", left: "45%", width: "24px", height: "24px", backgroundColor: "#C94227", borderRadius: "50%", border: "2px solid #F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", transform: "translate(-50%, -50%)", cursor: "pointer", zIndex: 10, animation: "pulse 2s infinite" }}>
              <span style={{ backgroundColor: "#F5F1E8", width: "8px", height: "8px", borderRadius: "50%" }}></span>
            </Link>
            
            {/* Hotspot 2 */}
            <Link href="/products/core-straight-jeans-indigo" style={{ position: "absolute", top: "65%", left: "55%", width: "24px", height: "24px", backgroundColor: "#C94227", borderRadius: "50%", border: "2px solid #F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", transform: "translate(-50%, -50%)", cursor: "pointer", zIndex: 10, animation: "pulse 2s infinite 1s" }}>
              <span style={{ backgroundColor: "#F5F1E8", width: "8px", height: "8px", borderRadius: "50%" }}></span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div id="reviews" style={{ backgroundColor: "#F5F1E8", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)", borderBottom: "var(--border-thick)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,5vw,4.5rem)", fontWeight: 400, letterSpacing: "0.02em", color: "#172545", marginBottom: "0.5rem", textTransform: "uppercase" }}>CUSTOMER REVIEWS</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "3rem", fontWeight: 900, color: "#172545" }}>{rating}</span>
          <div>
            <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
              {Array.from({ length: 5 }).map((_, i) => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.floor(rating) ? "#C94227" : "none"} stroke="#C94227" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700, color: "#172545", textTransform: "uppercase" }}>BASED ON {reviewCount} REVIEWS</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" }} className="review-grid">
          {[{ author: "Aditya S.", text: "Absolutely fire. The 260 GSM weight feels incredible and the acid black colour is perfect. Sizing is true to the oversized description.", rating: 5, verified: true, photo: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&auto=format&fit=crop&q=80" },
            { author: "Priya M.", text: "Finally a brand that gets the oversized tee right. The drop shoulder and the fabric feel premium. Would buy again.", rating: 5, verified: true, photo: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=200&auto=format&fit=crop&q=80" },
            { author: "Rohan K.", text: "Great quality but runs a bit small for an oversized fit. Ordered L instead of M, fits perfectly now. Otherwise love it.", rating: 4, verified: true, photo: null }].map((r, i) => (
            <div key={i} style={{ backgroundColor: "#F5F1E8", padding: "1.5rem", border: "2px solid #172545", boxShadow: "4px 4px 0px 0px #172545" }}>
              <div style={{ display: "flex", gap: "3px", marginBottom: "0.75rem" }}>{Array.from({ length: 5 }).map((_, j) => <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill={j < r.rating ? "#C94227" : "none"} stroke="#C94227" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", lineHeight: 1.5, color: "#172545", marginBottom: "1rem", fontWeight: 700 }}>"{r.text}"</p>
              
              {r.photo && (
                <div style={{ width: "80px", height: "80px", marginBottom: "1rem", border: "2px solid #172545", overflow: "hidden" }}>
                  <img src={r.photo} alt="Customer photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", color: "#172545", textTransform: "uppercase" }}>{r.author}</span>
                {r.verified && <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C94227" }}>✓ VERIFIED</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── You May Also Like ── */}
      <div style={{ backgroundColor: "#F5F1E8", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,5vw,4.5rem)", fontWeight: 400, letterSpacing: "0.02em", color: "#172545", marginBottom: "2rem", textTransform: "uppercase" }}>YOU MAY ALSO LIKE</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="also-like-grid">
          {ALSO_LIKE.map((p) => (
            <Link key={p.id} href={p.href} style={{ display: "block", border: "2px solid #172545", backgroundColor: "#F5F1E8", padding: "12px", boxShadow: "4px 4px 0px 0px #172545" }}>
              <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#EAE6DB", marginBottom: "0.75rem", border: "2px solid #172545" }}>
                <Image src={p.image} alt={p.title} fill sizes="25vw" style={{ objectFit: "cover", transition: "transform 0.5s ease" }} className="also-like-img" />
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#172545", marginBottom: "4px", lineHeight: 1.2 }}>{p.title}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px", color: "#172545" }}>{fmt(p.price)}</p>
            </Link>
          ))}
        </div>
      </div>
      
      {/* ── Sticky Mobile CTA ── */}
      <div className="mobile-sticky-cta">
        <button className="btn-primary" onClick={handleAddToBag} style={{ width: "100%", padding: "16px", fontSize: "14px" }}>
          {added ? "BAG MEIN GAYA ✓" : "BAG IT"}
        </button>
      </div>

      <style>{`
        .pdp-grid { @media (max-width: 768px) { grid-template-columns: 1fr !important; } }
        .review-grid { @media (max-width: 768px) { grid-template-columns: 1fr !important; } }
        .also-like-grid { @media (max-width: 768px) { grid-template-columns: repeat(2,1fr) !important; } }
        .also-like-img:hover { transform: scale(1.05) !important; }
        
        .gallery-container { display: flex; gap: 1rem; align-items: start; }
        .swipe-wrapper { width: 100%; height: 100%; }
        
        .mobile-sticky-cta {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background-color: #F5F1E8;
          border-top: var(--border-thick);
          z-index: 100;
          box-shadow: 0px -4px 0px rgba(23,37,69,0.1);
        }

        @media (max-width: 768px) { 
          .gallery-container { flex-direction: column; }
          .gallery-thumbs { display: none !important; }
          .swipe-wrapper {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .swipe-wrapper::-webkit-scrollbar { display: none; }
          .swipe-item {
            flex: 0 0 100%;
            scroll-snap-align: start;
            display: block !important;
          }
          .mobile-sticky-cta { display: block; }
        }
      `}</style>
    </div>
  );
}
