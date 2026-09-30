"use client";
/**
 * Admin Products List — /admin/products
 *
 * Full CRUD interface:
 *   - List all products with search, filter by status/category
 *   - Quick actions: Edit, Archive, Delete
 *   - Bulk select + bulk actions
 *   - Link to Add New Product
 *
 * Data mocked — replace fetch calls with real API calls to catalog-service.
 */
import React, { useState, useMemo } from "react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  stock: number;
  status: "active" | "draft" | "archived";
  image: string;
  updatedAt: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "p1", title: "Raven Oversized Tee — Acid Black", slug: "raven-oversized-tee-acid-black", category: "T-Shirts", price: "₹1,999", stock: 82, status: "active", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=100&auto=format&fit=crop&q=80", updatedAt: "Today" },
  { id: "p2", title: "Cargo Wide Leg — Military Olive", slug: "cargo-wide-leg-military-olive", category: "Bottoms", price: "₹3,499", stock: 34, status: "active", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&auto=format&fit=crop&q=80", updatedAt: "Today" },
  { id: "p3", title: "Raven Oversized Tee — Bone White", slug: "raven-oversized-tee-bone-white", category: "T-Shirts", price: "₹1,999", stock: 120, status: "active", image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=100&auto=format&fit=crop&q=80", updatedAt: "Yesterday" },
  { id: "p4", title: "CULTRAVEN Heavyweight Hoodie — Navy", slug: "heavyweight-hoodie-navy", category: "Hoodies", price: "₹3,999", stock: 0, status: "draft", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&auto=format&fit=crop&q=80", updatedAt: "3 days ago" },
  { id: "p5", title: "Canvas Cargo — Sand Beige", slug: "canvas-cargo-sand-beige", category: "Bottoms", price: "₹3,499", stock: 18, status: "active", image: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=100&auto=format&fit=crop&q=80", updatedAt: "1 week ago" },
  { id: "p6", title: "Raven Oversized Tee — Washed Grey", slug: "raven-oversized-tee-washed-grey", category: "T-Shirts", price: "₹1,999", stock: 67, status: "active", image: "https://images.unsplash.com/photo-1525171254930-643fc658b64e?w=100&auto=format&fit=crop&q=80", updatedAt: "1 week ago" },
  { id: "p7", title: "Legacy Jogger — Black", slug: "legacy-jogger-black", category: "Bottoms", price: "₹2,499", stock: 0, status: "archived", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&auto=format&fit=crop&q=80", updatedAt: "1 month ago" },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "rgba(16,185,129,0.12)", text: "#10B981", label: "Active" },
  draft: { bg: "rgba(245,158,11,0.12)", text: "#D97706", label: "Draft" },
  archived: { bg: "rgba(156,163,175,0.12)", text: "#9CA3AF", label: "Archived" },
};

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/products?noMock=true")
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          // Map DB structure to Admin table structure
          const mapped = data.products.map((p: any) => ({
            id: p._id || p.id,
            title: p.title,
            slug: p.slug,
            category: p.category,
            price: `₹${(p.pricePaise / 100).toLocaleString("en-IN")}`,
            stock: p.stockCount || 0,
            status: p.inStock ? "active" : "draft",
            image: p.image,
            updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "N/A",
          }));
          setProducts(mapped);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
      else alert("Failed to delete");
    } catch {
      alert("Error deleting product");
    }
  };

  const archiveProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: false }) // Simulating archive
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "archived" as const } : p)));
      }
    } catch {
      alert("Error archiving product");
    }
  };

  const CELL: React.CSSProperties = {
    padding: "1rem",
    fontFamily: "var(--font-sans)",
    fontSize: "0.78rem",
    color: "rgba(245,241,232,0.75)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };

  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.4rem" }}>
            Catalog
          </p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>
            Products
          </h1>
        </div>
        <Link
          href="/portal-secure/products/new"
          id="admin-add-product-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "var(--color-crimson)",
            color: "var(--color-cream)",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderRadius: "4px",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#a8361f")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-crimson)")}
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(245,241,232,0.35)"
            strokeWidth="2"
            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="admin-products-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.75rem",
              backgroundColor: "#1A2332",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.82rem",
              color: "var(--color-cream)",
              outline: "none",
            }}
          />
        </div>

        {/* Status filter */}
        {(["all", "active", "draft", "archived"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: statusFilter === s ? "var(--color-crimson)" : "rgba(255,255,255,0.04)",
              color: statusFilter === s ? "var(--color-cream)" : "rgba(245,241,232,0.55)",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              textTransform: "capitalize",
              border: "1px solid",
              borderColor: statusFilter === s ? "var(--color-crimson)" : "rgba(255,255,255,0.08)",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {s === "all" ? `All (${products.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${products.filter((p) => p.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.875rem 1.25rem",
            backgroundColor: "rgba(201,66,39,0.1)",
            border: "1px solid rgba(201,66,39,0.3)",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-crimson)" }}>
            {selected.size} selected
          </span>
          <button
            onClick={async () => {
              if (!confirm(`Archive ${selected.size} products?`)) return;
              try {
                await Promise.all(
                  Array.from(selected).map(id => fetch(`/api/products/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ inStock: false })
                  }))
                );
                setProducts((prev) => prev.map((p) => selected.has(p.id) ? { ...p, status: "archived" as const } : p));
                setSelected(new Set());
              } catch (e) { alert("Failed to archive some products"); }
            }}
            style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600, color: "#D97706", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Archive Selected
          </button>
          <button
            onClick={async () => {
              if (!confirm(`Delete ${selected.size} products? This cannot be undone.`)) return;
              try {
                await Promise.all(
                  Array.from(selected).map(id => fetch(`/api/products/${id}`, { method: "DELETE" }))
                );
                setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
                setSelected(new Set());
              } catch (e) { alert("Failed to delete some products"); }
            }}
            style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-crimson)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600, color: "rgba(245,241,232,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto" }}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          backgroundColor: "#1A2332",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
              <th style={{ ...CELL, width: "40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  style={{ accentColor: "var(--color-crimson)", width: "16px", height: "16px" }}
                />
              </th>
              {["Product", "Category", "Price", "Stock", "Status", "Updated", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    ...CELL,
                    color: "rgba(245,241,232,0.35)",
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...CELL, textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "rgba(245,241,232,0.3)", fontFamily: "var(--font-sans)", marginBottom: "0.75rem" }}>
                    {search || statusFilter !== "all" ? "No products match your filters." : "No products in database yet."}
                  </p>
                  {(!search && statusFilter === "all") && (
                    <a href="/portal-secure/products/new" style={{ color: "var(--color-crimson)", fontFamily: "var(--font-sans)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      + Add Your First Product
                    </a>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const badge = STATUS_BADGE[product.status];
                const isSelected = selected.has(product.id);
                return (
                  <tr
                    key={product.id}
                    style={{ backgroundColor: isSelected ? "rgba(201,66,39,0.06)" : "transparent" }}
                  >
                    <td style={CELL}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        style={{ accentColor: "var(--color-crimson)", width: "16px", height: "16px" }}
                      />
                    </td>
                    <td style={CELL}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.title}
                          style={{ width: "44px", height: "56px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
                        />
                        <div>
                          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.82rem", color: "var(--color-cream)", marginBottom: "3px" }}>
                            {product.title}
                          </p>
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "rgba(245,241,232,0.35)" }}>
                            /{product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={CELL}>{product.category}</td>
                    <td style={{ ...CELL, fontWeight: 700 }}>{product.price}</td>
                    <td style={{ ...CELL, color: product.stock === 0 ? "var(--color-crimson)" : "rgba(245,241,232,0.75)", fontWeight: product.stock === 0 ? 700 : 400 }}>
                      {product.stock === 0 ? "Out of stock" : product.stock}
                    </td>
                    <td style={CELL}>
                      <span style={{ backgroundColor: badge.bg, color: badge.text, fontFamily: "var(--font-sans)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "3px" }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ ...CELL, color: "rgba(245,241,232,0.35)", whiteSpace: "nowrap" }}>
                      {product.updatedAt}
                    </td>
                    <td style={CELL}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <Link
                          href={`/portal-secure/products/${product.id}/edit`}
                          title="Edit"
                          style={{
                            padding: "5px 10px",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            color: "rgba(245,241,232,0.7)",
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            borderRadius: "3px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          title="Archive"
                          onClick={() => archiveProduct(product.id)}
                          style={{ padding: "5px 10px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.5)", fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 600, border: "none", borderRadius: "3px", cursor: "pointer" }}
                        >
                          Archive
                        </button>
                        <button
                          title="Delete"
                          onClick={() => deleteProduct(product.id)}
                          style={{ padding: "5px 10px", backgroundColor: "rgba(201,66,39,0.1)", color: "var(--color-crimson)", fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 600, border: "none", borderRadius: "3px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "rgba(245,241,232,0.3)", marginTop: "1rem" }}>
        Showing {filtered.length} of {products.length} products
      </p>
    </div>
  );
}
