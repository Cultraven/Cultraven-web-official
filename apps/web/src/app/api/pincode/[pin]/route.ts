import { NextResponse } from "next/server";
import { PINCODE_RE, canonicalState, normalizeText } from "@/lib/address-validation";
import { createRateLimiter, createTtlCache } from "@/lib/address-limits";
import { apiError, clientIp } from "@/lib/address-api";

export const dynamic = "force-dynamic";

type Hit = { city: string; state: string } | { notFound: true };
const cache = createTtlCache<Hit>({ ttlMs: 24 * 60 * 60 * 1000, max: 3000 });
const missCache = createTtlCache<true>({ ttlMs: 30 * 60 * 1000, max: 1000 });
const limiter = createRateLimiter({ max: 60, windowMs: 60_000 });

/**
 * GET /api/pincode/411001 — city/district + state for an Indian pincode (India Post data via api.postalpincode.in).
 * Best-effort: `{}` when the upstream is unavailable, `{ notFound: true }` when India Post has no such pincode.
 * The pincode is validated as exactly six digits before it is ever placed in the upstream URL, so this cannot be steered elsewhere.
 */
export async function GET(req: Request, ctx: { params: Promise<{ pin: string }> }) {
  const { pin } = await ctx.params;
  if (typeof pin !== "string" || !PINCODE_RE.test(pin)) return apiError(400, "Invalid pincode");

  const rl = limiter.check(clientIp(req));
  if (!rl.allowed) return apiError(429, "Too many requests", {}, { "Retry-After": String(rl.retryAfterSec) });

  const headers = { "Cache-Control": "private, max-age=3600" };
  const hit = cache.get(pin);
  if (hit) return NextResponse.json(hit, { headers });
  if (missCache.get(pin)) return NextResponse.json({ notFound: true }, { headers });

  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(3500), cache: "no-store" });
    if (r.ok) {
      const j = (await r.json()) as any;
      const first = Array.isArray(j) ? j[0] : null;
      const po = Array.isArray(first?.PostOffice) ? first.PostOffice[0] : null;
      if (first?.Status === "Success" && typeof po?.District === "string" && typeof po?.State === "string") {
        const city = normalizeText(po.District).slice(0, 60);
        const state = canonicalState(po.State, pin) ?? normalizeText(po.State).slice(0, 60);
        const v = { city, state };
        cache.set(pin, v);
        return NextResponse.json(v, { headers });
      }
      if (first?.Status === "Error" && /no records/i.test(String(first?.Message ?? ""))) {
        missCache.set(pin, true);
        return NextResponse.json({ notFound: true }, { headers });
      }
    }
  } catch { /* fall through: the shopper just types it */ }
  return NextResponse.json({});
}
