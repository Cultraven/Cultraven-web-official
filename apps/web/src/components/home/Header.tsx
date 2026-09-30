"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { NavMenu } from "@shop/types";
import { MegaMenu } from "./MegaMenu";
import { CartBadge } from "./CartBadge";

interface HeaderProps {
  navMenu: NavMenu;
  deliveryCity?: string;
  hasHero?: boolean; // kept for external callers — internally we derive from pathname
}

export function Header({ navMenu, deliveryCity: _deliveryCity = "Mumbai" }: HeaderProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  const [isScrolled, setIsScrolled] = useState(!isHomepage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHomepage) {
      setIsScrolled(true);
      return;
    }
    setIsScrolled(window.scrollY > 80);
    const onScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomepage]);

  const transparent = isHomepage && !isScrolled;

  // Derived style tokens
  const bg      = transparent ? "transparent" : "var(--color-cream)";
  const fg      = transparent ? "#FFFFFF"     : "var(--color-navy)";
  const border  = transparent ? "none"        : "1px solid var(--color-line)";
  const shadow  = !transparent && isScrolled  ? "var(--shadow-sm)" : "none";

  const iconStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background:   transparent ? "rgba(255,255,255,0.12)" : "transparent",
    border:       transparent ? "1.5px solid rgba(255,255,255,0.55)" : "none",
    color:        fg,
    cursor: "pointer",
    width: "36px",
    height: "36px",
    textDecoration: "none",
    boxShadow: "none",
    borderRadius: "0px",
    transition: "all 0.2s ease",
    flexShrink: 0,
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 70,
          height: "80px",
          overflow: "visible",
          backgroundColor: bg,
          color: fg,
          borderBottom: border,
          boxShadow: shadow,
          padding: "0",
          transition: "background-color 0.4s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: "clamp(1rem,4vw,5rem)",
          }}
        >
          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            style={{ background: "none", border: "none", color: fg, cursor: "pointer", padding: "4px", transition: "color 0.3s ease" }}
            className="show-mobile"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <Image
              src="/logo.png"
              alt="CULTRAVEN"
              width={200}
              height={66}
              style={{
                objectFit: "contain",
                height: "120px",
                width: "auto",
                filter: transparent ? "brightness(0) invert(1)" : "none",
                transition: "filter 0.4s ease",
              }}
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: "flex", flex: 1, justifyContent: "center" }} className="hide-mobile">
            <MegaMenu
              navMenu={navMenu}
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
              isScrolled={!transparent}
            />
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
            <Link href="/search" aria-label="Search" style={iconStyle} className="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </Link>

            <Link href="/account/wishlist" aria-label="Wishlist" style={iconStyle} className="hide-mobile action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>

            <Link href="/account" aria-label="Account" style={iconStyle} className="hide-mobile action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>

            <div style={{ transform: "translateY(-2px)" }} className="hide-mobile">
              <CartBadge isScrolled={!transparent} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <div className="bottom-nav-grid">
          <Link href="/" className="bottom-nav-item" style={{ color: pathname === "/" ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </Link>
          <Link href="/collections/all" className="bottom-nav-item" style={{ color: pathname?.startsWith("/collections") && !pathname?.includes("/drops") ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Shop</span>
          </Link>
          <Link href="/collections/drops" className="bottom-nav-item" style={{ color: pathname?.includes("/drops") ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>Drops</span>
          </Link>
          <Link href="/account/wishlist" className="bottom-nav-item" style={{ color: pathname === "/account/wishlist" ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Wishlist</span>
          </Link>
          <div className="bottom-nav-item">
            <CartBadge isScrolled={false} />
            <span>Bag</span>
          </div>
        </div>
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .show-mobile { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
        @media (max-width: 1023px) {
          .hide-mobile { display: none !important; }
          .mobile-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: var(--color-cream);
            border-top: 1px solid var(--color-line);
            z-index: 100;
            padding-bottom: env(safe-area-inset-bottom);
            box-shadow: 0 -4px 0px 0px rgba(23,37,69,0.1);
          }
          .bottom-nav-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            height: 64px;
          }
          .bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: var(--color-navy);
            text-decoration: none;
            font-size: 9px;
            font-family: var(--font-sans);
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .bottom-nav-item svg { width: 20px; height: 20px; }
        }
        .action-icon:hover {
          color: var(--color-lava) !important;
          opacity: 0.8;
        }
        .action-icon:active {
          opacity: 1;
        }
      `}</style>
    </>
  );
}
