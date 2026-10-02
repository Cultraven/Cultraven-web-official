// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { OBJECT_ID_RE, apiError, readJsonBody, summarizeZodError } from "./address-api";

const req = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/x", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

describe("readJsonBody", () => {
  it("parses a plain JSON object", async () => {
    expect(await readJsonBody(req('{"name":"Ravi","n":1}'))).toEqual({ ok: true, body: { name: "Ravi", n: 1 } });
  });
  it("rejects invalid JSON and empty bodies with 400", async () => {
    for (const b of ["{bad", "", "undefined", "{'a':1}"]) {
      const r = await readJsonBody(req(b));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.res.status).toBe(400);
    }
  });
  it("rejects bodies that are not a plain object, and Mongo-operator / prototype keys, before zod ever sees them", async () => {
    for (const b of ['{"$ne":null}', '{"name":{"$gt":""}}', '{"a":[{"$where":"1"}]}', '{"__proto__":{"x":1}}', '{"a":{"constructor":{}}}', '{"a.b":1}', "[]", '"x"', "null", "5"]) {
      const r = await readJsonBody(req(b));
      expect(r.ok, b).toBe(false);
      if (!r.ok) expect(r.res.status).toBe(400);
    }
  });
  it("rejects oversize bodies with 413 (declared or streamed)", async () => {
    const big = JSON.stringify({ a: "x".repeat(9000) });
    const declared = await readJsonBody(req(big, { "content-length": String(big.length) }));
    expect(declared.ok).toBe(false);
    if (!declared.ok) expect(declared.res.status).toBe(413);
    const streamed = await readJsonBody(new Request("http://localhost/api/x", { method: "POST", body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(big)); c.close(); } }), duplex: "half" } as RequestInit));
    expect(streamed.ok).toBe(false);
    if (!streamed.ok) expect(streamed.res.status).toBe(413);
  });
});

describe("summarizeZodError / apiError", () => {
  it("keys issues by full path and never reflects values or key names", () => {
    const S = z.object({ address: z.object({ state: z.string() }), label: z.enum(["A", "B"]) }).strict();
    const r = S.safeParse({ address: { state: 5 }, label: "SENTINEL_VALUE", SENTINEL_KEY: 1 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const s = summarizeZodError(r.error);
      expect(Object.keys(s.issues)).toContain("address.state");
      expect(JSON.stringify(s)).not.toContain("SENTINEL");
      expect(typeof s.error).toBe("string");
    }
  });
  it("apiError builds a generic JSON error with the right status", async () => {
    const res = apiError(403, "Forbidden", { code: "X" }, { "Cache-Control": "no-store" });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden", code: "X" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("OBJECT_ID_RE", () => {
  it("accepts exactly 24 hex characters", () => {
    expect(OBJECT_ID_RE.test("64b000000000000000000009")).toBe(true);
    for (const bad of ["", "aaaaaaaaaaaa", "64b00000000000000000000", "64b0000000000000000000099", "zzzzzzzzzzzzzzzzzzzzzzzz", '{"$ne":null}', "64b000000000000000000009\n", "../etc/passwd"]) expect(OBJECT_ID_RE.test(bad)).toBe(false);
  });
});
