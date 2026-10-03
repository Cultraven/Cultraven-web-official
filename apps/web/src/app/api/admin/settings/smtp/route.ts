import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getPublicSmtpSettings, saveSmtpSettings, parseEmailList, isEmail, defaultSecure } from "@/lib/mailer";
import { clientIp, isSameOrigin, rateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

const Body = z.object({
  enabled: z.boolean(),
  host: z.string().trim().min(3).max(200).regex(/^[A-Za-z0-9.-]+$/, "Host looks invalid"),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean().optional(),
  user: z.string().trim().min(1).max(200),
  /** Empty / missing = keep the stored password. */
  pass: z.string().max(500).optional(),
  fromName: z.string().trim().min(1).max(80),
  fromEmail: z.string().trim().max(254).refine(isEmail, "From address is not a valid email"),
  adminEmails: z.string().max(1000),
});

/** GET — current settings. The password is never returned, only whether one is stored. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const s = await getPublicSmtpSettings();
    return NextResponse.json({ settings: s }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Could not load settings" }, { status: 500 });
  }
}

/** PUT — save. Admin-only. */
export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(`smtp-settings:${clientIp(req)}`, 20, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: retryHeaders(rl) });
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const p = Body.safeParse(raw);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid settings", issues: p.error.flatten().fieldErrors }, { status: 422 });
  const d = p.data;
  try {
    await saveSmtpSettings({
      enabled: d.enabled, host: d.host, port: d.port, secure: d.secure ?? defaultSecure(d.port), user: d.user, pass: d.pass || undefined,
      fromName: d.fromName.replace(/["\r\n]/g, ""), fromEmail: d.fromEmail, adminEmails: parseEmailList(d.adminEmails),
    });
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/password is required/i.test(msg)) return NextResponse.json({ error: "Enter the SMTP password" }, { status: 422 });
    console.error("[smtp-settings] save failed:", msg);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
