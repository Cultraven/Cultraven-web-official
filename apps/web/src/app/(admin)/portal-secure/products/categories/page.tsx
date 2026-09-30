"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Row { name: string; count: number }

/**
 * Categories are the `category` value on each product in the database — there is no
 * separate category record. This page lists them with live counts (read-only).
 * To add a category, create a product with that category; rename by editing its products.
 */
export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=100", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "HTTP " + r.status);
        const counts = new Map<string, number>();
        for (const p of d.products ?? []) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
        setRows([...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ padding: "2.5rem 3rem", maxWidth: 820 }}>
      <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-lava)", marginBottom: 6 }}>Catalog</p>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", marginBottom: 6 }}>Categories</h1>
      <p style={{ fontSize: "0.8rem", color: "rgba(245,241,232,0.5)", marginBottom: "1.75rem" }}>
        Derived from the category of each product in the database. Add or rename a category by editing products.
      </p>
      {error && <p role="alert" style={{ color: "#FCA5A5", fontSize: "0.85rem" }}>Could not load categories ({error}).</p>}
      {!rows && !error && <p style={{ color: "rgba(245,241,232,0.5)" }}>Loading…</p>}
      {rows && rows.length === 0 && <p style={{ color: "rgba(245,241,232,0.6)" }}>No products yet, so no categories.</p>}
      {rows && rows.length > 0 && (
        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
          {rows.map((r, i) => (
            <div key={r.name} style={{ display: "flex", justifyContent: "space-between", padding: "0.9rem 1.25rem", borderTop: i ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ color: "var(--color-cream)", fontWeight: 700, fontSize: "0.85rem", textTransform: "capitalize" }}>{r.name}</span>
              <span style={{ color: "rgba(245,241,232,0.5)", fontSize: "0.8rem" }}>{r.count} product{r.count === 1 ? "" : "s"}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/portal-secure/products/new" style={{ color: "var(--color-lava)", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>+ Add a product</Link>
      </div>
    </div>
  );
}
