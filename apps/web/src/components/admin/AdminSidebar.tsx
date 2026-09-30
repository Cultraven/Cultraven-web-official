/**
 * AdminSidebar — left navigation for the CMS/Admin panel.
 *
 * Sections:
 *   - Dashboard
 *   - Products (list, add new, categories)
 *   - Orders
 *   - CMS (hero banners, announcements, homepage sections)
 *   - Customers
 *   - Analytics
 *   - Settings
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactElement;
  children?: { label: string; href: string }[];
}

const NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/portal-secure",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "products",
    label: "Products",
    href: "/portal-secure/products",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    children: [
      { label: "All Products", href: "/portal-secure/products" },
      { label: "Add New Product", href: "/portal-secure/products/new" },
      { label: "Categories", href: "/portal-secure/products/categories" },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    href: "/portal-secure/orders",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    children: [
      { label: "All Orders", href: "/portal-secure/orders" },
      { label: "Pending", href: "/portal-secure/orders?status=pending" },
      { label: "Processing", href: "/portal-secure/orders?status=processing" },
      { label: "Shipped", href: "/portal-secure/orders?status=shipped" },
      { label: "Completed", href: "/portal-secure/orders?status=completed" },
      { label: "Cancelled", href: "/portal-secure/orders?status=cancelled" },
    ],
  },
  {
    id: "cms",
    label: "CMS",
    href: "/portal-secure/cms",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    children: [
      { label: "Hero Banners", href: "/portal-secure/cms/hero" },
      { label: "Shop The Look", href: "/portal-secure/cms/shop-the-look" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    href: "/portal-secure/customers",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/portal-secure/analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/portal-secure/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const isActive = (href: string) =>
    href === "/portal-secure" ? pathname === "/portal-secure" : pathname.startsWith(href);

  return (
    <aside
      style={{
        width: "240px",
        flexShrink: 0,
        backgroundColor: "#111827",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem 1.5rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/portal-secure"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.25rem",
            textDecoration: "none",
          }}
        >
          <Image
            src="/logo.png"
            alt="CULTRAVEN"
            width={140}
            height={46}
            style={{ objectFit: "contain", height: "34px", width: "auto", filter: "brightness(0) invert(1)" }}
          />
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.55rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,241,232,0.35)",
            }}
          >
            Admin Panel
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
        {NAV.map((item) => {
          const active = isActive(item.href);
          const open = !collapsed[item.id];

          return (
            <div key={item.id}>
              {item.children ? (
                <button
                  onClick={() => toggle(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.625rem 1.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: active ? "var(--color-cream)" : "rgba(245,241,232,0.55)",
                    transition: "color 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {item.icon}
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: open ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              ) : (
                <Link
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.625rem 1.5rem",
                    textDecoration: "none",
                    color: active ? "var(--color-cream)" : "rgba(245,241,232,0.55)",
                    backgroundColor: active ? "rgba(201,66,39,0.12)" : "transparent",
                    borderLeft: active ? "2px solid var(--color-crimson)" : "2px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.icon}
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: active ? 700 : 600,
                      fontSize: "0.82rem",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              )}

              {/* Children */}
              {item.children && open && (
                <div style={{ marginBottom: "0.25rem" }}>
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        style={{
                          display: "block",
                          padding: "0.5rem 1.5rem 0.5rem 3.25rem",
                          textDecoration: "none",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.78rem",
                          fontWeight: childActive ? 700 : 500,
                          color: childActive ? "var(--color-cream)" : "rgba(245,241,232,0.45)",
                          borderLeft: childActive ? "2px solid var(--color-crimson)" : "2px solid transparent",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(245,241,232,0.8)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLAnchorElement).style.color =
                            childActive ? "var(--color-cream)" : "rgba(245,241,232,0.45)")
                        }
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: storefront link + logout */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            fontFamily: "var(--font-sans)",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "rgba(245,241,232,0.4)",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(245,241,232,0.8)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(245,241,232,0.4)")
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          View Storefront
        </a>

        {/* Admin Logout */}
        <AdminLogout />
      </div>
    </aside>
  );
}

function AdminLogout() {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
    } finally {
      window.location.href = "/portal-access";
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "none",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "rgba(201,66,39,0.7)",
        padding: 0,
        transition: "color 0.15s ease",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-crimson)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.color = "rgba(201,66,39,0.7)")
      }
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}

