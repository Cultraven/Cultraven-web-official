/**
 * GET /api/geocode/reverse?lat=..&lng=..  — "Use my current location" for the address forms.
 *
 * The browser cannot call OpenStreetMap directly (CSP connect-src is 'self'), so it asks us. We:
 *   1. require a signed-in customer (both address forms are signed-in only) + per-user and per-IP rate limits (20/min);
 *   2. validate lat/lng as plain decimal numbers in range and inside India's bounding box (else a friendly 4xx);
 *   3. call Nominatim reverse (jsonv2, addressdetails) with an identifying User-Agent, a 4 s timeout, a >=1.1 s global gap
 *      between upstream calls (Nominatim policy: max 1 request/second) and an in-memory cache on a ~11 m grid;
 *   4. map the result to {pincode, city, state, line1, area} for the form to pre-fill (the shopper still confirms it).
 * Coordinates are never stored and never logged. Responses are `Cache-Control: no-store`.
 * Map data (c) OpenStreetMap contributors, ODbL — the form shows the attribution.
 */
import { NextResponse } from "next/server";
import { customerFromRequest } from "@/lib/customer-auth";
import { apiError, clientIp } from "@/lib/address-api";
import { createRateLimiter, createSpacer, createTtlCache } from "@/lib/address-limits";
import { coordCacheKey, mapNominatimToAddress, parseCoordinates, type GeocodeMapResult } from "@/lib/address-geocode";

export const dynamic = "force-dynamic";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "CultravenStore/1.0 (contact via site)";
const MAX_UPSTREAM_CHARS = 20_000;

const limiter = createRateLimiter({ max: 20, windowMs: 60_000 });
const spacer = createSpacer({ minGapMs: 1100, maxQueue: 3 });
const cache = createTtlCache<GeocodeMapResult>({ ttlMs: 60 * 60 * 1000, max: 500 });

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const me = customerFromRequest(req);
  if (!me) return apiError(401, "Please sign in to use your location", {}, NO_STORE);

  const u = new URL(req.url);
  const lats = u.searchParams.getAll("lat"), lngs = u.searchParams.getAll("lng");
  if (lats.length !== 1 || lngs.length !== 1) return apiError(400, "Invalid coordinates", {}, NO_STORE);

  // Validate before spending a rate-limit token or any upstream budget.
  const c = parseCoordinates(lats[0], lngs[0]);
  if (!c.ok) return c.code === "OUTSIDE_INDIA" ? apiError(422, c.message, { code: "OUTSIDE_INDIA" }, NO_STORE) : apiError(400, c.message, {}, NO_STORE);

  const rl = [limiter.check(`u:${me.userId}`), limiter.check(`ip:${clientIp(req)}`)].find((d) => !d.allowed);
  if (rl) return apiError(429, "Too many location requests — please wait a minute.", { code: "RATE_LIMITED" }, { ...NO_STORE, "Retry-After": String(rl.retryAfterSec) });

  const key = coordCacheKey(c.lat, c.lng);
  let mapped = cache.get(key);

  if (!mapped) {
    if (!(await spacer.acquire())) return apiError(503, "Location lookup is busy — please try again in a moment.", { code: "BUSY" }, { ...NO_STORE, "Retry-After": "3" });
    try {
      const qs = new URLSearchParams({ format: "jsonv2", addressdetails: "1", zoom: "18", "accept-language": "en", lat: c.lat.toFixed(5), lon: c.lng.toFixed(5) });
      const r = await fetch(`${NOMINATIM_URL}?${qs}`, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const text = await r.text();
      if (text.length > MAX_UPSTREAM_CHARS) throw new Error("upstream too large");
      mapped = mapNominatimToAddress(JSON.parse(text));
      cache.set(key, mapped);
    } catch (e) {
      // Log only the error class — never coordinates or upstream bodies.
      console.error("[geocode] reverse lookup failed:", e instanceof Error ? e.name : "error");
      const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      return apiError(timedOut ? 504 : 502, "Location lookup is unavailable right now — please enter your address manually.", { code: "UPSTREAM" }, NO_STORE);
    }
  }

  if (!mapped.ok) {
    return mapped.code === "OUTSIDE_INDIA"
      ? apiError(422, mapped.message, { code: "OUTSIDE_INDIA" }, NO_STORE)
      : apiError(404, mapped.message, { code: "NOT_FOUND" }, NO_STORE);
  }
  return NextResponse.json(mapped.address, { headers: NO_STORE });
}
