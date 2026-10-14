import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSmtpSettings } from "@/lib/mailer";
import { checkMailDns, domainOf } from "@/lib/mail-dns";
import { MAIL_PROFILES } from "@/lib/mail-routing";
import { BUSINESS } from "@/lib/business";

export const dynamic = "force-dynamic";

/**
 * GET — are SPF, DKIM and DMARC set up for every domain the saved mailboxes send from (usually just one)? Admin-only; reads
 * public DNS only.
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const boxes = (await Promise.all(MAIL_PROFILES.map((p) => getSmtpSettings(p)))).filter((s): s is NonNullable<typeof s> => !!s);
  if (!boxes.length) return NextResponse.json({ error: "Save your SMTP settings first" }, { status: 400 });
  const seen = new Set<string>();
  const unique = boxes.filter((s) => { const d = domainOf(s.fromEmail); if (!d || seen.has(d)) return false; seen.add(d); return true; });
  if (!unique.length) return NextResponse.json({ error: "Save a valid From email first" }, { status: 400 });
  try {
    const reports = await Promise.all(unique.map((s) => checkMailDns(s.fromEmail, s.host, BUSINESS.supportEmail)));
    return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Couldn't reach the DNS servers just now. Try again in a minute." }, { status: 502 });
  }
}
