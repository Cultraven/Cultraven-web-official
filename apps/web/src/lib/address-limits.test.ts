import { describe, expect, it } from "vitest";
import { createRateLimiter, createSpacer, createTtlCache } from "./address-limits";

describe("createRateLimiter", () => {
  it("allows `max` hits per window, then blocks with a retry-after, then resets", () => {
    let t = 1_000;
    const rl = createRateLimiter({ max: 3, windowMs: 60_000, now: () => t });
    expect(rl.check("a")).toMatchObject({ allowed: true, remaining: 2 });
    expect(rl.check("a")).toMatchObject({ allowed: true, remaining: 1 });
    expect(rl.check("a")).toMatchObject({ allowed: true, remaining: 0 });
    t += 10_000;
    expect(rl.check("a")).toEqual({ allowed: false, retryAfterSec: 50, remaining: 0 });
    expect(rl.check("b").allowed).toBe(true); // keys are independent
    t += 51_000;
    expect(rl.check("a")).toMatchObject({ allowed: true, remaining: 2 });
  });
  it("is bounded: rotating keys can't grow the map without limit", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 60_000, maxKeys: 50 });
    for (let i = 0; i < 500; i++) rl.check(`k${i}`);
    expect(rl.check("k499").allowed).toBe(false); // newest still tracked
    expect(rl.check("k0").allowed).toBe(true); // oldest were evicted
  });
});

describe("createSpacer (Nominatim: at most 1 request / second)", () => {
  it("spaces calls by minGapMs and refuses when the queue is full", async () => {
    let t = 0;
    const slept: number[] = [];
    const sp = createSpacer({ minGapMs: 1100, maxQueue: 2, now: () => t, sleep: async (ms) => { slept.push(ms); } });
    expect(await sp.acquire()).toBe(true); // immediate
    expect(slept).toEqual([]);
    expect(await sp.acquire()).toBe(true); // waits 1100
    expect(await sp.acquire()).toBe(true); // waits 2200
    expect(slept).toEqual([1100, 2200]);
    t = 10_000;
    expect(await sp.acquire()).toBe(true); // slots are in the past -> immediate again
    expect(slept).toEqual([1100, 2200]);
  });
  it("returns false when too many callers are already waiting", async () => {
    const t = 0;
    const releases: (() => void)[] = [];
    const sp = createSpacer({ minGapMs: 1000, maxQueue: 2, now: () => t, sleep: () => new Promise<void>((r) => releases.push(r)) });
    await sp.acquire(); // first goes straight through
    const w1 = sp.acquire(); const w2 = sp.acquire(); // two waiters fill the queue
    expect(await sp.acquire()).toBe(false);
    releases.forEach((r) => r());
    expect(await Promise.all([w1, w2])).toEqual([true, true]);
  });
});

describe("createTtlCache", () => {
  it("expires entries and evicts the oldest beyond max", () => {
    let t = 0;
    const c = createTtlCache<number>({ ttlMs: 1000, max: 2, now: () => t });
    c.set("a", 1); c.set("b", 2);
    expect(c.get("a")).toBe(1);
    c.set("c", 3);
    expect(c.get("a")).toBeUndefined(); // evicted (oldest)
    expect(c.get("b")).toBe(2);
    t = 1001;
    expect(c.get("b")).toBeUndefined(); // expired
    expect(c.size).toBeLessThanOrEqual(2);
  });
});
