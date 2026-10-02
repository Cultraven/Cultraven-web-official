import { describe, it, expect } from "vitest";
import { buildPending, isQuiet, withDismissal, nextToAsk, promptAllowedOn, LATER_DAYS, SKIP_DAYS, type OrderLike } from "./review-pending";

const NOW = Date.UTC(2026, 9, 10, 12);
const DAY = 86_400_000;
const days = (n: number) => new Date(NOW - n * DAY);
const products = new Map([
  ["p1", { slug: "raven-cargo", title: "Raven Cargo", image: "/a.jpg" }],
  ["p2", { slug: "dharma-hoodie", title: "Dharma Hoodie", image: "/b.jpg" }],
  ["p3", { slug: "acid-tee", title: "Acid Tee", image: "/c.jpg" }],
]);
const order = (id: string, status: string, deliveredDaysAgo: number | null, pids: string[]): OrderLike => ({ _id: id, fulfillmentStatus: status, deliveredAt: deliveredDaysAgo === null ? null : days(deliveredDaysAgo), items: pids.map((p) => ({ productId: p, size: "M" })) });

describe("buildPending", () => {
  it("lists delivered, unreviewed items, newest delivery first, with the order number", () => {
    const r = buildPending([order("aaaaaa111111", "delivered", 10, ["p1"]), order("bbbbbb222222", "delivered", 2, ["p2"])], new Set(), products, NOW);
    expect(r.map((x) => x.slug)).toEqual(["dharma-hoodie", "raven-cargo"]);
    expect(r[0]).toMatchObject({ orderNumber: "CR-222222", size: "M", title: "Dharma Hoodie" });
  });
  it("skips orders that are not delivered (processing, cancelled, returned, shipped)", () => {
    const os = ["processing", "shipped", "cancelled", "returned", "return_requested"].map((s, i) => order(`c${i}cccccccccc`, s, 3, ["p1"]));
    expect(buildPending(os, new Set(), products, NOW)).toEqual([]);
  });
  it("skips products already reviewed, deleted products, and duplicates across orders", () => {
    const os = [order("aaaaaa111111", "delivered", 1, ["p1", "p2", "ghost"]), order("bbbbbb222222", "delivered", 5, ["p1", "p3"])];
    const r = buildPending(os, new Set(["p2"]), products, NOW);
    expect(r.map((x) => x.productId)).toEqual(["p1", "p3"]);
  });
  it("only asks about recent deliveries (90 days) and needs a delivery date", () => {
    expect(buildPending([order("a".repeat(12), "delivered", 91, ["p1"])], new Set(), products, NOW)).toEqual([]);
    expect(buildPending([order("a".repeat(12), "delivered", 89, ["p1"])], new Set(), products, NOW)).toHaveLength(1);
    expect(buildPending([order("a".repeat(12), "delivered", null, ["p1"])], new Set(), products, NOW)).toEqual([]);
  });
  it("caps the list", () => {
    const many = new Map(Array.from({ length: 10 }, (_, i) => [`q${i}`, { slug: `s${i}`, title: `T${i}`, image: "" }] as const));
    const r = buildPending([order("a".repeat(12), "delivered", 1, Array.from({ length: 10 }, (_, i) => `q${i}`))], new Set(), many, NOW);
    expect(r).toHaveLength(3);
  });
  it("tolerates junk items", () => {
    const o: OrderLike = { _id: "x", fulfillmentStatus: "delivered", deliveredAt: days(1), items: [{}, { productId: "" }, { productId: "p1" }] as any };
    expect(buildPending([o], new Set(), products, NOW)).toHaveLength(1);
  });
});

describe("dismissal memory", () => {
  it("snoozes for a number of days and forgets afterwards", () => {
    const m = withDismissal({}, "p1", LATER_DAYS, NOW);
    expect(isQuiet(m, "p1", NOW + DAY)).toBe(true);
    expect(isQuiet(m, "p1", NOW + 4 * DAY)).toBe(false);
    expect(isQuiet(m, "p2", NOW)).toBe(false);
  });
  it("'don't ask for this item' lasts much longer than 'later'", () => {
    expect(SKIP_DAYS).toBeGreaterThan(LATER_DAYS * 5);
    expect(isQuiet(withDismissal({}, "p1", SKIP_DAYS, NOW), "p1", NOW + 30 * DAY)).toBe(true);
  });
  it("prunes expired entries when adding a new one and survives bad stored data", () => {
    const old = { p1: NOW - DAY, p9: NOW + DAY } as any;
    const m = withDismissal(old, "p2", 3, NOW);
    expect(Object.keys(m).sort()).toEqual(["p2", "p9"]);
    expect(isQuiet(null, "p1")).toBe(false);
    expect(isQuiet({ p1: "x" } as any, "p1")).toBe(false);
  });
  it("nextToAsk skips snoozed items", () => {
    const items = buildPending([order("a".repeat(12), "delivered", 1, ["p1", "p2"])], new Set(), products, NOW);
    expect(nextToAsk(items, {}, NOW)?.productId).toBe("p1");
    expect(nextToAsk(items, withDismissal({}, "p1", 3, NOW), NOW)?.productId).toBe("p2");
    expect(nextToAsk(items, withDismissal(withDismissal({}, "p1", 3, NOW), "p2", 3, NOW), NOW)).toBeNull();
  });
});

describe("promptAllowedOn", () => {
  it("never interrupts payment, sign-in or admin; fine elsewhere", () => {
    for (const p of ["/checkout", "/checkout?mode=buy-now", "/order-success", "/portal-secure/orders", "/login", "/register", "/forgot-password"]) expect(promptAllowedOn(p)).toBe(false);
    for (const p of ["/", "/collections/all", "/products/x", "/account/orders", "/help"]) expect(promptAllowedOn(p)).toBe(true);
    expect(promptAllowedOn("")).toBe(false);
  });
});
