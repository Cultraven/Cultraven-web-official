import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSmtpSettings, buildTransport, explainSmtpError, isEmail } from "@/lib/mailer";
import { testEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

// Small in-memory throttle: a test send per 10 s is plenty and stops this being used to spam an address.
let lastRun = 0;

/** POST { to } — verify the saved SMTP settings and send a test message. Admin-only. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = Date.now();
  if (now - lastRun < 10_000) return NextResponse.json({ error: "Please wait a few seconds between tests" }, { status: 429 });
  lastRun = now;

  let to = "";
  try { to = String(((await req.json()) as any)?.to ?? "").trim(); } catch { /* handled below */ }
  if (!isEmail(to)) return NextResponse.json({ error: "Enter a valid email address to send the test to" }, { status: 422 });

  const s = await getSmtpSettings();
  if (!s) return NextResponse.json({ error: "Save your SMTP settings first" }, { status: 400 });

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const m = testEmail(site);
  try {
    const t = buildTransport(s);
    await t.verify();
    await t.sendMail({ from: `"${s.fromName.replace(/"/g, "")}" <${s.fromEmail}>`, to, subject: m.subject, html: m.html, text: m.text });
    return NextResponse.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (e: any) {
    const code = String(e?.code || e?.responseCode || e?.message || "");
    return NextResponse.json({ ok: false, error: explainSmtpError(code), code: String(e?.code || e?.responseCode || "") }, { status: 502 });
  }
}
