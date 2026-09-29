/**
 * Admin layout — /admin
 *
 * Route group (admin) — completely isolated from shop routes.
 * Protected by admin-only middleware (see middleware.ts).
 * Dark sidebar + main content shell.
 */

import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#0F1419",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <AdminSidebar />
      <main
        id="admin-main"
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#0F1419",
        }}
      >
        {children}
      </main>
    </div>
  );
}
