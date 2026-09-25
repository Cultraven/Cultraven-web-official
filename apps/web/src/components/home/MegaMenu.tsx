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

  const textColor = isScrolled ? "text-[var(--color-black)]" : "text-[var(--color-white)]";
  const hoverColor = "hover:opacity-60";

  return (
    <>
      {/* ──────── Desktop Nav ──────────────────────────────────────────── */}
      <nav
        ref={menuRef}
        aria-label="Main navigation"
        className="hidden lg:block"
      >
        <ul className="flex items-center gap-6" role="menubar">
          {navMenu.items.map((item) => (
            <li key={item.id} role="none" className="relative group">
              {item.columns?.length ? (
                <button
                  id={`nav-trigger-${item.id}`}
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={openId === item.id}
                  aria-controls={`nav-panel-${item.id}`}
                  onMouseEnter={() => setOpenId(item.id)}
                  onMouseLeave={() => setOpenId(null)}
                  onFocus={() => setOpenId(item.id)}
                  onClick={() => toggle(item.id)}
                  onKeyDown={(e) => handleTriggerKey(e, item.id)}
                  className={`flex items-center gap-1 font-display text-[13px] font-black tracking-wider uppercase transition-opacity focus-visible:outline-none ${textColor} ${hoverColor}`}
                >
                  {item.label}
                  <ChevronDown
                    className={`transition-transform duration-200 ${
                      openId === item.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <Link
                  href={item.href ?? "#"}
                  role="menuitem"
                  className={`block font-display text-[13px] font-black tracking-wider uppercase transition-opacity ${textColor} ${hoverColor}`}
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
                  onMouseEnter={() => setOpenId(item.id)}
                  onMouseLeave={() => setOpenId(null)}
                  style={{
                    transition: "opacity 200ms ease, transform 200ms ease",
                    opacity: openId === item.id ? 1 : 0,
                    transform: openId === item.id ? "translateY(0)" : "translateY(4px)",
                    pointerEvents: openId === item.id ? "auto" : "none",
                  }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-6 w-screen max-w-4xl bg-[var(--color-white)] text-[var(--color-black)] p-12 z-[var(--z-dropdown)] shadow-xl"
                >
                  <MegaPanel item={item} onClose={() => setOpenId(null)} />
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
        className="fixed top-0 left-0 h-full w-[min(340px,85vw)] z-[var(--z-modal)] bg-[var(--color-white)] text-[var(--color-black)] overflow-y-auto flex flex-col lg:hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-[var(--color-border)]">
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
  return (
    <div className="flex gap-16 justify-center text-left">
      {item.columns?.map((col) => (
        <div key={col.heading} className="min-w-[160px]">
          <h3 className="font-display text-[11px] font-black uppercase tracking-widest text-[var(--color-gray)] mb-6">
            {col.heading}
          </h3>
          <ul className="space-y-4">
            {col.items.map((sub) => (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={onClose}
                  className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-black)] hover:text-[var(--color-gray)] transition-colors flex items-center"
                >
                  {sub.label}
                  {sub.isNew && (
                    <span className="ml-3 text-[9px] font-black uppercase text-[var(--color-white)] bg-[var(--color-black)] px-1.5 py-0.5 tracking-widest">
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
        className="block px-8 py-4 font-display text-lg font-black tracking-wider uppercase text-[var(--color-black)] hover:bg-[var(--color-stone)] transition-colors"
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
        className="w-full flex items-center justify-between px-8 py-4 font-display text-lg font-black tracking-wider uppercase text-[var(--color-black)] hover:bg-[var(--color-stone)] transition-colors"
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
              <p className="font-display text-[11px] font-black uppercase tracking-widest text-[var(--color-gray)] mb-4">
                {col.heading}
              </p>
              <ul className="space-y-4">
                {col.items.map((sub) => (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      onClick={onClose}
                      className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-black)] hover:text-[var(--color-gray)] transition-colors flex items-center"
                    >
                      {sub.label}
                      {sub.isNew && (
                        <span className="ml-3 text-[9px] font-black uppercase text-[var(--color-white)] bg-[var(--color-black)] px-1.5 py-0.5 tracking-widest">
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

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
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
