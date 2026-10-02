/**
 * Small in-process building blocks for the address helper routes (pincode lookup, reverse geocoding):
 * a fixed-window rate limiter, a spacing gate (Nominatim allows at most 1 request/second per application) and a TTL cache.
 * Pure and clock-injectable so they are unit-tested. In-memory means per server instance — fine for a single Node process;
 * swap for Redis/Upstash if the app is ever scaled horizontally.
 */

export interface RateDecision { allowed: boolean; retryAfterSec: number; remaining: number }

export function createRateLimiter({ max, windowMs, maxKeys = 5000, now = Date.now }: { max: number; windowMs: number; maxKeys?: number; now?: () => number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string): RateDecision {
      const t = now();
      if (hits.size >= maxKeys) {
        for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
        while (hits.size >= maxKeys) hits.delete(hits.keys().next().value as string); // oldest first
      }
      const e = hits.get(key);
      if (!e || e.resetAt <= t) {
        hits.set(key, { count: 1, resetAt: t + windowMs });
        return { allowed: true, retryAfterSec: 0, remaining: max - 1 };
      }
      if (e.count >= max) return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((e.resetAt - t) / 1000)), remaining: 0 };
      e.count++;
      return { allowed: true, retryAfterSec: 0, remaining: max - e.count };
    },
  };
}

/**
 * Reserves one upstream slot per `minGapMs`. `acquire()` resolves true once it is this caller's turn, or false immediately when
 * more than `maxQueue` callers are already waiting (caller should answer "busy, try again").
 */
export function createSpacer({ minGapMs, maxQueue, now = Date.now, sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) }:
  { minGapMs: number; maxQueue: number; now?: () => number; sleep?: (ms: number) => Promise<void> }) {
  let nextSlot = 0;
  let waiting = 0;
  return {
    async acquire(): Promise<boolean> {
      const t = now();
      const start = Math.max(t, nextSlot);
      const wait = start - t;
      if (wait > 0 && waiting >= maxQueue) return false;
      nextSlot = start + minGapMs;
      if (wait > 0) {
        waiting++;
        try { await sleep(wait); } finally { waiting--; }
      }
      return true;
    },
  };
}

/** Insertion-ordered TTL cache with a hard size cap (oldest entries are evicted first). */
export function createTtlCache<V>({ ttlMs, max, now = Date.now }: { ttlMs: number; max: number; now?: () => number }) {
  const m = new Map<string, { v: V; exp: number }>();
  return {
    get(key: string): V | undefined {
      const e = m.get(key);
      if (!e) return undefined;
      if (e.exp <= now()) { m.delete(key); return undefined; }
      return e.v;
    },
    set(key: string, v: V) {
      m.delete(key);
      m.set(key, { v, exp: now() + ttlMs });
      while (m.size > max) m.delete(m.keys().next().value as string);
    },
    get size() { return m.size; },
  };
}
