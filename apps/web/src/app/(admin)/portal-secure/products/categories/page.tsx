"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  status: "active" | "hidden";
}

const MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Oversized Tees", slug: "oversized-tees", productCount: 12, status: "active" },
  { id: "c2", name: "Acid Wash", slug: "acid-wash", productCount: 8, status: "active" },
  { id: "c3", name: "Heavyweight Hoodies", slug: "hoodies", productCount: 5, status: "active" },
  { id: "c4", name: "Baggy Jeans", slug: "jeans", productCount: 6, status: "active" },
  { id: "c5", name: "Street Accessories", slug: "accessories", productCount: 4, status: "hidden" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);

  const deleteCategory = (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.5rem" }}>
            Catalog
          </p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>
            Categories
          </h1>
        </div>
        <button
          style={{
            backgroundColor: "var(--color-crimson)",
            color: "var(--color-cream)",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "4px",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transition: "background-color 0.2s",
          }}
          onClick={() => alert("Add Category feature not implemented in this mock.")}
        >
          + Add Category
        </button>
      </div>

      {/* Main Box */}
      <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Name", "Slug", "Products", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(245,241,232,0.35)",
                    padding: "1rem 1.5rem",
                    textAlign: h === "Actions" || h === "Products" ? "center" : "left",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "1.25rem 1.5rem", fontFamily: "var(--font-sans)", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-cream)" }}>
                  {cat.name}
                </td>
                <td style={{ padding: "1.25rem 1.5rem", fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "rgba(245,241,232,0.6)" }}>
                  /{cat.slug}
                </td>
                <td style={{ padding: "1.25rem 1.5rem", fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "rgba(245,241,232,0.6)", textAlign: "center" }}>
                  {cat.productCount}
                </td>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: cat.status === "active" ? "#10B981" : "#9CA3AF",
                      backgroundColor: cat.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(156,163,175,0.12)",
                      padding: "4px 10px",
                      borderRadius: "3px",
                    }}
                  >
                    {cat.status}
                  </span>
                </td>
                <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                    <button
                      onClick={() => alert(`Edit ${cat.name}`)}
                      style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600 }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "rgba(245,241,232,0.4)" }}>
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
