// @vitest-environment node
/** Admin uploads: stored in the database (not on disk) and served back, with byte ranges for video. Fakes for the database. */
import crypto from "crypto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ files: new Map<string, Buffer>(), saveFails: false }));
vi.mock("@/lib/media-store", async (orig) => {
  const real = await orig<typeof import("@/lib/media-store")>();
  return {
    ...real,
    saveMedia: async (name: string, data: Buffer) => { if (h.saveFails) throw new Error("db down"); h.files.set(name, data); },
    mediaInfo: async (name: string) => { const f = h.files.get(name); return f ? { length: f.length, contentType: real.CONTENT_TYPES[name.split(".").pop()!] } : null; },
    openMedia: async (name: string, range?: { start: number; end: number }) => { const f = h.files.get(name)!; const part = range ? f.subarray(range.start, range.end + 1) : f; return new ReadableStream({ start(c) { c.enqueue(new Uint8Array(part)); c.close(); } }); },
  };
});

import { POST as upload } from "../app/api/upload/route";
import { GET as serve } from "../app/uploads/[name]/route";
import { parseRange, MEDIA_NAME } from "./media-store";

const SECRET = "scenario-session-secret-0123456789abcdef";
const cookie = (role = "admin") => { const p = Buffer.from(JSON.stringify({ role, exp: Date.now() + 3_600_000, email: "b@x.co" })).toString("base64url"); return `cultraven_admin_session=${p}.${crypto.createHmac("sha256", SECRET).update(p).digest("base64url")}`; };
let n = 0;
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100, 1)]);
const post = (bytes: Buffer, over: { cookie?: string | null; name?: string } = {}) => {
  const fd = new FormData(); fd.append("file", new Blob([new Uint8Array(bytes)]), over.name ?? "x.jpg");
  const headers: Record<string, string> = { host: "localhost", origin: "http://localhost", "x-forwarded-for": `10.5.${Math.floor(++n / 250)}.${n % 250 + 1}` };
  if (over.cookie !== null) headers.cookie = over.cookie ?? cookie();
  return upload(new Request("http://localhost/api/upload", { method: "POST", headers, body: fd }));
};
const get = (name: string, range?: string) => serve(new NextRequest(`http://localhost/uploads/${name}`, { headers: range ? { range } : {} }), { params: Promise.resolve({ name }) });

beforeEach(() => { h.files.clear(); h.saveFails = false; vi.stubEnv("SESSION_SECRET", SECRET); vi.spyOn(console, "error").mockImplementation(() => {}); });

describe("scenario: the admin uploads a photo and the website shows it", () => {
  it("stores the photo in the database under a random name and serves exactly the same bytes", async () => {
    const r = await post(JPEG);
    expect(r.status).toBe(200);
    const d = await r.json();
    expect(d.url).toMatch(/^\/uploads\/[a-f0-9]{32}\.jpg$/);
    expect(d.kind).toBe("image");
    const name = d.url.replace("/uploads/", "");
    expect(h.files.has(name)).toBe(true);
    const res = await get(name);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toMatch(/immutable/);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await res.arrayBuffer()).equals(JPEG)).toBe(true);
  });
  it("the real type comes from the file's bytes, not its name: a PNG called .exe is a PNG, an HTML file called .jpg is refused", async () => {
    expect((await (await post(PNG, { name: "evil.exe" })).json()).url).toMatch(/\.png$/);
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    const r = await post(html, { name: "pic.jpg" });
    expect(r.status).toBe(415);
    expect((await r.json()).error).toMatch(/Unsupported/);
  });
  it("only a signed-in admin can upload", async () => {
    expect((await post(JPEG, { cookie: null })).status).toBe(401);
    expect((await post(JPEG, { cookie: cookie("customer") })).status).toBe(401);
    expect(h.files.size).toBe(0);
  });
  it("when the database can't save, the admin gets a clean 500 (shown as a friendly message) and nothing is left half-saved", async () => {
    h.saveFails = true;
    const r = await post(JPEG);
    expect(r.status).toBe(500);
    expect(h.files.size).toBe(0);
  });
});

describe("scenario: serving uploaded files", () => {
  it("only well-formed names are looked up; anything else is a 404", async () => {
    for (const bad of ["../secret", "abc.jpg", "a".repeat(32) + ".html", "a".repeat(32) + ".svg", "A".repeat(32) + ".jpg", "a".repeat(32) + ".jpg/x"]) expect((await get(bad)).status, bad).toBe(404);
    expect((await get("a".repeat(32) + ".jpg")).status).toBe(404); // well formed but not stored
  });
  it("supports byte ranges so phones can play and seek video", async () => {
    const name = "b".repeat(32) + ".mp4";
    h.files.set(name, Buffer.from("0123456789"));
    const r = await get(name, "bytes=2-5");
    expect(r.status).toBe(206);
    expect(r.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(Buffer.from(await r.arrayBuffer()).toString()).toBe("2345");
    expect((await get(name, "bytes=50-60")).status).toBe(416);
    expect((await get(name, "bytes=abc")).status).toBe(416);
  });
  it("parseRange handles open-ended and suffix ranges", () => {
    expect(parseRange(null, 10)).toBeNull();
    expect(parseRange("bytes=3-", 10)).toEqual({ start: 3, end: 9 });
    expect(parseRange("bytes=-4", 10)).toEqual({ start: 6, end: 9 });
    expect(parseRange("bytes=0-999", 10)).toEqual({ start: 0, end: 9 });
    expect(parseRange("bytes=5-2", 10)).toBe("bad");
    expect(MEDIA_NAME.test("a".repeat(32) + ".webm")).toBe(true);
  });
});
