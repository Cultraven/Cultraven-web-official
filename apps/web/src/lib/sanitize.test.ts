// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  hasMongoOperators, plainJsonError, assertPlainJson, HttpError, parseJsonBody, escapeRegex, isObjectIdString, hasOwn,
  clientIp, rateLimit, rateLimitPeek, recordHit, resetRateLimit, _clearRateLimits, isSameOrigin, stripControlChars, stripTags,
} from "./sanitize";

const req = (headers: Record<string, string>, body?: string | null, method = "POST") =>
  new Request("http://localhost:3000/api/x", { method, headers, body: body ?? undefined });
const json = (body: string, extra: Record<string, string> = {}) => req({ "content-type": "application/json", ...extra }, body);

describe("hasMongoOperators", () => {
  it("accepts ordinary payloads", () => {
    expect(hasMongoOperators({ email: "a@b.com", password: "pa$$word.1", nested: { list: [1, 2, { ok: true }] } })).toBe(false);
    expect(hasMongoOperators("$ne")).toBe(false); // string VALUES are harmless
    expect(hasMongoOperators(null)).toBe(false);
    expect(hasMongoOperators([])).toBe(false);
  });
  it("flags $-operators at any depth", () => {
    expect(hasMongoOperators({ email: { $ne: null } })).toBe(true);
    expect(hasMongoOperators({ a: { b: { c: [{ $gt: "" }] } } })).toBe(true);
    expect(hasMongoOperators({ $where: "1" })).toBe(true);
    expect(hasMongoOperators([{ $or: [] }])).toBe(true);
  });
  it("flags dotted keys and NUL bytes", () => {
    expect(hasMongoOperators({ "a.b": 1 })).toBe(true);
    expect(hasMongoOperators({ items: [{ "price.paise": 1 }] })).toBe(true);
    expect(hasMongoOperators({ "a\0b": 1 })).toBe(true);
  });
  it("flags prototype-pollution keys, including the own __proto__ that JSON.parse creates", () => {
    expect(hasMongoOperators(JSON.parse('{"__proto__":{"isAdmin":true}}'))).toBe(true);
    expect(hasMongoOperators(JSON.parse('{"a":{"constructor":{"prototype":{"x":1}}}}'))).toBe(true);
    expect(hasMongoOperators(JSON.parse('{"prototype":1}'))).toBe(true);
  });
  it("treats absurdly deep structures as hostile", () => {
    let deep: any = { v: 1 };
    for (let i = 0; i < 60; i++) deep = { n: deep };
    expect(hasMongoOperators(deep)).toBe(true);
  });
});

describe("plainJsonError / assertPlainJson", () => {
  it("accepts a plain object", () => expect(plainJsonError({ a: 1 })).toBeNull());
  it("rejects non-objects, arrays, null", () => {
    for (const v of [null, [], [1], "x", 5, true, undefined]) expect(plainJsonError(v)).not.toBeNull();
  });
  it("rejects operator payloads", () => expect(plainJsonError({ email: { $ne: null } })).not.toBeNull());
  it("assertPlainJson throws a 400 HttpError", () => {
    expect(() => assertPlainJson({ ok: 1 })).not.toThrow();
    try { assertPlainJson({ x: { $gt: "" } }); throw new Error("should not reach"); } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(400);
    }
  });
});

describe("parseJsonBody", () => {
  it("parses a good body", async () => {
    const r = await parseJsonBody(json('{"a":1}'));
    expect(r).toEqual({ ok: true, data: { a: 1 } });
  });
  it("requires application/json", async () => {
    const r = await parseJsonBody(req({ "content-type": "text/plain" }, '{"a":1}'));
    expect(r).toMatchObject({ ok: false, status: 415 });
    const r2 = await parseJsonBody(req({}, '{"a":1}'));
    expect(r2).toMatchObject({ ok: false, status: 415 });
  });
  it("can skip the content-type requirement", async () => {
    const r = await parseJsonBody(req({}, '{"a":1}'), 1024, { requireJson: false });
    expect(r.ok).toBe(true);
  });
  it("rejects invalid JSON, arrays, scalars and empty bodies with 400", async () => {
    for (const b of ["{bad", "[1]", "5", '"s"', "null", ""]) expect(await parseJsonBody(json(b))).toMatchObject({ ok: false, status: 400 });
  });
  it("rejects operator and prototype payloads with 400", async () => {
    for (const b of ['{"email":{"$ne":null}}', '{"a":{"$gt":""}}', '{"__proto__":{"x":1}}', '{"constructor":{"prototype":{}}}', '{"a.b":1}']) {
      expect(await parseJsonBody(json(b))).toMatchObject({ ok: false, status: 400 });
    }
  });
  it("accepts operator-looking STRING values", async () => {
    expect((await parseJsonBody(json('{"email":"$ne","q":"a.b"}'))).ok).toBe(true);
  });
  it("enforces the byte cap (declared and streamed)", async () => {
    const big = JSON.stringify({ s: "x".repeat(5000) });
    expect(await parseJsonBody(json(big), 1000)).toMatchObject({ ok: false, status: 413 });
    // Content-Length missing / lying: the stream itself is capped.
    const lying = new Request("http://localhost/api/x", { method: "POST", headers: { "content-type": "application/json" }, body: big });
    lying.headers.delete("content-length");
    expect(await parseJsonBody(lying, 1000)).toMatchObject({ ok: false, status: 413 });
  });
  it("survives pathologically nested JSON without throwing", async () => {
    const nested = "[".repeat(200000) + "]".repeat(200000);
    const r = await parseJsonBody(json(nested), 1024 * 1024);
    expect(r.ok).toBe(false);
  });
});

describe("escapeRegex", () => {
  it("escapes every metacharacter so the text matches literally", () => {
    const evil = "(a+)+$ .* [x] ^y|z \\ {1,2} ?";
    const re = new RegExp(escapeRegex(evil));
    expect(re.test(`prefix ${evil} suffix`)).toBe(true);
    expect(re.test("aaaa")).toBe(false);
  });
  it("a catastrophic-backtracking pattern becomes inert and fast", () => {
    const re = new RegExp(escapeRegex("(a+)+$"), "i");
    const t = Date.now();
    expect(re.test("a".repeat(5000) + "!")).toBe(false);
    expect(Date.now() - t).toBeLessThan(200);
  });
  it("leaves plain words alone", () => expect(escapeRegex("hoodies")).toBe("hoodies"));
});

describe("isObjectIdString / hasOwn", () => {
  it("accepts only 24-hex strings", () => {
    expect(isObjectIdString("507f1f77bcf86cd799439011")).toBe(true);
    for (const v of ["aaaaaaaaaaaa", "507f1f77bcf86cd79943901", "507f1f77bcf86cd7994390111", "zzzzzzzzzzzzzzzzzzzzzzzz", { $ne: 1 }, 123, null, undefined, ["507f1f77bcf86cd799439011"]]) {
      expect(isObjectIdString(v)).toBe(false);
    }
  });
  it("hasOwn ignores the prototype chain", () => {
    const map: Record<string, number> = { a: 1 };
    expect(hasOwn(map, "a")).toBe(true);
    for (const k of ["constructor", "__proto__", "toString", "hasOwnProperty"]) expect(hasOwn(map, k)).toBe(false);
  });
});

describe("clientIp", () => {
  const mk = (h: Record<string, string>) => new Request("http://x/", { headers: h });
  it("trusts only the entry our proxy appended (rightmost by default)", () => {
    expect(clientIp(mk({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }), {})).toBe("203.0.113.9");
    expect(clientIp(mk({ "x-forwarded-for": "203.0.113.9" }), {})).toBe("203.0.113.9");
  });
  it("honours TRUSTED_PROXY_HOPS", () => {
    expect(clientIp(mk({ "x-forwarded-for": "198.51.100.7, 10.0.0.1, 10.0.0.2" }), { TRUSTED_PROXY_HOPS: "2" })).toBe("10.0.0.1");
    expect(clientIp(mk({ "x-forwarded-for": "198.51.100.7" }), { TRUSTED_PROXY_HOPS: "0" })).toBe("unknown");
  });
  it("uses CLIENT_IP_HEADER when configured, falls back otherwise", () => {
    expect(clientIp(mk({ "cf-connecting-ip": "2001:db8::1", "x-forwarded-for": "1.1.1.1" }), { CLIENT_IP_HEADER: "cf-connecting-ip" })).toBe("2001:db8::1");
    expect(clientIp(mk({ "x-forwarded-for": "1.1.1.1" }), { CLIENT_IP_HEADER: "cf-connecting-ip" })).toBe("1.1.1.1");
  });
  it("falls back to x-real-ip, then unknown, and rejects junk", () => {
    expect(clientIp(mk({ "x-real-ip": "192.0.2.5" }), {})).toBe("192.0.2.5");
    expect(clientIp(mk({}), {})).toBe("unknown");
    expect(clientIp(mk({ "x-forwarded-for": "<script>alert(1)</script>" }), {})).toBe("unknown");
    expect(clientIp(mk({ "x-forwarded-for": "1".repeat(100) }), {})).toBe("unknown");
  });
});

describe("rateLimit (sliding window)", () => {
  beforeEach(() => _clearRateLimits());
  it("allows `limit` hits then blocks until the window slides", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 1000 + i).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, 1500);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
    expect(rateLimit("k", 3, 1000, 2001).ok).toBe(true); // first hit (t=1000) has left the window
  });
  it("is a real sliding window, not a fixed bucket", () => {
    rateLimit("s", 2, 1000, 0);
    rateLimit("s", 2, 1000, 900);
    expect(rateLimit("s", 2, 1000, 999).ok).toBe(false);
    expect(rateLimit("s", 2, 1000, 1000).ok).toBe(true); // the t=0 hit has left the window; only t=900 remains, so one slot is free
    expect(rateLimit("s", 2, 1000, 1001).ok).toBe(false);
  });
  it("blocked attempts are not recorded (no permanent lock-out)", () => {
    rateLimit("b", 1, 1000, 0);
    for (let t = 1; t < 900; t += 100) expect(rateLimit("b", 1, 1000, t).ok).toBe(false);
    expect(rateLimit("b", 1, 1000, 1001).ok).toBe(true);
  });
  it("keys are independent", () => {
    expect(rateLimit("a", 1, 1000, 0).ok).toBe(true);
    expect(rateLimit("b", 1, 1000, 0).ok).toBe(true);
    expect(rateLimit("a", 1, 1000, 1).ok).toBe(false);
  });
  it("peek + recordHit count only what you record; reset forgets", () => {
    expect(rateLimitPeek("f", 2, 1000, 0).ok).toBe(true);
    recordHit("f", 1000, 1); recordHit("f", 1000, 2);
    expect(rateLimitPeek("f", 2, 1000, 3).ok).toBe(false);
    expect(rateLimitPeek("f", 2, 1000, 3).remaining).toBe(0);
    resetRateLimit("f");
    expect(rateLimitPeek("f", 2, 1000, 4).ok).toBe(true);
  });
  it("huge or hostile keys do not blow up the store", () => {
    expect(rateLimit("x".repeat(100000), 1, 1000, 0).ok).toBe(true);
    expect(rateLimit("x".repeat(100000), 1, 1000, 1).ok).toBe(false); // truncated to the same key
  });
});

describe("isSameOrigin", () => {
  const post = (h: Record<string, string>) => new Request("http://localhost:3000/api/x", { method: "POST", headers: h });
  it("allows requests with no Origin (curl, server-to-server)", () => expect(isSameOrigin(post({}), {})).toBe(true));
  it("allows the same origin", () => expect(isSameOrigin(post({ origin: "http://localhost:3000", host: "localhost:3000" }), {})).toBe(true));
  it("blocks another origin and Sec-Fetch-Site: cross-site", () => {
    expect(isSameOrigin(post({ origin: "https://evil.example", host: "localhost:3000" }), {})).toBe(false);
    expect(isSameOrigin(post({ "sec-fetch-site": "cross-site" }), {})).toBe(false);
    expect(isSameOrigin(post({ origin: "null", host: "localhost:3000" }), {})).toBe(false);
    expect(isSameOrigin(post({ origin: "not a url", host: "localhost:3000" }), {})).toBe(false);
  });
  it("accepts the configured site URL and forwarded host", () => {
    expect(isSameOrigin(post({ origin: "https://cultraven.com", host: "internal:3000" }), { NEXT_PUBLIC_SITE_URL: "https://cultraven.com" })).toBe(true);
    expect(isSameOrigin(post({ origin: "https://cultraven.com", host: "internal:3000", "x-forwarded-host": "cultraven.com" }), {})).toBe(true);
  });
});

describe("text helpers", () => {
  it("stripControlChars removes CR/LF so values can't forge log lines or mail headers", () => {
    expect(stripControlChars("a\r\nBcc: x@y.z")).toBe("a  Bcc: x@y.z");
    expect(stripControlChars("a\nb", true)).toBe("a\nb");
    expect(stripControlChars("a\u0000b", true)).toBe("ab");
  });
  it("stripTags removes markup", () => expect(stripTags("hi <img src=x onerror=alert(1)> there")).toBe("hi  there"));
});
