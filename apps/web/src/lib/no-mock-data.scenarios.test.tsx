// @vitest-environment node
/** No fake data: ratings come from real reviews, the newsletter really stores addresses, pages with nothing real say "coming soon". */
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ subs: new Map<string, any>(), dbDown: false, reviews: [] as { slug: string; rating: number }[], cms: {} as Record<string, any> }));
vi.mock("@/lib/db", () => ({ connectToDatabase: async () => { if (h.dbDown) throw new Error("db down"); } }));
vi.mock("@/lib/models/NewsletterSubscriber", () => ({
  NewsletterSubscriber: { updateOne: async (q: any, u: any) => { if (!h.subs.has(q.email)) h.subs.set(q.email, u.$setOnInsert); } },
}));
vi.mock("@/lib/models/Review", () => ({
  Review: {
    aggregate: async (pipe: any[]) => {
      const slugs: string[] = pipe[0].$match.slug.$in;
      const by = new Map<string, number[]>();
      for (const r of h.reviews) if (slugs.includes(r.slug)) by.set(r.slug, [...(by.get(r.slug) ?? []), r.rating]);
      return [...by].map(([_id, v]) => ({ _id, avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }));
    },
  },
}));
vi.mock("@/lib/cms/server", () => ({ getCmsSection: async (k: string) => (h.cms[k] ? { state: "ok", data: h.cms[k] } : { state: "empty", data: null }) }));
vi.mock("@/components/common/PageHero", () => ({ PageHero: () => null }));
vi.mock("@/components/common/CmsImage", () => ({ default: () => null }));
vi.mock("next/link", () => ({ default: () => null }));

import { applyReviewStats } from "./review-stats";
import { POST as subscribe } from "../app/api/newsletter/route";
import JournalPage from "../app/(shop)/pages/journal/page";
import LookbookPage from "../app/(shop)/pages/lookbook/page";
import TrackOrderPage from "../app/(shop)/pages/track-order/page";
import { ComingSoon } from "../components/ComingSoon";

let n = 0;
const post = (email: unknown) => subscribe(new NextRequest("http://localhost/api/newsletter", { method: "POST", headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-forwarded-for": `10.8.${Math.floor(++n / 250)}.${n % 250 + 1}` }, body: JSON.stringify({ email }) }));
const P = (slug: string, rating = 5, reviewCount = 248) => ({ slug, rating, reviewCount });

beforeEach(() => { h.subs.clear(); h.dbDown = false; h.reviews = []; h.cms = {}; vi.spyOn(console, "error").mockImplementation(() => {}); });

describe("ratings are the real ones", () => {
  it("a product with no reviews shows none, whatever number was typed into the product", async () => {
    const out = await applyReviewStats([P("tee"), P("hoodie")]);
    expect(out.map((p) => [p.rating, p.reviewCount])).toEqual([[0, 0], [0, 0]]);
  });
  it("uses the average and the count of the reviews customers actually wrote", async () => {
    h.reviews = [{ slug: "hoodie", rating: 5 }, { slug: "hoodie", rating: 4 }, { slug: "hoodie", rating: 4 }, { slug: "cargo", rating: 3 }];
    const out = await applyReviewStats([P("hoodie"), P("cargo"), P("tee")]);
    expect(out.map((p) => [p.slug, p.rating, p.reviewCount])).toEqual([["hoodie", 4.3, 3], ["cargo", 3, 1], ["tee", 0, 0]]);
  });
  it("an empty list needs no database call", async () => {
    h.dbDown = true;
    expect(await applyReviewStats([])).toEqual([]);
  });
});

describe("the newsletter really stores addresses", () => {
  it("saves a new address (lower-cased) and answers 'Subscribed'", async () => {
    const r = await post("Fan@Example.COM");
    expect(r.status).toBe(200);
    expect((await r.json()).message).toBe("Subscribed");
    expect([...h.subs.keys()]).toEqual(["fan@example.com"]);
  });
  it("the same address twice is stored once and answers the same way", async () => {
    await post("a@example.com");
    const again = await post("a@example.com");
    expect(again.status).toBe(200);
    expect(h.subs.size).toBe(1);
  });
  it("refuses a bad address, and says so honestly when the database is down (no fake 'Subscribed')", async () => {
    expect((await post("not-an-email")).status).toBe(422);
    expect(h.subs.size).toBe(0);
    h.dbDown = true;
    const r = await post("b@example.com");
    expect(r.status).toBe(503);
    expect((await r.json()).message).toMatch(/could not save/i);
  });
});

describe("pages with nothing real to show say 'coming soon'", () => {
  it("Journal with no articles", async () => {
    h.cms["page.journal"] = { items: [] };
    const el: any = await JournalPage({ searchParams: Promise.resolve({}) });
    expect(el.type).toBe(ComingSoon);
    expect(el.props.page).toBe("The Journal");
  });
  it("Journal with articles is the real page; Lookbook with no looks says coming soon", async () => {
    h.cms["page.journal"] = { items: [{ id: "a", title: "Real", category: "STYLE", image: "https://x/y.jpg", excerpt: "e", slug: "real", active: true }] };
    expect(((await JournalPage({ searchParams: Promise.resolve({}) })) as any).type).not.toBe(ComingSoon);
    h.cms["page.lookbook"] = { items: [] };
    const el: any = await LookbookPage();
    expect(el.type).toBe(ComingSoon);
    expect(el.props.page).toBe("Lookbook");
  });
  it("Track order no longer shows invented order data: it points to Account -> Orders and the order emails", () => {
    const el: any = TrackOrderPage();
    expect(el.type).toBe(ComingSoon);
    expect(el.props.description).toMatch(/Account/);
    expect(el.props.showNotify).toBe(false);
  });
});
