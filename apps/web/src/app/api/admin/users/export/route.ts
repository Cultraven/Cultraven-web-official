import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fmt = new URL(req.url).searchParams.get("format") ?? "csv";

  try {
    await connectToDatabase();

    const users = await User.find({})
      .select("firstName lastName email phone role status emailVerified createdAt updatedAt deletedAt")
      .sort({ createdAt: -1 })
      .lean() as any[];

    if (fmt === "csv") {
      const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "Role", "Status", "Email Verified", "Joined", "Last Updated", "Deleted At"];
      const rows = users.map((u) => [
        u._id.toString(),
        u.firstName,
        u.lastName,
        u.email,
        u.phone ?? "",
        u.role,
        u.status,
        u.emailVerified ? "Yes" : "No",
        u.createdAt ? new Date(u.createdAt).toISOString() : "",
        u.updatedAt ? new Date(u.updatedAt).toISOString() : "",
        u.deletedAt ? new Date(u.deletedAt).toISOString() : "",
      ].map(escapeCsv).join(","));

      const csv = [headers.join(","), ...rows].join("\r\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cultraven-users-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // PDF — server-rendered HTML converted to printable PDF via browser print dialog
    // We return an HTML page with @media print styles; the browser does the PDF save.
    const rows = users.map((u) => `
      <tr>
        <td>${escapeHtml(u._id.toString().slice(-8).toUpperCase())}</td>
        <td>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.phone ?? "—")}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${escapeHtml(u.status)}</td>
        <td>${u.emailVerified ? "Yes" : "No"}</td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CULTRAVEN Users Export — ${new Date().toLocaleDateString("en-IN")}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p { font-size: 11px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #1a1a2e; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
  tr:nth-child(even) td { background: #f5f5f5; }
  @media print {
    body { padding: 0; }
    @page { margin: 1.5cm; size: A4 landscape; }
  }
  .print-btn { margin-bottom: 16px; }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
<h1>CULTRAVEN — Users Export</h1>
<p>Generated: ${new Date().toLocaleString("en-IN")} &bull; Total: ${users.length} users</p>
<button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
<table>
  <thead>
    <tr>
      <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<script>window.addEventListener("load", () => window.print());</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[admin/users/export] GET failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
