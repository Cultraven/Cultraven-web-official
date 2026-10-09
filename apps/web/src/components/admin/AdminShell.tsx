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

/** The page "up" from here, for the Back button when there is no history to step back through (page opened or refreshed directly). */
function parentOf(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "");
  if (/^\/portal-secure\/products\/.+/.test(clean)) return "/portal-secure/products"; // new / edit / categories
  if (/^\/portal-secure\/settings\/.+/.test(clean)) return "/portal-secure"; // settings has no index page
  const parts = clean.split("/").filter(Boolean);
  parts.pop();
  const up = "/" + parts.join("/");
  return up.startsWith("/portal-secure") ? up : "/portal-secure";
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/portal-secure") return pathname === href;
  if (href === "/portal-secure/cms") return pathname === href;
  if (href === "/portal-secure/products") return pathname === href || /^\/portal-secure\/products\/(new|[^/]+\/edit)/.test(pathname);
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * On phones the admin tables turn into stacked cards (see admin.css). Each cell needs its column's name as a label, taken from the
 * table's header row, so this keeps every table's cells labelled as rows load or change.
 */
function useTableLabels() {
  React.useEffect(() => {
    let raf = 0;
    const label = () => {
      document.querySelectorAll<HTMLTableElement>(".adm-table").forEach((t) => {
        const heads = Array.from(t.querySelectorAll("thead th")).map((th) => (((th as HTMLElement).innerText || th.textContent) ?? "").trim());
        t.querySelectorAll("tbody tr").forEach((tr) =>
          Array.from(tr.children).forEach((td, i) => {
            const l = heads[i] && heads[i] !== "Actions" ? heads[i].split(" / ")[0] : ""; // "Name / Email" is labelled "Name" in a card
            if (td.getAttribute("data-label") !== l) td.setAttribute("data-label", l);
          }),
        );
      });
    };
    const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(label); };
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.getElementById("admin-main") ?? document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  useTableLabels();
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

  // Back button: after moving around inside the panel it steps back like the browser's Back; if this page was opened directly it goes up a level.
  const visited = React.useRef(0);
  const steppingBack = React.useRef(false);
  React.useEffect(() => { if (steppingBack.current) steppingBack.current = false; else visited.current += 1; }, [pathname]);
  const goBack = () => {
    if (visited.current > 1 && window.history.length > 1) { visited.current -= 1; steppingBack.current = true; router.back(); return; }
    router.push(parentOf(pathname));
  };
  const showBack = pathname.replace(/\/+$/, "") !== "/portal-secure"; // the dashboard is the top: nowhere to go back to

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
                  ) : <img src="/logo-mark.png" alt="" style={{ width: "74%", height: "74%", objectFit: "contain", display: "block", margin: "auto" }} />}
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
              {showBack ? (
                <button type="button" className="adm-back" onClick={goBack} aria-label="Go back">
                  <Icon name="back" size={16} /><span>Back</span>
                </button>
              ) : null}
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
