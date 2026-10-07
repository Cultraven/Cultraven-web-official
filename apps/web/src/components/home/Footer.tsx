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

import { BrandLogo } from "@/components/common/BrandLogo";
import React, { useState } from "react";
import Link from "next/link";
import type { FooterConfig } from "@shop/types";
import { whatsappLink } from "@/lib/support";

interface FooterProps {
  config: FooterConfig;
}

// ── Social icon SVGs ───────────────────────────────────────────────────────────
const SOCIAL_ICONS: Record<string, React.ReactElement> = {
  instagram: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="0" ry="0" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  youtube: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon fill="currentColor" stroke="none" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  ),
  pinterest: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
  facebook: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  twitter: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  ),
  whatsapp: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
};

const SOCIAL_BRAND_BG: Record<string, string> = {
  instagram: "linear-gradient(45deg, #F58529 0%, #DD2A7B 45%, #8134AF 75%, #515BD4 100%)",
  youtube: "#FF0000",
  pinterest: "#E60023",
  facebook: "#1877F2",
  twitter: "#000000",
  whatsapp: "#25D366",
};

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

  // Columns, headings and links come straight from the database (site.footer).
  const [shopColumn, supportColumn, brandColumn] = config.columns;
  const shopLinks = shopColumn?.links ?? [];
  const supportLinks = supportColumn?.links ?? [];
  const brandLinks = brandColumn?.links ?? [];
  const socials = (config.socialLinks ?? []) as { platform: string; href: string }[];

  return (
    <footer aria-label="Site footer" className="cv-auto">
      <div className="footer-divider" aria-hidden="true" />


      {/* ── Main footer body ─────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "var(--color-stone)",
          padding: "clamp(4rem,8vw,6rem) clamp(1.25rem,4vw,5rem) 0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr",
            gap: "3rem",
          }}
          className="footer-grid"
        >
          {/* ── Column 1: Brand Info & Address ── */}
          <div>
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
              <BrandLogo height={40} />
            </Link>

            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                fontWeight: 600,
                lineHeight: 1.5,
                color: "var(--color-raven)",
                maxWidth: "240px",
                marginBottom: "1.5rem",
              }}
            >
              Premium oversized streetwear built for modern India. Heavyweight cotton. Bold identity.
            </p>

            <div style={{ marginBottom: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--color-smoke)", lineHeight: 1.6, textTransform: "uppercase" }}>
              <p>CULTRAVEN CLOTHING PVT LTD</p>
              <p>PLOT 42, AB ROAD, VIJAY NAGAR</p>
              <p>INDORE, MADHYA PRADESH 452010</p>
              <p>GSTIN: 23AABCB1234D1Z5</p>
            </div>

            <a
              href={whatsappLink("Hi CULTRAVEN, I need help.")}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "11px 18px",
                backgroundColor: "#25D366",
                color: "#FFFFFF",
                border: "2px solid #1aab52",
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: "3px 3px 0px 0px var(--color-raven)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              className="footer-whatsapp-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Support
            </a>
          </div>

          {/* ── Column 2: Shop ── */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: "14px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-raven)",
                marginBottom: "1.5rem",
              }}
            >
              {shopColumn?.heading ?? ""}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 800,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      color: "var(--color-raven)",
                      textDecoration: "none",
                    }}
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
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: "14px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-raven)",
                marginBottom: "1.5rem",
              }}
            >
              {supportColumn?.heading ?? ""}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 800,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      color: "var(--color-raven)",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Brand & Payments ── */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: "14px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-raven)",
                marginBottom: "1.5rem",
              }}
            >
              {brandColumn?.heading ?? ""}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              {brandLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 800,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      color: "var(--color-raven)",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
              {socials.filter(s => s.platform !== "whatsapp").map((s) => (
                <a
                  key={s.platform}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`CULTRAVEN on ${s.platform}`}
                  className="social-btn"
                  style={{
                    color: "#FFFFFF",
                    background: SOCIAL_BRAND_BG[s.platform] ?? "var(--color-raven)",
                    border: "2px solid var(--color-raven)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    height: "44px",
                    boxShadow: "3px 3px 0px 0px var(--color-lava)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  {SOCIAL_ICONS[s.platform]}
                </a>
              ))}
            </div>

            {/* Payment badges */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 900,
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-smoke)",
                  marginBottom: "0.75rem",
                }}
              >
                WE ACCEPT
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {PAYMENT_BADGES.map((badge) => (
                  <span
                    key={badge}
                    style={{
                      padding: "5px 10px",
                      border: "2px solid var(--color-raven)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 800,
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      color: "var(--color-raven)",
                      backgroundColor: "white",
                      boxShadow: "2px 2px 0px 0px var(--color-navy)",
                      display: "inline-flex",
                      alignItems: "center",
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
          className="footer-bottom"
          style={{
            marginTop: "4rem",
            borderTop: "2px solid var(--color-raven)",
            padding: "1.75rem 9.5rem 1.75rem 0", // right gap keeps the last item clear of the floating chat button
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "12px",
              textTransform: "uppercase",
              color: "var(--color-raven)",
            }}
          >
            {config.copyrightText}
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "12px",
              textTransform: "uppercase",
              color: "var(--color-raven)",
            }}
          >
            MADE IN INDIA
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "12px",
              textTransform: "uppercase",
              color: "var(--color-raven)",
            }}
          >
            PREMIUM STREETWEAR
          </p>
        </div>
      </div>

    </footer>
  );
}
