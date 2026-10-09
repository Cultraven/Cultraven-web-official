"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { NavMenu } from "@shop/types";
import { MegaMenu } from "./MegaMenu";
import { CartBadge } from "./CartBadge";
import { HeaderAccountIcon } from "@/components/account/HeaderAccountIcon";
import { useUiStore } from "@/store/ui";
import { CartDrawerHost, preloadCartDrawer } from "@/components/cart/CartDrawerHost";
import "./header-ui.css";

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
  const openCart = useUiStore((s) => s.openCart);

  // While the side menu is open, hide the bottom bar + chat button so they can't sit on top of it (they return on close).
  useEffect(() => {
    const root = document.documentElement;
    if (mobileMenuOpen) root.setAttribute("data-menu-open", "");
    else root.removeAttribute("data-menu-open");
    return () => root.removeAttribute("data-menu-open");
  }, [mobileMenuOpen]);

  // iOS Safari only applies :active (the pressed state) when some touchstart listener exists on the page.
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  useEffect(() => {
    if (!isHomepage) {
      setIsScrolled(true);
      return;
    }
    setIsScrolled(window.scrollY > 65);
    const onScroll = () => setIsScrolled(window.scrollY > 65);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomepage]);

  // The homepage tucks the hero up under the transparent header by exactly the header's height (--hdr-h). Measuring it
  // (border excluded, so scrolling doesn't nudge it) keeps the hero from ever covering the announcement bar.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () =>
      document.documentElement.style.setProperty("--hdr-h", `${Math.round(el.offsetHeight - (parseFloat(getComputedStyle(el).borderBottomWidth) || 0))}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const transparent = isHomepage && !isScrolled;

  // Derived style tokens
  const bg      = transparent ? "transparent" : "var(--color-cream)";
  const fg      = transparent ? "#FFFFFF"     : "var(--color-navy)";
  const border  = transparent ? "none"        : "1px solid var(--color-line)";
  const shadow  = !transparent && isScrolled  ? "var(--shadow-sm)" : "none";

  return (
    <>
      <header
        ref={headerRef}
        className="site-header"
        data-tone={transparent ? "light" : "dark"}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 70,
          backgroundColor: bg,
          color: fg,
          borderBottom: border,
          boxShadow: shadow,
          padding: "0.15rem 0",
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
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
            className="show-mobile hdr-icon"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="hdr-logo" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <Image
              src="/logo-horizontal.png"
              alt="CULTRAVEN"
              width={220}
              height={48}
              className="site-logo"
              style={{
                objectFit: "contain",
                width: "auto",
                filter: transparent ? "brightness(0) invert(1)" : "none",
                transition: "filter 0.4s ease",
              }}
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="header-nav-wrap">
            <MegaMenu
              navMenu={navMenu}
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
              isScrolled={!transparent}
            />
          </div>

          {/* Right actions: Search, Wishlist, Orders, Cart, then the account (Login / Register or profile) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
            <Link href="/search" aria-label="Search" title="Search" className="hdr-icon action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="hdr-label" aria-hidden="true">Search</span>
            </Link>

            <Link href="/account/wishlist" aria-label="Wishlist" title="Wishlist" className="hide-mobile hdr-icon action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="hdr-label" aria-hidden="true">Wishlist</span>
            </Link>

            <Link href="/account/orders" aria-label="My orders" title="My orders" className="hide-mobile hdr-icon action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                <path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>
              </svg>
              <span className="hdr-label" aria-hidden="true">Orders</span>
            </Link>

            <div className="hide-mobile">
              <CartBadge isScrolled={!transparent} />
            </div>

            {/* Last: Login / Register for visitors, the profile photo once signed in */}
            <HeaderAccountIcon className="hide-mobile hdr-icon action-icon" />
          </div>
        </div>
      </header>

      <CartDrawerHost />

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" aria-label="Quick links">
        <div className="bottom-nav-grid">
          <Link href="/" className="bottom-nav-item" style={{ color: pathname === "/" ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </Link>
          <Link href="/collections/all" className="bottom-nav-item" style={{ color: pathname?.startsWith("/collections") && !pathname?.includes("/new-in") ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Shop</span>
          </Link>
          <Link href="/collections/new-in" className="bottom-nav-item" style={{ color: pathname?.includes("/new-in") ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>New In</span>
          </Link>
          <Link href="/account/wishlist" className="bottom-nav-item" style={{ color: pathname === "/account/wishlist" ? "var(--color-lava)" : "var(--color-navy)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Wishlist</span>
          </Link>
          {/* One real button (the cart icon inside is a plain badge, not a nested button) so the whole cell is a tap target. */}
          <button type="button" className="bottom-nav-item" onClick={openCart} onPointerEnter={preloadCartDrawer} onFocus={preloadCartDrawer} style={{ color: "var(--color-navy)" }}>
            <CartBadge isScrolled bare />
            <span>Cart</span>
          </button>
        </div>
      </nav>

    </>
  );
}
