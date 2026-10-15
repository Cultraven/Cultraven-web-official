import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getPublicSmtpSettings, getSmtpSettings, saveSmtpSettings, buildTransport, explainSmtpError, smtpDetail, parseEmailList, isEmail, defaultSecure } from "@/lib/mailer";
import { clientIp, isSameOrigin, rateLimit, retryHeaders } from "@/lib/sanitize";
import { isProfile, type MailProfile } from "@/lib/mail-routing";

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
  /** Orders mailbox only; left out = keep the stored alert addresses. */
  adminEmails: z.string().max(1000).optional(),
});

/** ?profile=orders (default) or support */
function profileOf(req: NextRequest): MailProfile | null {
  const p = req.nextUrl.searchParams.get("profile") ?? "orders";
  return isProfile(p) ? p : null;
}

/** GET — current settings of one mailbox. The password is never returned, only whether one is stored. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = profileOf(req);
  if (!profile) return NextResponse.json({ error: "Unknown mailbox" }, { status: 400 });
  try {
    const s = await getPublicSmtpSettings(profile);
    return NextResponse.json({ settings: s }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Could not load settings" }, { status: 500 });
  }
}

/** PUT — save. Admin-only. */
export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const profile = profileOf(req);
  if (!profile) return NextResponse.json({ error: "Unknown mailbox" }, { status: 400 });
  const rl = rateLimit(`smtp-settings:${clientIp(req)}`, 20, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: retryHeaders(rl) });
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const p = Body.safeParse(raw);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid settings", issues: p.error.flatten().fieldErrors }, { status: 422 });
  const d = p.data;
  // Two mistakes that silently break email: a browser filling in the admin sign-in password, and a Gmail password that isn't an App Password.
  const isGoogle = /(^|\.)(gmail|google|googlemail)\.com$/i.test(d.host);
  let pass = d.pass || undefined;
  if (pass) {
    if (process.env.ADMIN_PASSWORD && pass === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "That is your admin sign-in password, not the mailbox's. Clear the field and paste the mailbox's App Password." }, { status: 422 });
    }
    if (isGoogle) {
      const compact = pass.replace(/\s+/g, "");
      if (!/^[a-z]{16}$/i.test(compact)) {
        return NextResponse.json({ error: "A Gmail App Password is exactly 16 letters (Google shows it as 4 groups of 4). Create one at Google Account → Security → App passwords." }, { status: 422 });
      }
      pass = compact;
    }
  }
  try {
    await saveSmtpSettings({
      enabled: d.enabled, host: d.host, port: d.port, secure: d.secure ?? defaultSecure(d.port), user: d.user, pass,
      fromName: d.fromName.replace(/["\r\n]/g, ""), fromEmail: d.fromEmail, adminEmails: d.adminEmails === undefined ? undefined : parseEmailList(d.adminEmails),
    }, profile);
    // Try the login right away, so a wrong password is seen now and not when a customer's email fails.
    let check: { ok: boolean | null; message?: string } = { ok: null };
    if (d.enabled) {
      const s = await getSmtpSettings(profile);
      if (s) {
        try {
          await Promise.race([buildTransport(s).verify(), new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), 8000))]);
          check = { ok: true };
        } catch (e: any) {
          const code = String(e?.code || e?.responseCode || e?.message || "");
          check = code === "ETIMEOUT" ? { ok: null, message: "Saved, but the mail server didn't answer in time — press Send test to check." } : { ok: false, message: explainSmtpError(code, smtpDetail(e)) };
        }
      }
    }
    return NextResponse.json({ success: true, check }, { headers: NO_STORE });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/password is required/i.test(msg)) return NextResponse.json({ error: "Enter the SMTP password" }, { status: 422 });
    console.error("[smtp-settings] save failed:", msg);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
