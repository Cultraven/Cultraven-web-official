"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import type { NavMenu, NavItem } from "@shop/types";

interface MegaMenuProps {
  navMenu: NavMenu;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isScrolled?: boolean;
}

export function MegaMenu({ navMenu, mobileOpen, onMobileClose, isScrolled = false }: MegaMenuProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);

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

  const handleTriggerKey = (
    e: KeyboardEvent<HTMLButtonElement>,
    id: string
  ) => {
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
    timeoutRef.current = setTimeout(() => {
      setOpenId(null);
    }, 200);
  };

  // When isScrolled=false the header is transparent (over hero) → white text
  const navFg = isScrolled ? "var(--color-navy)" : "#FFFFFF";

  return (
    <>
      {/* ──────── Desktop Nav ──────────────────────────────────────────── */}
      <nav
        ref={menuRef}
        aria-label="Main navigation"
        className="hide-mobile"
      >
        <ul style={{ display: "flex", alignItems: "center", gap: "1.5rem", listStyle: "none", margin: 0, padding: 0 }} role="menubar">
          {navMenu.items.map((item) => (
            <li key={item.id} role="none" onMouseEnter={() => handleMouseEnter(item.id)} onMouseLeave={handleMouseLeave}>
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
                  style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", color: navFg, transition: "opacity 0.2s, color 0.4s ease" }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.6")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
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
                  style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase", color: navFg, textDecoration: "none", transition: "opacity 0.2s, color 0.4s ease" }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.6")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {item.label}
                </Link>
              )}

              {/* ── Mega panel ──────────────────────────────────────────── */}
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
                    borderTop: "var(--border-thick)"
                  }}
                >
                  <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "3rem" }}>
                    <MegaPanel item={item} onClose={() => setOpenId(null)} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* ──────── Mobile Drawer ────────────────────────────────────────── */}
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onMobileClose}
        style={{
          transition: "opacity 300ms ease",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[var(--z-overlay)] lg:hidden"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 350ms ease",
        }}
        className="fixed top-0 left-0 h-full w-[min(340px,85vw)] z-[var(--z-modal)] bg-[var(--color-bone)] text-[var(--color-navy)] overflow-y-auto flex flex-col lg:hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-6 border-b-2 border-[var(--color-navy)]">
          <span className="font-display text-xl font-black tracking-widest uppercase">
            CULTRAVEN
          </span>
          <button
            onClick={onMobileClose}
            aria-label="Close navigation menu"
            className="p-2 hover:opacity-60 transition-opacity"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Mobile navigation" className="flex-1 py-6">
          {navMenu.items.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              isExpanded={mobileExpanded === item.id}
              onToggle={() =>
                setMobileExpanded((p) => (p === item.id ? null : item.id))
              }
              onClose={onMobileClose}
            />
          ))}
        </nav>
      </div>
    </>
  );
}

function MegaPanel({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const hasFeatured = item.id === "men" || item.id === "women";
  const featuredSrc =
    item.id === "men"
      ? "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=480&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=480&auto=format&fit=crop&q=80";
  const featuredLabel =
    item.id === "men" ? "NEW DROP — MEN" : "NEW DROP — WOMEN";
  const featuredHref =
    item.id === "men" ? "/collections/new-in" : "/collections/women/new-in";

  return (
    <div style={{ display: "flex", gap: "3rem", justifyContent: "flex-start", textAlign: "left" }}>
      {/* Category columns */}
      {item.columns?.map((col) => (
        <div key={col.heading} style={{ minWidth: "150px" }}>
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-smoke)", margin: "0 0 1.5rem 0" }}>
            {col.heading}
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
            {col.items.map((sub) => (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={onClose}
                  style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-navy)", textDecoration: "none", display: "flex", alignItems: "center", transition: "color 0.2s" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "var(--color-lava)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "var(--color-navy)")}
                >
                  {sub.label}
                  {sub.isNew && (
                    <span style={{ marginLeft: "0.75rem", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", color: "var(--color-bone)", backgroundColor: "var(--color-lava)", padding: "2px 6px", letterSpacing: "0.1em" }}>
                      New
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Featured editorial image — men/women only */}
      {hasFeatured && (
        <div style={{ marginLeft: "auto", flexShrink: 0, width: "200px", display: "flex", flexDirection: "column" }}>
          <Link
            href={featuredHref}
            onClick={onClose}
            style={{ display: "block", position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-stone)" }}
            onMouseOver={(e) => {
              const img = e.currentTarget.querySelector('img');
              if(img) img.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              const img = e.currentTarget.querySelector('img');
              if(img) img.style.transform = "scale(1)";
            }}
          >
            <img
              src={featuredSrc}
              alt={featuredLabel}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(23,37,69,0.75) 0%, transparent 50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "1rem",
                left: "1rem",
                right: "1rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(245,241,232,0.7)",
                  marginBottom: "4px",
                }}
              >
                FEATURED
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-bone)",
                }}
              >
                {featuredLabel}
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function MobileNavItem({
  item,
  isExpanded,
  onToggle,
  onClose,
}: {
  item: NavItem;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const hasChildren = Boolean(item.columns?.length);

  if (!hasChildren) {
    return (
      <Link
        href={item.href ?? "#"}
        onClick={onClose}
        className="block px-8 py-4 font-display text-lg font-black tracking-wider uppercase text-[var(--color-navy)] hover:bg-[var(--color-cream)] transition-colors"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        aria-expanded={isExpanded}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-8 py-4 font-display text-lg font-black tracking-wider uppercase text-[var(--color-navy)] hover:bg-[var(--color-cream)] transition-colors"
      >
        {item.label}
        <ChevronDown
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        style={{
          maxHeight: isExpanded ? "1000px" : "0",
          transition: "max-height 400ms ease",
          overflow: "hidden",
        }}
        className="bg-[var(--color-stone)]/30"
      >
        <div className="px-8 py-6 space-y-8">
          {item.columns?.map((col) => (
            <div key={col.heading}>
              <p className="font-display text-[11px] font-black uppercase tracking-widest text-[var(--color-lava)] mb-4">
                {col.heading}
              </p>
              <ul className="space-y-4">
                {col.items.map((sub) => (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      onClick={onClose}
                      className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-navy)] hover:text-[var(--color-lava)] transition-colors flex items-center"
                    >
                      {sub.label}
                      {sub.isNew && (
                        <span className="ml-3 text-[9px] font-black uppercase text-[var(--color-navy)] bg-[var(--color-lava)] px-1.5 py-0.5 tracking-widest">
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
