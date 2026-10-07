"use client";
/**
 * CartBadge — cart icon in header.
 * Clicking opens the CartDrawer slide-out panel.
 * Badge shows live item count from Zustand store.
 * `bare` renders the same icon + count as a plain <span> (no button) for use inside another button (mobile bottom bar).
 * Hover / focus / pressed states come from header-ui.css (.hdr-icon).
 */
import React from "react";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { preloadCartDrawer } from "@/components/cart/CartDrawerHost";
import "./header-ui.css";

export function CartBadge({ isScrolled = false, bare = false }: { isScrolled?: boolean; bare?: boolean }) {
  const count = useCartStore((s) => s.totalItems());
  const openCart = useUiStore((s) => s.openCart);

  const content = (
    <>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden="true"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>

      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: bare ? -2 : 4,
            right: bare ? -2 : 4,
            minWidth: "16px",
            height: "16px",
            padding: "0 3px",
            borderRadius: "999px",
            backgroundColor: "var(--color-crimson)",
            color: "var(--color-navy)",
            fontSize: "9px",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translate(30%, -30%)",
            fontFamily: "var(--font-mono)",
            letterSpacing: 0,
            animation: "cartPop 0.2s ease",
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </>
  );

  const color = isScrolled ? "var(--color-navy)" : "#FFFFFF";

  if (bare) {
    return (
      <span className="action-icon" aria-hidden="true" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", color }}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Open cart, ${count} item${count !== 1 ? "s" : ""}`}
      title="Cart"
      onClick={openCart}
      onPointerEnter={preloadCartDrawer}
      onFocus={preloadCartDrawer}
      className="hdr-icon action-icon"
      style={{ color }}
    >
      {content}
      <span className="hdr-label" aria-hidden="true">Cart</span>
    </button>
  );
}
