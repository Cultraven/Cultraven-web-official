"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { NavMenu } from "@shop/types";
import { MegaMenu } from "./MegaMenu";
import { CartBadge } from "./CartBadge";

interface HeaderProps {
  navMenu: NavMenu;
  deliveryCity?: string;
}

export function Header({ navMenu, deliveryCity: _deliveryCity = "Mumbai" }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerBg = isScrolled ? "#F5F1E8" : "transparent";
  const headerColor = isScrolled ? "#172545" : "#F5F1E8";
  const borderBottom = isScrolled ? "1px solid #D9D3C4" : "none";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 70,
        backgroundColor: headerBg,
        color: headerColor,
        borderBottom,
        transition: "background-color 0.3s ease, color 0.3s ease, border-bottom 0.3s ease",
        padding: isScrolled ? "1rem 0" : "1.5rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: "clamp(1.25rem,4vw,5rem)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            color: headerColor,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              border: `2px solid ${headerColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "border-color 0.3s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 21V12M12 12L4 4M12 12L20 4" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "Inter, 'Helvetica Neue', sans-serif",
              fontWeight: 900,
              fontSize: "1.1rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: headerColor,
              transition: "color 0.3s ease",
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
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
          {/* Search */}
          <button
            aria-label="Search"
            style={{ background: "none", border: "none", color: headerColor, cursor: "pointer", padding: "4px", transition: "color 0.3s ease" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Account */}
          <button
            aria-label="Account"
            style={{ background: "none", border: "none", color: headerColor, cursor: "pointer", padding: "4px", transition: "color 0.3s ease" }}
            className="hide-mobile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          {/* Cart */}
          <CartBadge isScrolled={isScrolled} />

          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            style={{ background: "none", border: "none", color: headerColor, cursor: "pointer", padding: "4px", transition: "color 0.3s ease" }}
            className="show-mobile"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) { .show-mobile { display: none !important; } }
        @media (max-width: 1023px) { .hide-mobile { display: none !important; } }
      `}</style>
    </header>
  );
}
