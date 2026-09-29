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
  const iconColor = "#F5F1E8";
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button
        aria-label={`Open cart, ${count} item${count !== 1 ? "s" : ""}`}
        onClick={() => setDrawerOpen(true)}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          color: iconColor,
          transition: "color 0.3s ease",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
              backgroundColor: "#C94227",
              color: "#F5F1E8",
              fontSize: "9px",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "translate(30%, -30%)",
              fontFamily: "Inter, sans-serif",
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
