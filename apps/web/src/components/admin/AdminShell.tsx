"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SECTIONS, SECTION_MAP } from "@/lib/cms/registry";
import { ConfirmProvider, Icon, ToastProvider, useApi } from "./ui";
import "./admin.css";

interface NavLeaf { label: string; href: string; icon?: string }
interface NavGroup { label: string; items: NavLeaf[] }

const CONTENT_GROUPS = ["Homepage", "Shop", "Pages", "Site"] as const;

function useNav(): NavGroup[] {
  return useMemo(() => {
    const groups: NavGroup[] = [
      { label: "Overview", items: [{ label: "Dashboard", href: "/portal-secure", icon: "dashboard" }] },
      {
        label: "Store",
        items: [
          { label: "Products", href: "/portal-secure/products", icon: "box" },
          { label: "Categories", href: "/portal-secure/products/categories", icon: "tag" },
          { label: "Orders", href: "/portal-secure/orders", icon: "cart" },
            { label: "Users & Roles", href: "/portal-secure/users", icon: "user" },
          { label: "Delivery verification", href: "/portal-secure/delivery-verification", icon: "user" },
          { label: "Support inbox", href: "/portal-secure/support", icon: "mail" },
        ],
      },
      {
        label: "Settings",
        items: [
          { label: "Email (SMTP)", href: "/portal-secure/settings/email", icon: "mail" },
          { label: "Payments", href: "/portal-secure/settings/payments", icon: "card" },
        ],
      },
      {
        label: "Website content",
        items: [
          { label: "All content", href: "/portal-secure/cms", icon: "layout" },
          { label: "Hero", href: "/portal-secure/cms/hero", icon: "film" },
          { label: "Shop the Look", href: "/portal-secure/cms/shop-the-look", icon: "image" },
        ],
      },
    ];
    return groups;
  }, []);
}

function crumbsFor(pathname: string): string[] {
  const parts = pathname.replace(/^\/portal-secure\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) return ["Dashboard"];
  const out: string[] = [];
  const first = parts[0];
  if (first === "cms") {
    out.push("Website content");
    if (parts[1]) out.push(SECTION_MAP[decodeURIComponent(parts[1])]?.label ?? (parts[1] === "hero" ? "Hero" : parts[1] === "shop-the-look" ? "Shop the Look" : parts[1]));
  } else if (first === "products") {
    out.push("Products");
    if (parts[1] === "new") out.push("New product");
    else if (parts[1] === "categories") out.push("Categories");
    else if (parts[2] === "edit") out.push("Edit product");
  } else if (first === "orders") {
    out.push("Orders");
    if (parts[1]) out.push("Order details");
  } else if (first === "users") {
    out.push("Users");
    if (parts[1]) out.push("User details");
  } else if (first === "delivery-verification") {
    out.push("Delivery verification");
  } else if (first === "profile") {
    out.push("My profile");
  } else out.push(first);
  return out;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/portal-secure") return pathname === href;
  if (href === "/portal-secure/cms") return pathname === href;
  if (href === "/portal-secure/products") return pathname === href || /^\/portal-secure\/products\/(new|[^/]+\/edit)/.test(pathname);
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const nav = useNav();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [sideOpen, setSideOpen] = useState(false);
  const crumbs = crumbsFor(pathname);
  const { data: meData } = useApi<{ role: "admin" | "superadmin"; name: string; avatarUpdatedAt?: string | null }>("/api/admin/me");
  const roleLabel = meData?.role === "superadmin" ? "Super Admin" : "Admin";
  const avatarTs = meData?.avatarUpdatedAt ?? "";

  React.useEffect(() => { setSideOpen(false); }, [pathname]);

  const activeContentGroup = SECTIONS.find((s) => pathname === `/portal-secure/cms/${s.key}`)?.group;

  const logout = async () => {
    try { await fetch("/api/auth/admin-logout", { method: "POST" }); } catch { /* ignore */ }
    router.push("/portal-access");
    router.refresh();
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="adm adm-shell">
          {sideOpen && <div className="adm-backdrop" aria-hidden="true" onClick={() => setSideOpen(false)} />}
          <aside className={`adm-side${sideOpen ? " adm-side-open" : ""}`} aria-label="Admin navigation">
            <Link href="/portal-secure/profile" prefetch={false} style={{ textDecoration: "none" }} aria-label="My profile">
              <div className="adm-brand">
                <div className="adm-brand-mark" style={{ overflow: "hidden", padding: 0 }}>
                  {avatarTs ? (
                    <img
                      src={`/api/admin/profile/avatar?v=${encodeURIComponent(avatarTs)}`}
                      alt="Profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : "C"}
                </div>
                <div>
                  <div className="adm-brand-name">CULTRAVEN</div>
                  <div className="adm-brand-sub">{roleLabel}</div>
                </div>
              </div>
            </Link>

            <nav className="adm-nav">
              {nav.map((g) => (
                <div className="adm-nav-group" key={g.label}>
                  <div className="adm-nav-label">{g.label}</div>
                  {g.items.map((it) => (
                    <Link key={it.href} href={it.href} prefetch={false} className="adm-nav-item" aria-current={isActive(pathname, it.href) ? "page" : undefined}>
                      <Icon name={it.icon ?? "list"} /> {it.label}
                    </Link>
                  ))}
                  {g.label === "Website content" &&
                    CONTENT_GROUPS.map((grp) => {
                      const secs = SECTIONS.filter((s) => s.group === grp);
                      const expanded = openGroups[grp] ?? activeContentGroup === grp;
                      return (
                        <div key={grp}>
                          <button type="button" className="adm-nav-item" aria-expanded={expanded} onClick={() => setOpenGroups((o) => ({ ...o, [grp]: !expanded }))}>
                            <Icon name="list" /> {grp}
                            <span className="adm-nav-chev" data-open={expanded}><Icon name="chevron" size={14} /></span>
                          </button>
                          {expanded &&
                            secs.map((s) => (
                              <Link key={s.key} href={`/portal-secure/cms/${s.key}`} prefetch={false} className="adm-nav-item adm-nav-sub" aria-current={pathname === `/portal-secure/cms/${s.key}` ? "page" : undefined}>
                                {s.label}
                              </Link>
                            ))}
                        </div>
                      );
                    })}
                </div>
              ))}
            </nav>

            <div className="adm-side-foot">
              <a className="adm-nav-item" href="/" target="_blank" rel="noopener noreferrer"><Icon name="ext" /> View website</a>
              <button type="button" className="adm-nav-item" onClick={logout}><Icon name="logout" /> Sign out</button>
            </div>
          </aside>

          <div className="adm-main">
            <header className="adm-top">
              <button type="button" className="adm-hamburger" onClick={() => setSideOpen(true)} aria-label="Open navigation">
                <Icon name="menu" size={20} />
              </button>
              <nav className="adm-crumbs" aria-label="Breadcrumb">
                <span>Admin</span>
                {crumbs.map((c, i) => (
                  <React.Fragment key={c + i}>
                    <Icon name="chevron" size={14} />
                    {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
                  </React.Fragment>
                ))}
              </nav>
              <div className="adm-top-spacer" />
              <a className="adm-btn adm-btn-sm" href="/" target="_blank" rel="noopener noreferrer"><Icon name="ext" size={15} /> View site</a>
            </header>
            <main className="adm-page" id="admin-main">{children}</main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
