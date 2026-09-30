"use client";

import React, { useMemo } from "react";
import { Alert, Button, Card, EmptyState, LinkButton, PageHeader, TableSkeleton, useApi } from "@/components/admin/ui";

/**
 * Categories are the `category` value on each product in the database — there is no
 * separate category record. This lists them with live counts (read-only). Add or rename
 * a category by editing its products.
 */
export default function AdminCategoriesPage() {
  const { data, error, loading, reload } = useApi<{ products: { category: string }[] }>("/api/products?limit=100");

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of data?.products ?? []) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <>
      <PageHeader eyebrow="Store" title="Categories" description="Derived from each product's category. Add or rename one by editing products.">
        <LinkButton href="/portal-secure/products/new" variant="primary" icon="plus">Add product</LinkButton>
      </PageHeader>
      {error ? <Alert>Could not load categories ({error}). <Button size="sm" onClick={reload} style={{ marginLeft: 8 }}>Retry</Button></Alert> : null}
      <Card pad={false}>
        {loading ? <TableSkeleton rows={4} cols={2} /> : rows.length === 0 ? (
          <EmptyState title="No categories yet" description="Categories appear automatically once you add products." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Category</th><th className="num">Products</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}><td style={{ textTransform: "capitalize", fontWeight: 600 }}>{r.name}</td><td className="num">{r.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
