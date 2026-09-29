/**
 * Footer — CULTRAVEN dark premium footer.
 *
 * Design reference: page4_img2.png (Yurachi dark footer)
 * Layout:
 *   Top trust strip: PREMIUM HEAVYWEIGHT COTTON | SECURE PAYMENTS | FAST SHIPPING | MADE FOR EVERYDAY WEAR
 *   4-column grid: Brand + tagline + socials | SHOP links | SUPPORT links | STAY UPDATED + newsletter + payment icons
 *   Bottom bar: © CULTRAVEN | MADE IN INDIA | PREMIUM STREETWEAR
 *
 * Admin-managed via CMS footer config (columns + social links).
 * Newsletter input wires to /api/newsletter.
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { FooterConfig } from "@shop/types";

interface FooterProps {
  config: FooterConfig;
}

// ── Social icon SVGs ───────────────────────────────────────────────────────────
const SOCIAL_ICONS: Record<string, React.ReactElement> = {
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon fill="currentColor" stroke="none" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  ),
  pinterest: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  twitter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  ),
};

// ── Default fallback data when CMS is unavailable ─────────────────────────────
const DEFAULT_SHOP_LINKS = [
  { label: "New Arrivals", href: "/collections/new-in" },
  { label: "Oversized Tees", href: "/collections/tees" },
  { label: "Hoodies", href: "/collections/hoodies" },
  { label: "Cargo & Bottoms", href: "/collections/bottoms" },
  { label: "Accessories", href: "/collections/accessories" },
  { label: "Sale", href: "/collections/sale" },
];

const DEFAULT_SUPPORT_LINKS = [
  { label: "Contact Us", href: "/pages/contact" },
  { label: "Track Order", href: "/pages/track-order" },
  { label: "Shipping Policy", href: "/pages/shipping" },
  { label: "Return Policy", href: "/pages/returns" },
  { label: "Terms & Conditions", href: "/pages/terms" },
  { label: "Privacy Policy", href: "/pages/privacy" },
  { label: "FAQ", href: "/pages/faq" },
];

const TRUST_STRIP = [
  "PREMIUM HEAVYWEIGHT COTTON",
  "SECURE PAYMENTS",
  "FAST SHIPPING",
  "MADE FOR EVERYDAY WEAR",
];

// ── Payment badge SVG/text labels ─────────────────────────────────────────────
const PAYMENT_BADGES = ["RAZORPAY", "VISA", "MASTERCARD", "UPI", "RUPAY"];

export function Footer({ config }: FooterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  // Resolve columns — prefer CMS, fallback to hardcoded
  const shopColumn = config.columns.find((c) =>
    c.heading.toLowerCase().includes("shop")
  );
  const supportColumn = config.columns.find((c) =>
    c.heading.toLowerCase().includes("support")
  );

  const shopLinks = shopColumn?.links ?? DEFAULT_SHOP_LINKS.map((l) => ({ ...l, openInNew: false }));
  const supportLinks = supportColumn?.links ?? DEFAULT_SUPPORT_LINKS.map((l) => ({ ...l, openInNew: false }));

  const socials = config.socialLinks.length > 0
    ? config.socialLinks
    : [
        { platform: "instagram" as const, href: "https://www.instagram.com/cultraven" },
        { platform: "youtube" as const, href: "https://www.youtube.com/cultraven" },
        { platform: "pinterest" as const, href: "https://www.pinterest.com/cultraven" },
      ];

  return (
    <footer aria-label="Site footer">
      {/* ── Trust strip ─────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#0A0A0A",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            padding: "1rem clamp(1.25rem,4vw,5rem)",
            gap: 0,
          }}
        >
          {TRUST_STRIP.map((item, i) => (
            <span key={item} style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "0.62rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(245,241,232,0.8)",
                  whiteSpace: "nowrap",
                  padding: "0 1.5rem",
                }}
              >
                {item}
              </span>
              {i < TRUST_STRIP.length - 1 && (
                <span style={{ color: "rgba(245,241,232,0.2)", fontSize: "0.6rem" }}>|</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main footer body ─────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#172545",
          padding: "clamp(4rem,8vw,6rem) clamp(1.25rem,4vw,5rem) 0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1.4fr",
            gap: "3rem",
          }}
          className="footer-grid"
        >
          {/* ── Column 1: Brand ── */}
          <div>
            {/* Logo */}
            <Link
              href="/"
              aria-label="CULTRAVEN home"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                textDecoration: "none",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "2px solid #F5F1E8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F5F1E8" strokeWidth="2.5">
                  <path d="M12 21V12M12 12L4 4M12 12L20 4" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "1rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#F5F1E8",
                }}
              >
                CULTRAVEN
              </span>
            </Link>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.82rem",
                lineHeight: 1.75,
                color: "rgba(245,241,232,0.6)",
                maxWidth: "240px",
                marginBottom: "2rem",
              }}
            >
              Premium oversized streetwear built for modern India. Heavyweight cotton. Bold identity. Not made to blend in.
            </p>

            {/* Social links */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {socials.map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`CULTRAVEN on ${s.platform}`}
                  style={{
                    color: "rgba(245,241,232,0.6)",
                    transition: "color 0.2s ease",
                    display: "flex",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color = "#F5F1E8")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(245,241,232,0.6)")
                  }
                >
                  {SOCIAL_ICONS[s.platform]}
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Shop ── */}
          <div>
            <h3
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.68rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(245,241,232,0.45)",
                marginBottom: "1.5rem",
              }}
            >
              Shop
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.openInNew ? "_blank" : undefined}
                    rel={link.openInNew ? "noopener noreferrer" : undefined}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "rgba(245,241,232,0.75)",
                      transition: "color 0.2s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = "#F5F1E8")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(245,241,232,0.75)")
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Support ── */}
          <div>
            <h3
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.68rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(245,241,232,0.45)",
                marginBottom: "1.5rem",
              }}
            >
              Support
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "rgba(245,241,232,0.75)",
                      transition: "color 0.2s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = "#F5F1E8")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(245,241,232,0.75)")
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Stay Updated ── */}
          <div>
            <h3
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.68rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(245,241,232,0.45)",
                marginBottom: "1.5rem",
              }}
            >
              Stay Updated
            </h3>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.82rem",
                lineHeight: 1.65,
                color: "rgba(245,241,232,0.65)",
                marginBottom: "1.25rem",
              }}
            >
              Be first to know about drops, restocks and limited releases.
            </p>

            {status === "success" ? (
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: "#C94227",
                  padding: "0.875rem",
                  border: "1.5px solid #C94227",
                }}
              >
                ✓ You&apos;re in. Welcome to the culture.
              </p>
            ) : (
              <form onSubmit={handleNewsletter} noValidate>
                <div style={{ display: "flex", gap: 0 }}>
                  <label htmlFor="footer-email" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                    Email address
                  </label>
                  <input
                    id="footer-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    disabled={status === "loading"}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      backgroundColor: "rgba(245,241,232,0.07)",
                      border: "1.5px solid rgba(245,241,232,0.2)",
                      borderRight: "none",
                      color: "#F5F1E8",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.82rem",
                      outline: "none",
                      minWidth: 0,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    style={{
                      padding: "0.75rem 1.25rem",
                      backgroundColor: "#C94227",
                      color: "#F5F1E8",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 800,
                      fontSize: "0.65rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      border: "none",
                      cursor: status === "loading" ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (status !== "loading")
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#a8361f";
                    }}
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C94227")
                    }
                  >
                    {status === "loading" ? "..." : "Subscribe"}
                  </button>
                </div>
                {status === "error" && (
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.72rem",
                      color: "#C94227",
                      marginTop: "0.5rem",
                    }}
                  >
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            )}

            {/* Payment badges */}
            <div style={{ marginTop: "1.75rem" }}>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(245,241,232,0.35)",
                  marginBottom: "0.75rem",
                }}
              >
                We accept
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {PAYMENT_BADGES.map((badge) => (
                  <span
                    key={badge}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid rgba(245,241,232,0.2)",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 800,
                      fontSize: "0.55rem",
                      letterSpacing: "0.1em",
                      color: "rgba(245,241,232,0.6)",
                      backgroundColor: "rgba(245,241,232,0.04)",
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: "4rem",
            borderTop: "1px solid rgba(245,241,232,0.08)",
            padding: "1.75rem 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,241,232,0.4)",
            }}
          >
            {config.copyrightText}
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,241,232,0.4)",
            }}
          >
            Made in India
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,241,232,0.4)",
            }}
          >
            Premium Streetwear
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
