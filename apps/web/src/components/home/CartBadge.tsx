"use client";
/**
 * CartBadge — cart icon in header.
 * Clicking opens the CartDrawer slide-out panel.
 * Badge shows live item count from Zustand store.
 */
import React, { useState } from "react";
import { useCartStore } from "@/store/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function CartBadge({ isScrolled = false }: { isScrolled?: boolean }) {
  const count = useCartStore((s) => s.totalItems());
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button
        aria-label={`Open cart, ${count} item${count !== 1 ? "s" : ""}`}
        onClick={() => setDrawerOpen(true)}
        className="action-icon"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          padding: 0,
          color: isScrolled ? "var(--color-navy)" : "#FFFFFF",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          borderRadius: "0px",
          cursor: "pointer",
          transition: "opacity 0.2s ease",
          flexShrink: 0,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>

        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "var(--color-crimson)",
              color: "var(--color-cream)",
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
      </button>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <style>{`
        @keyframes cartPop {
          0% { transform: translate(30%, -30%) scale(0.6); }
          60% { transform: translate(30%, -30%) scale(1.2); }
          100% { transform: translate(30%, -30%) scale(1); }
        }
      `}</style>
    </>
  );
}
