"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWishlistStore } from "@/store/wishlist";

const I = (d: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">{d}</svg>
);
const ICONS = {
  dash: I(<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>),
  orders: I(<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 01-8 0" /></>),
  heart: I(<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />),
  pin: I(<><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>),
  out: I(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></>),
};

const LINKS = [
  { href: "/account", label: "Dashboard", icon: ICONS.dash, exact: true },
  { href: "/account/orders", label: "Orders", icon: ICONS.orders },
  { href: "/account/wishlist", label: "Wishlist", icon: ICONS.heart, badge: true },
  { href: "/account/addresses", label: "Addresses", icon: ICONS.pin },
];

export function AccountNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const wishCount = useWishlistStore((s) => s.items.length);

  const logout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="acct-nav" aria-label="Account navigation">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.icon}
            {l.label}
            {l.badge && wishCount > 0 ? <span className="acct-count">{wishCount}</span> : null}
          </Link>
        );
      })}
      <button type="button" className="acct-logout" onClick={logout}>
        {ICONS.out}
        Log out
      </button>
    </nav>
  );
}
