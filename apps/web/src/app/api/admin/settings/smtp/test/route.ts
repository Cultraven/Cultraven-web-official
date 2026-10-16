import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSmtpSettings, buildTransport, explainSmtpError, smtpDetail, isEmail } from "@/lib/mailer";
import { testEmail } from "@/lib/email-templates";
import { withInlineLogo } from "@/lib/email-logo";
import { isProfile } from "@/lib/mail-routing";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // email is sent after the response: leave room for a slow mail server

// Small in-memory throttle: a test send per 10 s is plenty and stops this being used to spam an address.
let lastRun = 0;

/** POST { to, profile? } — verify one mailbox's saved SMTP settings and send a test message from it. Admin-only. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = Date.now();
  if (now - lastRun < 10_000) return NextResponse.json({ error: "Please wait a few seconds between tests" }, { status: 429 });
  lastRun = now;

  let to = "";
  let profile: string = "orders";
  try { const b = (await req.json()) as any; to = String(b?.to ?? "").trim(); if (b?.profile !== undefined) profile = String(b.profile); } catch { /* handled below */ }
  if (!isProfile(profile)) return NextResponse.json({ error: "Unknown mailbox" }, { status: 400 });
  if (!isEmail(to)) return NextResponse.json({ error: "Enter a valid email address to send the test to" }, { status: 422 });

  const s = await getSmtpSettings(profile);
  if (!s) return NextResponse.json({ error: "Save this mailbox's settings first" }, { status: 400 });

  const m = testEmail(siteUrl());
  try {
    const t = buildTransport(s);
    await t.verify();
    const { html, attachment } = withInlineLogo(m.html);
    await t.sendMail({ from: `"${s.fromName.replace(/"/g, "")}" <${s.fromEmail}>`, to, subject: m.subject, html, text: m.text, attachments: attachment ? [attachment] : [] });
    return NextResponse.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (e: any) {
    const code = String(e?.code || e?.responseCode || e?.message || "");
    return NextResponse.json({ ok: false, error: explainSmtpError(code, smtpDetail(e)), code: String(e?.code || e?.responseCode || ""), detail: smtpDetail(e) }, { status: 502 });
  }
}
