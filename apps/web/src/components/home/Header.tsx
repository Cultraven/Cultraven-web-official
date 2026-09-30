"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavMenu } from "@shop/types";
import { MegaMenu } from "./MegaMenu";
import { CartBadge } from "./CartBadge";

interface HeaderProps {
  navMenu: NavMenu;
  deliveryCity?: string;
  hasHero?: boolean;
}

export function Header({ navMenu, deliveryCity: _deliveryCity = "Mumbai", hasHero = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(!hasHero);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!hasHero) {
      setIsScrolled(true);
      return;
    }
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasHero]);

  const headerBg = isScrolled ? "rgba(23, 37, 69, 0.95)" : "transparent";
  const headerColor = "#F5F1E8";
  const borderBottom = isScrolled ? "1px solid rgba(245, 241, 232, 0.1)" : "none";
  const backdropFilter = isScrolled ? "blur(8px)" : "none";

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 70,
          backgroundColor: "#F5F1E8",
          color: "#172545",
          borderBottom: "var(--border-thick)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          padding: "1rem 0",
          boxShadow: isScrolled ? "var(--shadow-sm)" : "none",
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
          {/* Mobile hamburger (left on mobile) */}
          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            style={{ background: "none", border: "none", color: "#172545", cursor: "pointer", padding: "4px", transition: "color 0.3s ease" }}
            className="show-mobile"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
              color: "#172545",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "#172545",
                color: "#F5F1E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "2px solid #172545",
                boxShadow: "2px 2px 0px 0px #C94227",
                transform: "rotate(-2deg)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 21V12M12 12L4 4M12 12L20 4" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 400,
                fontSize: "1.4rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#172545",
              }}
            >
              CULTRAVEN
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: "flex", flex: 1, justifyContent: "center" }} className="hide-mobile">
            <MegaMenu
              navMenu={navMenu}
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
              isScrolled={isScrolled}
            />
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
            {/* Search */}
            <Link
              href="/search"
              aria-label="Search"
              style={{ display: "inline-flex", background: "#F5F1E8", border: "2px solid #172545", color: "#172545", cursor: "pointer", padding: "8px", textDecoration: "none", boxShadow: "2px 2px 0px 0px #172545", borderRadius: "0px" }}
              className="action-icon"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </Link>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              style={{ display: "inline-flex", background: "#F5F1E8", border: "2px solid #172545", color: "#172545", cursor: "pointer", padding: "8px", textDecoration: "none", boxShadow: "2px 2px 0px 0px #172545", borderRadius: "0px" }}
              className="hide-mobile action-icon"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>

            {/* Account */}
            <Link
              href="/account"
              aria-label="Account"
              style={{ display: "inline-flex", background: "#F5F1E8", border: "2px solid #172545", color: "#172545", cursor: "pointer", padding: "8px", textDecoration: "none", boxShadow: "2px 2px 0px 0px #172545", borderRadius: "0px" }}
              className="hide-mobile action-icon"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>

            {/* Cart */}
            <div style={{ transform: "translateY(-2px)" }} className="hide-mobile">
              <CartBadge isScrolled={false} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <div className="bottom-nav-grid">
          <Link href="/" className="bottom-nav-item" style={{ color: pathname === "/" ? "#C94227" : "#172545" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </Link>
          <Link href="/collections/all" className="bottom-nav-item" style={{ color: pathname?.startsWith("/collections") || pathname?.startsWith("/products") ? "#C94227" : "#172545" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Shop</span>
          </Link>
          <Link href="/account/wishlist" className="bottom-nav-item" style={{ color: pathname === "/account/wishlist" ? "#C94227" : "#172545" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Wishlist</span>
          </Link>
          <div className="bottom-nav-item">
            <CartBadge isScrolled={false} />
            <span>Bag</span>
          </div>
          <Link href="/account" className="bottom-nav-item" style={{ color: pathname === "/account" ? "#C94227" : "#172545" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Account</span>
          </Link>
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
            background-color: #F5F1E8;
            border-top: var(--border-thick);
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
            color: #172545;
            text-decoration: none;
            font-size: 10px;
            font-family: var(--font-sans);
            font-weight: 800;
            text-transform: uppercase;
          }
          .bottom-nav-item svg {
            width: 20px;
            height: 20px;
          }
        }
        .action-icon:hover {
          transform: translate(-2px, -2px);
          box-shadow: 4px 4px 0px 0px #172545 !important;
        }
        .action-icon:active {
          transform: translate(0, 0);
          box-shadow: 0px 0px 0px 0px #172545 !important;
        }
      `}</style>
    </>
  );
}
