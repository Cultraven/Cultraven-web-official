import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { EmailLog } from "@/lib/models/Setting";
import { getMailRouting, getSmtpSettings, parseEmailList, saveAlertEmails, saveMailRouting } from "@/lib/mailer";
import { MAIL_CATEGORIES, MAIL_PROFILES, PROFILE_LABEL, categoryOf, chosenProfile, cleanRouting, isProfile, pickProfile, type MailProfile } from "@/lib/mail-routing";
import { clientIp, isSameOrigin, rateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };
const DAYS = 30;

/**
 * GET — everything the "Which mailbox sends what" panel shows: the two mailboxes (set up or not), and for every kind of email who
 * gets it, what triggers it, which mailbox it is set to use, which one is ACTUALLY in use right now, and how many were sent
 * in the last 30 days. Admin-only; never returns a password.
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [routing, ...boxes] = await Promise.all([getMailRouting(), ...MAIL_PROFILES.map((p) => getSmtpSettings(p))]);
    const byProfile = new Map<MailProfile, Awaited<ReturnType<typeof getSmtpSettings>>>(MAIL_PROFILES.map((p, i) => [p, boxes[i]]));
    const usable = new Set(MAIL_PROFILES.filter((p) => byProfile.get(p)?.enabled));

    // What was really sent in the last 30 days, per kind of email
    await connectToDatabase();
    const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000);
    const rows = (await EmailLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: { kind: "$kind", status: "$status" }, n: { $sum: 1 }, last: { $max: "$createdAt" }, lastFrom: { $last: "$from" } } },
    ])) as { _id: { kind: string; status: string }; n: number; last: Date; lastFrom?: string }[];
    const stats = new Map<string, { sent: number; failed: number; skipped: number; lastAt: string | null; lastFrom: string }>();
    for (const r of rows) {
      const c = categoryOf(r._id.kind); if (!c) continue;
      const s = stats.get(c.id) ?? { sent: 0, failed: 0, skipped: 0, lastAt: null, lastFrom: "" };
      if (r._id.status === "sent" || r._id.status === "failed" || r._id.status === "skipped") s[r._id.status] += r.n;
      if (r._id.status === "sent" && (!s.lastAt || r.last.toISOString() > s.lastAt)) { s.lastAt = r.last.toISOString(); s.lastFrom = r.lastFrom ?? ""; }
      stats.set(c.id, s);
    }

    const categories = MAIL_CATEGORIES.map((c) => {
      const chosen = chosenProfile(c.sample, routing);
      const pick = pickProfile(c.sample, routing, usable);
      return {
        id: c.id, label: c.label, audience: c.audience, when: c.when, examples: c.examples, defaultProfile: c.defaultProfile,
        chosen, using: pick?.profile ?? null, usingFrom: pick ? byProfile.get(pick.profile)?.fromEmail ?? null : null, fellBack: !!pick?.fellBack,
        stats: stats.get(c.id) ?? { sent: 0, failed: 0, skipped: 0, lastAt: null, lastFrom: "" },
      };
    });

    return NextResponse.json({
      days: DAYS,
      profiles: MAIL_PROFILES.map((p) => { const s = byProfile.get(p); return { id: p, label: PROFILE_LABEL[p], configured: !!s, enabled: !!s?.enabled, fromEmail: s?.fromEmail ?? "", host: s?.host ?? "" }; }),
      categories,
      adminEmails: byProfile.get("orders")?.adminEmails ?? [],
    }, { headers: NO_STORE });
  } catch (e) {
    console.error("[mail-routing] load failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not load the mailbox settings" }, { status: 500 });
  }
}

const Body = z.object({ routing: z.record(z.string(), z.string()).optional(), adminEmails: z.string().max(1000).optional() });

/** PUT { routing?, adminEmails? } — choose the mailbox for each kind of email and/or change who receives the team alerts. */
export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(`mail-routing:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: retryHeaders(rl) });
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const p = Body.safeParse(raw);
  if (!p.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  try {
    if (p.data.routing) {
      const ids = new Set(MAIL_CATEGORIES.map((c) => c.id));
      for (const [cat, prof] of Object.entries(p.data.routing)) {
        if (!ids.has(cat)) return NextResponse.json({ error: `Unknown kind of email: ${cat}` }, { status: 422 });
        if (!isProfile(prof)) return NextResponse.json({ error: "Unknown mailbox" }, { status: 422 });
        if (!(await getSmtpSettings(prof))) return NextResponse.json({ error: `Set up the ${PROFILE_LABEL[prof]} first, then choose it.` }, { status: 422 });
      }
      await saveMailRouting(cleanRouting(p.data.routing));
    }
    if (p.data.adminEmails !== undefined) {
      const ok = await saveAlertEmails(parseEmailList(p.data.adminEmails));
      if (!ok) return NextResponse.json({ error: "Save the Orders mailbox first, then set who receives the alerts." }, { status: 422 });
    }
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (e) {
    console.error("[mail-routing] save failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
