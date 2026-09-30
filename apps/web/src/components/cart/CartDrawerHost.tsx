"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useUiStore } from "@/store/ui";

// The drawer's code (and its DOM) is only brought in the first time the cart is opened.
const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });

/** Preload the drawer chunk (call on hover/focus/idle so the first open is instant). */
export const preloadCartDrawer = () => { void import("./CartDrawer"); };

/** One drawer for the whole site (header + mobile bar share it). */
export function CartDrawerHost() {
  const open = useUiStore((s) => s.cartOpen);
  const close = useUiStore((s) => s.closeCart);
  const [everOpened, setEverOpened] = useState(false);
  if (open && !everOpened) setEverOpened(true);
  if (!everOpened) return null;
  return <CartDrawer open={open} onClose={close} />;
}
