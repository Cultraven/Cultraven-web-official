/**
 * Request-hardening helpers shared by the API routes (server-only, zero dependencies).
 *
 *  - hasMongoOperators / assertPlainJson / parseJsonBody: stop NoSQL-operator injection ({"$ne":null}),
 *    prototype pollution (__proto__ / constructor / prototype keys) and oversized or non-JSON bodies
 *    BEFORE a payload reaches zod or Mongoose.
 *  - escapeRegex: the only safe way to put user text inside a $regex / RegExp.
 *  - clientIp + rateLimit: a small in-memory sliding-window limiter (per server instance; swap for
 *    Redis/Upstash if the site ever runs on several instances).
 *  - isSameOrigin: cheap CSRF defence-in-depth for cookie-authenticated, state-changing requests.
 *
 * Typical route:
 *   if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   const rl = rateLimit(`contact:${clientIp(req)}`, 5, 60_000);
 *   if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
 *   const body = await parseJsonBody(req, 8 * 1024);
 *   if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
 *   const parsed = Schema.safeParse(body.data);   // zod (with max lengths) comes next
 */

// ─── NoSQL operator / prototype-pollution detection ─────────────────────────────────────────────

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 32;
const MAX_NODES = 50_000;

/** An error carrying the HTTP status a route should answer with. */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * True when any object key anywhere in a parsed JSON value could be interpreted by MongoDB or JavaScript:
 * keys starting with "$" (operators such as $ne/$gt/$where), keys containing "." (path traversal in
 * updates), NUL bytes, or __proto__ / constructor / prototype. Absurdly deep or huge structures are
 * treated as hostile too. Only KEYS are inspected: plain string values (even "$ne") are harmless.
 */
export function hasMongoOperators(value: unknown): boolean {
  let nodes = 0;
  const walk = (v: unknown, depth: number): boolean => {
    if (v === null || typeof v !== "object") return false;
    if (depth > MAX_DEPTH || ++nodes > MAX_NODES) return true;
    if (Array.isArray(v)) {
      for (const item of v) if (walk(item, depth + 1)) return true;
      return false;
    }
    for (const key of Object.keys(v as object)) {
      if (key.startsWith("$") || key.includes(".") || key.includes("\0") || FORBIDDEN_KEYS.has(key)) return true;
      if (walk((v as Record<string, unknown>)[key], depth + 1)) return true;
    }
    return false;
  };
  return walk(value, 0);
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/** Error message when `body` is not a plain JSON object or carries operator / prototype keys; otherwise null. */
export function plainJsonError(body: unknown): string | null {
  if (!isPlainObject(body)) return "Invalid request body";
  if (hasMongoOperators(body)) return "Invalid request";
  return null;
}

/** Throws HttpError(400) when `body` is not a plain operator-free JSON object. */
export function assertPlainJson(body: unknown): asserts body is Record<string, unknown> {
  const err = plainJsonError(body);
  if (err) throw new HttpError(400, err);
}

export type ParsedBody =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: 400 | 413 | 415; error: string };

/**
 * Reads and parses a JSON request body safely:
 *  - requires Content-Type: application/json (a cross-site form or fetch cannot send that without a CORS
 *    preflight, which this site never grants: this alone defeats "simple request" CSRF),
 *  - enforces a byte cap while streaming (a lying or missing Content-Length cannot bypass it),
 *  - rejects non-objects, "$"/"." keys and __proto__/constructor/prototype keys.
 */
export async function parseJsonBody(req: Request, maxBytes = 64 * 1024, opts: { requireJson?: boolean } = {}): Promise<ParsedBody> {
  if (opts.requireJson !== false) {
    const type = (req.headers.get("content-type") ?? "").toLowerCase();
    if (!type.startsWith("application/json")) return { ok: false, status: 415, error: "Content-Type must be application/json" };
  }
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413, error: "Request body too large" };

  let text: string;
  try {
    const reader = req.body?.getReader();
    if (!reader) return { ok: false, status: 400, error: "Invalid request body" };
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, status: 413, error: "Request body too large" };
      }
      chunks.push(value);
    }
    text = new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  } catch {
    return { ok: false, status: 400, error: "Invalid request body" };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }
  const err = plainJsonError(data);
  if (err) return { ok: false, status: 400, error: err };
  return { ok: true, data: data as Record<string, unknown> };
}

// ─── Small validators ───────────────────────────────────────────────────────────────────────────

/** Strict 24-hex ObjectId check (mongoose.isValidObjectId also accepts any 12-character string). */
export function isObjectIdString(v: unknown): v is string {
  return typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);
}

/** Own-property check that ignores the prototype chain: SECTION_MAP["constructor"] must not "exist". */
export function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Escapes user text for safe use inside a RegExp / $regex (prevents injection and catastrophic backtracking). */
export function escapeRegex(s: string): string {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Removes control characters (CR/LF included unless `keepNewlines`) so a value can't forge log lines or mail headers. */
export function stripControlChars(s: string, keepNewlines = false): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(keepNewlines ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, keepNewlines ? "" : " ").trim();
}

/** Removes anything that looks like an HTML tag. React escapes output anyway; this is defence in depth for stored text. */
export function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

// ─── Client IP ──────────────────────────────────────────────────────────────────────────────────

const IP_SHAPE = /^[0-9a-fA-F:.]{2,45}$/;

/**
 * Best-effort client address for rate limiting. X-Forwarded-For is client-controlled, so only the entry
 * appended by OUR proxy is trusted: TRUSTED_PROXY_HOPS (default 1) counts from the right. Set it to 0 to ignore
 * the header, or set CLIENT_IP_HEADER (e.g. "cf-connecting-ip") when a CDN supplies a verified header.
 * Returns "unknown" when nothing usable is present.
 */
export function clientIp(req: Request, env: Record<string, string | undefined> = process.env): string {
  const pick = (raw: string | null | undefined): string | null => {
    const v = (raw ?? "").trim();
    return IP_SHAPE.test(v) ? v : null;
  };
  const custom = env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (custom) {
    const ip = pick(req.headers.get(custom));
    if (ip) return ip;
  }
  const hops = Number.parseInt(env.TRUSTED_PROXY_HOPS ?? "1", 10);
  const trusted = Number.isFinite(hops) ? Math.max(0, hops) : 1;
  if (trusted > 0) {
    const parts = (req.headers.get("x-forwarded-for") ?? "").split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) {
      const ip = pick(parts[Math.max(0, parts.length - trusted)]);
      if (ip) return ip;
    }
    const real = pick(req.headers.get("x-real-ip"));
    if (real) return real;
  }
  return "unknown";
}

// ─── Sliding-window rate limiter (in memory) ────────────────────────────────────────────────────

interface Bucket { hits: number[]; windowMs: number }
const MAX_KEYS = 50_000;
const MAX_KEY_LENGTH = 200;
const MAX_HITS_PER_KEY = 1000;

// One store per process, shared by every route bundle (and surviving dev hot reloads).
const g = globalThis as unknown as { __cvRateLimitStore?: Map<string, Bucket>; __cvRateLimitSweep?: number };
const store: Map<string, Bucket> = (g.__cvRateLimitStore ??= new Map());

function sweep(now: number) {
  // A big store is swept at most once a second (not on every call): an attacker rotating keys must not turn each request into an O(n) scan.
  if (now - (g.__cvRateLimitSweep ?? 0) < (store.size >= 2000 ? 1_000 : 60_000)) return;
  g.__cvRateLimitSweep = now;
  for (const [k, b] of store) {
    const last = b.hits[b.hits.length - 1];
    if (last === undefined || now - last >= b.windowMs) store.delete(k);
  }
  // Still too many distinct keys (an attacker rotating spoofed IPs): drop the oldest-inserted ones.
  for (const k of store.keys()) {
    if (store.size <= MAX_KEYS) break;
    store.delete(k);
  }
}

function bucketFor(key: string, windowMs: number, now: number): Bucket {
  const k = key.slice(0, MAX_KEY_LENGTH);
  let b = store.get(k);
  if (!b) { b = { hits: [], windowMs }; store.set(k, b); }
  b.windowMs = Math.max(b.windowMs, windowMs);
  const cutoff = now - windowMs;
  if (b.hits.length && b.hits[0] <= cutoff) b.hits = b.hits.filter((t) => t > cutoff);
  return b;
}

export interface RateResult { ok: boolean; remaining: number; retryAfterSec: number }

function result(b: Bucket, limit: number, windowMs: number, now: number): RateResult {
  const remaining = Math.max(0, limit - b.hits.length);
  const retryAfterSec = b.hits.length >= limit ? Math.max(1, Math.ceil((b.hits[0] + windowMs - now) / 1000)) : 0;
  return { ok: b.hits.length < limit, remaining, retryAfterSec };
}

/** Records one hit for `key` and reports whether it is within `limit` hits per `windowMs`. Blocked hits are not recorded. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
  sweep(now);
  const b = bucketFor(key, windowMs, now);
  if (b.hits.length >= limit) return result(b, limit, windowMs, now);
  b.hits.push(now);
  return { ok: true, remaining: Math.max(0, limit - b.hits.length), retryAfterSec: 0 };
}

/** Like rateLimit but only looks: nothing is recorded. Use with recordHit() to count only FAILED attempts. */
export function rateLimitPeek(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
  sweep(now);
  return result(bucketFor(key, windowMs, now), limit, windowMs, now);
}

/** Records a hit without checking (e.g. a failed login). */
export function recordHit(key: string, windowMs: number, now = Date.now()): void {
  sweep(now);
  const b = bucketFor(key, windowMs, now);
  b.hits.push(now);
  if (b.hits.length > MAX_HITS_PER_KEY) b.hits.splice(0, b.hits.length - MAX_HITS_PER_KEY);
}

/** Forgets a key (e.g. after a successful login). */
export function resetRateLimit(key: string): void {
  store.delete(key.slice(0, MAX_KEY_LENGTH));
}

/** Test helper: empties the store. */
export function _clearRateLimits(): void {
  store.clear();
}

/** Standard 429 headers for a blocked RateResult. */
export function retryHeaders(r: RateResult): Record<string, string> {
  return { "Retry-After": String(Math.max(1, r.retryAfterSec)), "Cache-Control": "no-store" };
}

// ─── CSRF defence in depth ──────────────────────────────────────────────────────────────────────

/**
 * False for a browser request that originates from another site. Session cookies are already SameSite=Lax
 * (not sent on cross-site POSTs); this adds an explicit Origin / Sec-Fetch-Site check on top.
 * Requests without an Origin header (curl, server-to-server, tests) are allowed: they can't be CSRF.
 */
export function isSameOrigin(req: Request, env: Record<string, string | undefined> = process.env): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  let host: string;
  try { host = new URL(origin).host.toLowerCase(); } catch { return false; }
  const allowed = new Set<string>();
  for (const h of [req.headers.get("host"), req.headers.get("x-forwarded-host")]) {
    const first = h?.split(",")[0]?.trim().toLowerCase();
    if (first) allowed.add(first);
  }
  try { if (env.NEXT_PUBLIC_SITE_URL) allowed.add(new URL(env.NEXT_PUBLIC_SITE_URL).host.toLowerCase()); } catch { /* ignore */ }
  return allowed.has(host);
}
