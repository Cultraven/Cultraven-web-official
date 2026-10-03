"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavMenu, NavItem } from "@shop/types";
import { MenuAuthButtons, MenuUserBlock, MenuLogoutButton } from "@/components/account/HeaderAccountIcon";
import "./header-ui.css";

interface MegaMenuProps {
  navMenu: NavMenu;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isScrolled?: boolean;
}

// Featured editorial card shown as 3rd column in dropdown
const FEATURED: Record<string, { label: string; title: string; sub: string; href: string; tag: string }> = {
  shop: {
    label: "NEW SEASON",
    title: "DHARMA EP01",
    sub: "260 GSM heavyweight cotton. Mythic screen-prints. Just dropped.",
    href: "/collections/dharma",
    tag: "SHOP NOW →",
  },
  drops: {
    label: "CULT FAVOURITE",
    title: "DRAGON BLOOD",
    sub: "Limited archive run. Built for those who don't blend in.",
    href: "/collections/dragon-blood",
    tag: "SHOP THE DROP →",
  },
};

export function MegaMenu({ navMenu, mobileOpen, onMobileClose, isScrolled = false }: MegaMenuProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname() ?? "";

  // HOME is always the first nav item (unless the CMS menu already has one).
  const hasHome = navMenu.items.some((i) => i.href === "/" || /^home$/i.test(i.label.trim()));

  // Move focus into the side menu when it opens (keyboard / screen-reader users).
  useEffect(() => {
    if (mobileOpen) closeRef.current?.focus({ preventScroll: true });
  }, [mobileOpen]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenId(null);
        if (mobileOpen) onMobileClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen, onMobileClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggle = useCallback(
    (id: string) => setOpenId((prev) => (prev === id ? null : id)),
    []
  );

  const handleTriggerKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
    }
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpenId(null), 200);
  };

  const navFg = isScrolled ? "var(--color-navy)" : "#FFFFFF";

  return (
    <>
      {/* ──────── Desktop Nav ──────────────────────────────────────────── */}
      <nav
        ref={menuRef}
        aria-label="Main navigation"
        className="hide-mobile"
        style={{ "--nav-ul": isScrolled ? "var(--color-navy)" : "var(--color-lava)" } as React.CSSProperties}
      >
        <ul
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", listStyle: "none", margin: 0, padding: 0 }}
          role="menubar"
        >
          {!hasHome && (
            <li role="none">
              <Link
                href="/"
                role="menuitem"
                className="nav-link"
                aria-current={pathname === "/" ? "page" : undefined}
                style={{ ...NAV_FONT, color: navFg, textDecoration: "none", transition: "color 0.4s ease" }}
              >
                Home
              </Link>
            </li>
          )}
          {navMenu.items.map((item) => (
            <li
              key={item.id}
              role="none"
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
            >
              {item.columns?.length ? (
                <button
                  id={`nav-trigger-${item.id}`}
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={openId === item.id}
                  aria-controls={`nav-panel-${item.id}`}
                  onFocus={() => handleMouseEnter(item.id)}
                  onClick={() => toggle(item.id)}
                  onKeyDown={(e) => handleTriggerKey(e, item.id)}
                  className="nav-link"
                  style={{ ...NAV_FONT, color: navFg, transition: "color 0.4s ease" }}
                >
                  {item.label}
                  <ChevronDown
                    style={{
                      transition: "transform 200ms ease",
                      transform: openId === item.id ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
              ) : (
                <Link
                  href={item.href ?? "#"}
                  role="menuitem"
                  className="nav-link"
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  style={{ ...NAV_FONT, color: navFg, textDecoration: "none", transition: "color 0.4s ease" }}
                >
                  {item.label}
                </Link>
              )}

              {/* ── 3-column Mega panel ─────────────────────────────────── */}
              {item.columns?.length && (
                <div
                  id={`nav-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`nav-trigger-${item.id}`}
                  style={{
                    transition: "opacity 200ms ease, transform 200ms ease",
                    opacity: openId === item.id ? 1 : 0,
                    transform: openId === item.id ? "translateY(0)" : "translateY(4px)",
                    pointerEvents: openId === item.id ? "auto" : "none",
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    backgroundColor: "var(--color-bone)",
                    color: "var(--color-navy)",
                    zIndex: 100,
                    boxShadow: "0 8px 32px rgba(23,37,84,0.15)",
                    borderTop: "var(--border-thick)",
                  }}
                >
                  <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "2.5rem 3rem" }}>
                    <MegaPanel item={item} onClose={() => setOpenId(null)} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* ──────── Mobile Overlay ───────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onMobileClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          zIndex: 75,
          transition: "opacity 300ms ease",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          display: "block",
        }}
        className="lg:hidden"
      />

      {/* ──────── Mobile Drawer ────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={mobileOpen ? undefined : true}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "min(340px, 85vw)",
          zIndex: 80,
          backgroundColor: "var(--color-bone)",
          color: "var(--color-navy)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 24px rgba(23,37,69,0.2)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          // hidden (not just off-screen) once closed so its links can't be tabbed to
          visibility: mobileOpen ? "visible" : "hidden",
          transition: `transform 350ms ease, visibility 0s linear ${mobileOpen ? "0s" : "350ms"}`,
        }}
        className="lg:hidden mm-drawer"
      >
        {/* Drawer header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            borderBottom: "2px solid var(--color-navy)",
            flex: "0 0 auto",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.25rem",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
            }}
          >
            CULTRAVEN
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
            className="hdr-icon mm-close"
            style={{ color: "var(--color-navy)" }}
          >
            <CloseIcon />
          </button>
        </div>

        <MenuAuthButtons onClose={onMobileClose} />
        <MenuUserBlock onClose={onMobileClose} />

        {/* Nav items (scrolls on short screens; the footer below stays pinned and visible) */}
        <nav aria-label="Mobile navigation" className="mm-nav" style={{ paddingTop: "0.75rem", paddingBottom: "1rem" }}>
          {!hasHome && (
            <Link
              href="/"
              onClick={onMobileClose}
              className="mm-item"
              aria-current={pathname === "/" ? "page" : undefined}
              style={MOBILE_TOP_LINK}
            >
              Home
            </Link>
          )}
          {navMenu.items.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              pathname={pathname}
              isExpanded={mobileExpanded === item.id}
              onToggle={() => setMobileExpanded((p) => (p === item.id ? null : item.id))}
              onClose={onMobileClose}
            />
          ))}
        </nav>

        {/* Quick links footer */}
        <div className="mm-foot" style={{ borderTop: "2px solid var(--color-navy)", display: "flex", flexDirection: "column" }}>
          <FooterLink href="/account" label="My Account" onClose={onMobileClose} icon={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
          <FooterLink href="/account/orders" label="My Orders" onClose={onMobileClose} icon={<><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>} />
          <FooterLink href="/search" label="Search" onClose={onMobileClose} icon={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />
          <MenuLogoutButton onClose={onMobileClose} />
        </div>
      </div>
    </>
  );
}

const NAV_FONT: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const MOBILE_TOP_LINK: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "0.9rem 1.5rem",
  fontFamily: "var(--font-heading)",
  fontSize: "1.1rem",
  fontWeight: 900,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-navy)",
  textDecoration: "none",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
};

/** Current-page test for nav links ("/" only matches exactly). */
function isCurrent(pathname: string, href?: string): boolean {
  if (!href || href === "#") return false;
  if (href === "/") return pathname === "/";
  const clean = href.split(/[?#]/)[0];
  return pathname === clean || pathname.startsWith(clean + "/");
}

function FooterLink({ href, label, icon, onClose }: { href: string; label: string; icon: React.ReactNode; onClose: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="mm-foot-link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        fontFamily: "var(--font-sans)",
        fontWeight: 800,
        fontSize: "13px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-navy)",
        textDecoration: "none",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">{icon}</svg>
      {label}
    </Link>
  );
}

// ── 3-column Mega Panel ───────────────────────────────────────────────────────

function MegaPanel({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const feat = FEATURED[item.id] ?? null;

  const colCount = (item.columns?.length ?? 0) + (feat ? 1 : 0);
  const gridCols = colCount >= 3 ? "1fr 1fr 1fr" : colCount === 2 ? "1fr 1fr 1fr" : "1fr";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        gap: "2.5rem",
        alignItems: "start",
      }}
    >
      {/* Data columns */}
      {item.columns?.map((col) => (
        <div key={col.heading}>
          <h3
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--color-smoke)",
              margin: "0 0 1.25rem 0",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid var(--color-line)",
            }}
          >
            {col.heading}
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: col.items.length > 5 ? "1fr 1fr" : "1fr",
              gap: "0.875rem 1rem",
            }}
          >
            {col.items.map((sub) => (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={onClose}
                  className="mm-link"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--color-navy)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {sub.label}
                  {sub.isNew && (
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        color: "var(--color-navy)",
                        backgroundColor: "var(--color-lava)",
                        padding: "2px 5px",
                        letterSpacing: "0.1em",
                        flexShrink: 0,
                      }}
                    >
                      New
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* 3rd column — Featured editorial card */}
      {feat && (
        <Link
          href={feat.href}
          onClick={onClose}
          className="mm-feature"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            backgroundColor: "var(--color-navy)",
            padding: "2rem",
            minHeight: "200px",
            textDecoration: "none",
            position: "relative",
            overflow: "hidden",
            border: "2px solid var(--color-navy)",
            boxShadow: "4px 4px 0px 0px var(--color-lava)",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
        >
          {/* Decorative corner accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "60px",
              height: "60px",
              backgroundColor: "var(--color-lava)",
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "9px",
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--color-lava)",
              marginBottom: "0.5rem",
            }}
          >
            {feat.label}
          </span>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.6rem",
              fontWeight: 400,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--color-bone)",
              lineHeight: 1,
              marginBottom: "0.75rem",
            }}
          >
            {feat.title}
          </h4>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 500,
              color: "rgba(237,227,207,0.7)",
              marginBottom: "1.25rem",
              lineHeight: 1.5,
            }}
          >
            {feat.sub}
          </p>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-lava)",
            }}
          >
            {feat.tag}
          </span>
        </Link>
      )}
    </div>
  );
}

// ── Mobile Nav Item ───────────────────────────────────────────────────────────

function MobileNavItem({
  item,
  pathname,
  isExpanded,
  onToggle,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const hasChildren = Boolean(item.columns?.length);
  const panelId = `mm-sub-${item.id}`;

  if (!hasChildren) {
    return (
      <Link
        href={item.href ?? "#"}
        onClick={onClose}
        className="mm-item"
        aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
        style={MOBILE_TOP_LINK}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="mm-item"
        style={MOBILE_TOP_LINK}
      >
        {item.label}
        <ChevronDown
          style={{
            transition: "transform 200ms ease",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Accordion sub-items (visibility:hidden when collapsed so they are not tabbable) */}
      <div
        id={panelId}
        style={{
          maxHeight: isExpanded ? "800px" : "0",
          visibility: isExpanded ? "visible" : "hidden",
          transition: `max-height 400ms ease, visibility 0s linear ${isExpanded ? "0s" : "400ms"}`,
          overflow: "hidden",
          backgroundColor: "rgba(23,37,69,0.04)",
        }}
      >
        <div style={{ padding: "0.75rem 1.5rem 1.25rem" }}>
          {item.columns?.map((col) => (
            <div key={col.heading} style={{ marginBottom: "1.25rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "10px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "var(--color-smoke)",
                  marginBottom: "0.5rem",
                }}
              >
                {col.heading}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
                {col.items.map((sub) => (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      onClick={onClose}
                      className="mm-sub"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "13px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--color-navy)",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0 0.5rem",
                        margin: "0 -0.5rem",
                      }}
                    >
                      {sub.label}
                      {sub.isNew && (
                        <span
                          style={{
                            fontSize: "8px",
                            fontWeight: 900,
                            color: "var(--color-navy)",
                            backgroundColor: "var(--color-lava)",
                            padding: "2px 5px",
                            letterSpacing: "0.1em",
                          }}
                        >
                          New
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChevronDown({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className} style={style}>
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
