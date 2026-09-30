/**
 * Admin layout — /portal-secure/**
 *
 * Route group (admin), isolated from the storefront. Protected by the admin-only
 * middleware. The shell (sidebar, top bar, toasts, confirm dialogs) is one client
 * component; pages render inside it.
 */
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Admin · CULTRAVEN", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
