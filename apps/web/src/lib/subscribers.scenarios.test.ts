// @vitest-environment node
/**
 * Scenario tests for "Notify me" sign-ups and Admin -> Subscribers: a visitor signs up, the visitor and the team are emailed,
 * and the admin can see, add, change, remove and export the people on the list. Database and mail server are replaced by fakes.
 */
import crypto from "crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  rows: [] as any[],
  sent: [] as any[],
  afterJobs: [] as Array<() => unknown>,
  team: ["team@cultraven.com"] as string[],
  mailFail: false,
  dbDown: false,
  raceOnce: false,
}));

const matches = (row: any, q: Record<string, any>): boolean =>
  Object.entries(q).every(([k, v]) => {
    if (k === "$or") return (v as any[]).some((c) => matches(row, c));
    if (v && typeof v === "object" && "$exists" in v) return (row[k] !== undefined) === Boolean(v.$exists);
    if (k === "_id" && v && typeof v === "object" && "$in" in v) return v.$in.map(String).includes(String(row._id));
    if (v && typeof v === "object" && "$ne" in v) return row[k] !== v.$ne;
    if (v && typeof v === "object" && "$regex" in v) return new RegExp(v.$regex).test(String(row[k]));
    return String(row[k]) === String(v);
  });
const view = (r: any) => ({ ...r });
const query = (list: any[]) => {
  let out = list;
  const chain: any = {
    sort: () => { out = [...out].sort((a, b) => +b.createdAt - +a.createdAt); return chain; },
    limit: (n: number) => { out = out.slice(0, n); return chain; },
    lean: async () => out.map(view),
    then: (res: any, rej: any) => Promise.resolve(out.map(view)).then(res, rej),
  };
  return chain;
};

vi.mock("@/lib/db", () => ({ connectToDatabase: async () => { if (h.dbDown) throw new Error("db down"); } }));
vi.mock("@/lib/models/NewsletterSubscriber", () => ({
  NewsletterSubscriber: {
    updateOne: async (q: any, u: any, opts: any = {}) => {
      const row = h.rows.find((r) => matches(r, q));
      if (row) { Object.assign(row, u.$set ?? {}); return { matchedCount: 1, modifiedCount: u.$set ? 1 : 0, upsertedCount: 0 }; }
      if (opts.upsert && u.$setOnInsert) {
        const doc = u.$setOnInsert;
        // the unique indexes on email and canonical: the database refuses a second row (this is what stops two simultaneous sign-ups)
        if (h.raceOnce || h.rows.some((r) => r.email === doc.email || (doc.canonical !== undefined && r.canonical === doc.canonical))) { h.raceOnce = false; throw Object.assign(new Error("E11000 duplicate key error"), { code: 11000 }); }
        h.rows.push({ _id: crypto.randomBytes(12).toString("hex"), createdAt: new Date(Date.now() + h.rows.length), ...u.$setOnInsert }); return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
    },
    find: (q: any) => query(h.rows.filter((r) => matches(r, q))),
    findOne: (q: any) => ({ lean: async () => { const r = h.rows.find((x) => matches(x, q)); return r ? view(r) : null; } }),
    countDocuments: async (q: any) => h.rows.filter((r) => matches(r, q)).length,
    findByIdAndUpdate: (id: string, u: any) => ({ lean: async () => { const r = h.rows.find((x) => x._id === id); if (!r) return null; Object.assign(r, u.$set); return view(r); } }),
    deleteMany: async (q: any) => { const before = h.rows.length; h.rows = h.rows.filter((r) => !matches(r, q)); return { deletedCount: before - h.rows.length }; },
  },
}));
vi.mock("@/lib/mailer", () => ({
  getSmtpSettings: async () => ({ adminEmails: h.team }),
  sendMail: async (m: any) => { if (h.mailFail) throw new Error("smtp down"); h.sent.push(m); return { ok: true }; },
}));
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => { h.afterJobs.push(fn); } }));

import { POST as signup, GET as signupGET } from "../app/api/newsletter/route";
import { GET as adminGET, POST as adminPOST, PATCH as adminPATCH, DELETE as adminDELETE } from "../app/api/admin/subscribers/route";
import { GET as exportGET } from "../app/api/admin/subscribers/export/route";
import { categoryOf } from "./mail-routing";
import { canonicalEmail } from "./subscribers";

const SECRET = "scenario-session-secret-0123456789abcdef";
const cookie = (role: "admin" | "superadmin" | "customer" = "admin", exp = Date.now() + 3_600_000) => {
  const payload = Buffer.from(JSON.stringify({ role, exp, email: "boss@example.com" })).toString("base64url");
  return `cultraven_admin_session=${payload}.${crypto.createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
};
let n = 0;
type Over = { method?: string; body?: unknown; cookie?: string | null; origin?: string | null; ip?: string };
const call = (fn: (r: NextRequest) => Promise<Response>, p: string, over: Over = {}) => {
  const headers: Record<string, string> = { host: "localhost", "content-type": "application/json", "x-forwarded-for": over.ip ?? `10.8.${Math.floor(++n / 250)}.${(n % 250) + 1}` };
  if (over.cookie !== null && over.cookie !== undefined) headers.cookie = over.cookie;
  if (over.origin !== null) headers.origin = over.origin ?? "http://localhost";
  return fn(new NextRequest(`http://localhost${p}`, { method: over.method ?? "GET", headers, body: over.body === undefined ? undefined : JSON.stringify(over.body) }));
};
const visitor = (body: unknown, over: Over = {}) => call(signup, "/api/newsletter", { method: "POST", body, ...over });
const admin = (fn: (r: NextRequest) => Promise<Response>, over: Over = {}, p = "/api/admin/subscribers") => call(fn, p, { cookie: cookie(), ...over });
const flush = async () => { const jobs = h.afterJobs.splice(0); await Promise.all(jobs.map((j) => j())); };
const seed = (email: string, extra: Record<string, unknown> = {}) => { const r = { _id: crypto.randomBytes(12).toString("hex"), email, canonical: canonicalEmail(email), status: "subscribed", interest: "", page: "", source: "website", note: "", createdAt: new Date(Date.now() + h.rows.length), ...extra }; h.rows.push(r); return r; };

beforeEach(() => { h.raceOnce = false; h.rows = []; h.sent.length = 0; h.afterJobs.length = 0; h.team = ["team@cultraven.com"]; h.mailFail = false; h.dbDown = false; vi.stubEnv("SESSION_SECRET", SECRET); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("a visitor signs up", () => {
  it("is saved with what they asked about and where, and both the visitor and the team are emailed", async () => {
    const res = await visitor({ email: "  Fan@Example.com ", interest: "New Drop", page: "/collections/hoodies" });
    expect(res.status).toBe(200);
    expect(h.rows).toHaveLength(1);
    expect(h.rows[0]).toMatchObject({ email: "fan@example.com", interest: "New Drop", page: "/collections/hoodies", source: "website", status: "subscribed" });
    await flush();
    const welcome = h.sent.find((m) => m.kind === "notify-welcome");
    const alert = h.sent.find((m) => m.kind === "notify-admin");
    expect(welcome.to).toBe("fan@example.com");
    expect(welcome.subject).toMatch(/you.re on the list/i);
    expect(welcome.html).toContain("New Drop");
    expect(welcome.text).toMatch(/unsubscribe/i);
    expect(alert.to).toBe("team@cultraven.com");
    expect(alert.html).toContain("fan@example.com");
    expect(alert.html).toContain("/portal-secure/subscribers");
    expect(alert.replyTo).toBe("fan@example.com");
    expect(h.sent).toHaveLength(2);
  });

  it("alerts every admin alert address, and falls back to the public support address when none is set", async () => {
    h.team = ["a@cultraven.com", "b@cultraven.com"];
    await visitor({ email: "one@example.com" });
    await flush();
    expect(h.sent.filter((m) => m.kind === "notify-admin").map((m) => m.to).sort()).toEqual(["a@cultraven.com", "b@cultraven.com"]);
    h.sent.length = 0; h.team = [];
    await visitor({ email: "two@example.com" });
    await flush();
    expect(h.sent.find((m) => m.kind === "notify-admin").to).toMatch(/@cultraven\.com$/);
  });

  it("signing up again answers the same way, stores nothing new and emails nobody again", async () => {
    await visitor({ email: "fan@example.com" });
    await flush();
    h.sent.length = 0;
    const again = await visitor({ email: "FAN@example.com", interest: "Hoodies" });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ message: "Subscribed" });
    await flush();
    expect(h.rows).toHaveLength(1);
    expect(h.rows[0].interest).toBe("");
    expect(h.sent).toHaveLength(0);
  });

  it("someone the team unsubscribed who signs up again is subscribed again (and emailed)", async () => {
    seed("back@example.com", { status: "unsubscribed" });
    await visitor({ email: "back@example.com", interest: "New Drop" });
    await flush();
    expect(h.rows[0].status).toBe("subscribed");
    expect(h.sent.map((m) => m.kind).sort()).toEqual(["notify-admin", "notify-welcome"]);
  });

  it("a mail server problem never loses the sign-up", async () => {
    h.mailFail = true;
    const res = await visitor({ email: "fan@example.com" });
    expect(res.status).toBe(200);
    await expect(flush()).resolves.toBeUndefined();
    expect(h.rows).toHaveLength(1);
  });

  it("refuses a bad address, another website, and too many tries from one place", async () => {
    expect((await visitor({ email: "not-an-email" })).status).toBe(422);
    expect((await visitor({ email: "x@example.com" }, { origin: "https://evil.example" })).status).toBe(403);
    expect(h.rows).toHaveLength(0);
    const ip = "203.0.113.77";
    expect((await visitor({ email: "a@example.com" }, { ip })).status).toBe(200);
    expect((await visitor({ email: "b@example.com" }, { ip })).status).toBe(200);
    expect((await visitor({ email: "c@example.com" }, { ip })).status).toBe(429);
    expect(h.rows).toHaveLength(2);
  });

  it("only keeps a safe page path and a short, single-line interest; markup in them cannot reach the team's email", async () => {
    await visitor({ email: "a@example.com", interest: `<script>alert(1)</script>\r\nBcc: x@evil.com ${"y".repeat(100)}`, page: "https://evil.example/x" });
    await visitor({ email: "b@example.com", page: "//evil.example" });
    await visitor({ email: "c@example.com", page: "/collections/hoodies?utm=1#top" });
    expect(h.rows[0].page).toBe("");
    expect(h.rows[0].interest.length).toBeLessThanOrEqual(60);
    expect(h.rows[0].interest).not.toMatch(/[\r\n]/);
    expect(h.rows[1].page).toBe("");
    expect(h.rows[2].page).toBe("/collections/hoodies");
    await flush();
    for (const m of h.sent) { expect(m.html).not.toContain("<script>"); expect(m.subject).not.toMatch(/[\r\n]/); }
  });

  it("tells the visitor plainly when the database is down, and only answers POST", async () => {
    h.dbDown = true;
    const res = await visitor({ email: "fan@example.com" });
    expect(res.status).toBe(503);
    expect((await res.json()).message).toMatch(/could not save/i);
    expect((await signupGET()).status).toBe(405);
  });
});

describe("no duplicate records", () => {
  it("the same Gmail inbox typed in different ways is one person: one row, one thank-you, one team alert", async () => {
    for (const e of ["jitesh.b@gmail.com", "JiteshB@Gmail.com", "jit.esh.b+promo@gmail.com", "jiteshb+drop@googlemail.com"]) expect((await visitor({ email: e })).status).toBe(200);
    await flush();
    expect(h.rows).toHaveLength(1);
    expect(h.rows[0].email).toBe("jitesh.b@gmail.com"); // the first address they typed is the one we keep and write to
    expect(h.sent.filter((m) => m.kind === "notify-welcome")).toHaveLength(1);
    expect(h.sent.filter((m) => m.kind === "notify-admin")).toHaveLength(1);
  });

  it("other providers are not guessed at: a+tag@example.com and a@example.com stay two people", async () => {
    await visitor({ email: "a+tag@example.com" });
    await visitor({ email: "a@example.com" });
    await visitor({ email: "a.b@example.com" });
    await visitor({ email: "ab@example.com" });
    expect(h.rows.map((r) => r.email).sort()).toEqual(["a+tag@example.com", "a.b@example.com", "a@example.com", "ab@example.com"]);
  });

  it("five sign-ups for the same address at the same instant make one row and one pair of emails", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => visitor({ email: "rush@example.com", interest: "New Drop" })));
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    await flush();
    expect(h.rows).toHaveLength(1);
    expect(h.sent.filter((m) => m.kind === "notify-welcome")).toHaveLength(1);
    expect(h.sent.filter((m) => m.kind === "notify-admin")).toHaveLength(1);
  });

  it("when the database itself refuses a second row (two requests collided), the visitor still sees success and nobody is emailed twice", async () => {
    seed("first@example.com");
    h.raceOnce = true;
    const res = await visitor({ email: "second@example.com" }); // pretend another request saved this person a moment earlier
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Subscribed" });
    await flush();
    expect(h.sent).toHaveLength(0);
    expect(h.rows).toHaveLength(1);
  });

  it("a row saved before the same-person key existed is still recognised, and gets its key", async () => {
    seed("old.timer@gmail.com", { canonical: undefined });
    expect(h.rows[0].canonical).toBeUndefined();
    await visitor({ email: "old.timer@gmail.com" });
    await visitor({ email: "oldtimer+x@gmail.com" });
    await flush();
    expect(h.rows).toHaveLength(1);
    expect(h.sent).toHaveLength(0);
  });

  it("adding by hand refuses someone already on the list, including an alias of their inbox", async () => {
    seed("fan@gmail.com");
    for (const e of ["fan@gmail.com", "FAN@gmail.com", "f.a.n+vip@gmail.com"]) {
      const res = await admin(adminPOST, { method: "POST", body: { email: e } });
      expect(res.status).toBe(409);
      expect((await res.json()).error).toMatch(/already on the list/i);
    }
    expect(h.rows).toHaveLength(1);
  });

  it("someone unsubscribed who signs up again under another spelling of their inbox is subscribed again, not duplicated", async () => {
    seed("back@gmail.com", { status: "unsubscribed" });
    await visitor({ email: "b.ack+again@gmail.com" });
    await flush();
    expect(h.rows).toHaveLength(1);
    expect(h.rows[0].status).toBe("subscribed");
  });
});

describe("admin: who may use the list", () => {
  it("everything needs an admin sign-in (a customer or expired session is not enough)", async () => {
    const calls = [
      () => call(adminGET, "/api/admin/subscribers"),
      () => call(adminPOST, "/api/admin/subscribers", { method: "POST", body: { email: "a@example.com" } }),
      () => call(adminPATCH, "/api/admin/subscribers", { method: "PATCH", body: { id: "a".repeat(24), status: "unsubscribed" } }),
      () => call(adminDELETE, "/api/admin/subscribers", { method: "DELETE", body: { ids: ["a".repeat(24)] } }),
      () => call(exportGET, "/api/admin/subscribers/export"),
    ];
    for (const c of calls) expect((await c()).status).toBe(401);
    expect((await admin(adminGET, { cookie: cookie("customer") })).status).toBe(401);
    expect((await admin(adminGET, { cookie: cookie("admin", Date.now() - 1000) })).status).toBe(401);
  });

  it("changes only count when they come from the admin site itself", async () => {
    const r = seed("a@example.com");
    expect((await admin(adminPOST, { method: "POST", body: { email: "x@example.com" }, origin: "https://evil.example" })).status).toBe(403);
    expect((await admin(adminPATCH, { method: "PATCH", body: { id: r._id, status: "unsubscribed" }, origin: "https://evil.example" })).status).toBe(403);
    expect((await admin(adminDELETE, { method: "DELETE", body: { ids: [r._id] }, origin: "https://evil.example" })).status).toBe(403);
    expect(h.rows).toHaveLength(1);
    expect(h.rows[0].status).toBe("subscribed");
  });
});

describe("admin: add, see, change, remove", () => {
  it("adds someone by hand (no email is sent to them) and shows them in the list", async () => {
    const res = await admin(adminPOST, { method: "POST", body: { email: " Friend@Example.com ", interest: "Hoodies", note: "Met at the pop-up" } });
    expect(res.status).toBe(201);
    const { subscriber } = await res.json();
    expect(subscriber).toMatchObject({ email: "friend@example.com", interest: "Hoodies", note: "Met at the pop-up", source: "admin", status: "subscribed" });
    await flush();
    expect(h.sent).toHaveLength(0);
    const list = await (await admin(adminGET)).json();
    expect(list.subscribers.map((s: any) => s.email)).toEqual(["friend@example.com"]);
    expect(list.counts).toEqual({ all: 1, subscribed: 1, unsubscribed: 0 });
  });

  it("refuses an address that is already on the list or not an email", async () => {
    seed("dup@example.com");
    const dup = await admin(adminPOST, { method: "POST", body: { email: "DUP@example.com" } });
    expect(dup.status).toBe(409);
    expect((await dup.json()).error).toMatch(/already on the list/i);
    expect((await admin(adminPOST, { method: "POST", body: { email: "nope" } })).status).toBe(422);
    expect(h.rows).toHaveLength(1);
  });

  it("lists newest first with counts, and can search (a search is not a pattern) and filter by status", async () => {
    seed("old@example.com");
    seed("a.b@example.com", { interest: "New Drop" });
    seed("axb@example.com", { status: "unsubscribed" });
    const all = await (await admin(adminGET)).json();
    expect(all.subscribers.map((s: any) => s.email)).toEqual(["axb@example.com", "a.b@example.com", "old@example.com"]);
    expect(all.counts).toEqual({ all: 3, subscribed: 2, unsubscribed: 1 });
    const dot = await (await admin(adminGET, {}, "/api/admin/subscribers?q=a.b")).json();
    expect(dot.subscribers.map((s: any) => s.email)).toEqual(["a.b@example.com"]); // "." is a dot, not "any character"
    const unsub = await (await admin(adminGET, {}, "/api/admin/subscribers?status=unsubscribed")).json();
    expect(unsub.subscribers.map((s: any) => s.email)).toEqual(["axb@example.com"]);
    expect((await (await admin(adminGET, {}, "/api/admin/subscribers?status=subscribed")).json()).subscribers).toHaveLength(2);
  });

  it("unsubscribes and resubscribes, and keeps a private note", async () => {
    const r = seed("a@example.com");
    let res = await admin(adminPATCH, { method: "PATCH", body: { id: r._id, status: "unsubscribed" } });
    expect(res.status).toBe(200);
    expect(h.rows[0].status).toBe("unsubscribed");
    res = await admin(adminPATCH, { method: "PATCH", body: { id: r._id, status: "subscribed", note: "  asked\r\nto come back  " } });
    expect((await res.json()).subscriber).toMatchObject({ status: "subscribed", note: "asked to come back" });
    expect((await (await admin(adminGET)).json()).counts).toEqual({ all: 1, subscribed: 1, unsubscribed: 0 });
  });

  it("refuses an empty change, a bad status, a bad id and a person who is gone", async () => {
    const r = seed("a@example.com");
    expect((await admin(adminPATCH, { method: "PATCH", body: { id: r._id } })).status).toBe(422);
    expect((await admin(adminPATCH, { method: "PATCH", body: { id: r._id, status: "banned" } })).status).toBe(422);
    expect((await admin(adminPATCH, { method: "PATCH", body: { id: "not-an-id", status: "unsubscribed" } })).status).toBe(422);
    expect((await admin(adminPATCH, { method: "PATCH", body: { id: "b".repeat(24), status: "unsubscribed" } })).status).toBe(404);
    expect(h.rows[0].status).toBe("subscribed");
  });

  it("removes one or several people and reports how many went", async () => {
    const a = seed("a@example.com"); const b = seed("b@example.com"); const c = seed("c@example.com");
    let res = await admin(adminDELETE, { method: "DELETE", body: { ids: [a._id] } });
    expect(await res.json()).toEqual({ success: true, deleted: 1 });
    res = await admin(adminDELETE, { method: "DELETE", body: { ids: [b._id, c._id, b._id] } });
    expect((await res.json()).deleted).toBe(2);
    expect(h.rows).toHaveLength(0);
    res = await admin(adminDELETE, { method: "DELETE", body: { ids: [a._id] } });
    expect((await res.json()).deleted).toBe(0);
  });

  it("refuses to remove with a bad or oversized request", async () => {
    seed("a@example.com");
    expect((await admin(adminDELETE, { method: "DELETE", body: { ids: [] } })).status).toBe(422);
    expect((await admin(adminDELETE, { method: "DELETE", body: { ids: ["x"] } })).status).toBe(422);
    expect((await admin(adminDELETE, { method: "DELETE", body: { ids: Array.from({ length: 101 }, () => "a".repeat(24)) } })).status).toBe(422);
    expect((await admin(adminDELETE, { method: "DELETE", body: { ids: ["a".repeat(24)], everyone: true } })).status).toBe(422);
    expect(h.rows).toHaveLength(1);
  });

  it("reports a database problem instead of pretending it worked", async () => {
    h.dbDown = true;
    expect((await admin(adminGET)).status).toBe(500);
    expect((await admin(adminPOST, { method: "POST", body: { email: "a@example.com" } })).status).toBe(500);
    expect((await admin(adminDELETE, { method: "DELETE", body: { ids: ["a".repeat(24)] } })).status).toBe(500);
  });
});

describe("admin: download the list", () => {
  it("gives a CSV file with a header row and every person", async () => {
    seed("a@example.com", { interest: "New Drop", page: "/collections/hoodies", note: "VIP, early" });
    const res = await admin(exportGET, {}, "/api/admin/subscribers/export");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="cultraven-subscribers-\d{4}-\d{2}-\d{2}\.csv"/);
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]); // byte-order mark so Excel reads it as UTF-8
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes).replace(/^﻿/, "");
    expect(text.startsWith("Email,Status,Interested in")).toBe(true);
    expect(text).toContain('a@example.com,subscribed,New Drop,/collections/hoodies,website,"VIP, early",');
  });

  it("a cell that looks like a spreadsheet formula is defused", async () => {
    seed("=HYPERLINK(\"http://evil\")@example.com", { note: "+cmd|' /C calc'!A0" });
    const text = await (await admin(exportGET, {}, "/api/admin/subscribers/export")).text();
    expect(text).not.toMatch(/(^|,)=HYPERLINK/m);
    expect(text).toContain("'=HYPERLINK");
    expect(text).toContain("'+cmd");
  });
});

describe("wiring", () => {
  const web = path.resolve(__dirname, "../..");
  it("the sign-up emails use their own mail category, so the owner can pick the mailbox for them", () => {
    expect(categoryOf("notify-welcome")?.id).toBe("notify");
    expect(categoryOf("notify-admin")?.id).toBe("notify");
  });
  it("Subscribers is in the admin sidebar and has a page", () => {
    expect(fs.readFileSync(path.join(web, "src/components/admin/AdminShell.tsx"), "utf8")).toContain("/portal-secure/subscribers");
    expect(fs.existsSync(path.join(web, "src/app/(admin)/portal-secure/subscribers/page.tsx"))).toBe(true);
  });
});
