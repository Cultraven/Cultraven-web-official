// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { BRAND_IMAGES, isServableSource } from "./brand-images";
import { SECTION_MAP, validateFields } from "./cms/registry";

const h = vi.hoisted(() => ({ branding: {} as Record<string, string>, fetched: [] as string[], remote: new Map<string, { type: string; bytes: number; ok?: boolean }>() }));
vi.mock("@/lib/cms/server", () => ({ getCmsSection: async () => ({ state: "ok", data: h.branding }) }));

import { GET } from "../app/brand/[name]/route";

const realFetch = globalThis.fetch;
beforeEach(() => {
  h.branding = {}; h.fetched.length = 0; h.remote.clear();
  h.remote.set("http://localhost/logo-horizontal.png", { type: "image/png", bytes: 100 });
  h.remote.set("http://localhost/icon.png", { type: "image/png", bytes: 100 });
  globalThis.fetch = (async (url: string) => {
    h.fetched.push(String(url));
    const r = h.remote.get(String(url));
    if (!r || r.ok === false) return new Response("no", { status: 404 });
    return new Response(new Uint8Array(r.bytes), { status: 200, headers: { "content-type": r.type } });
  }) as any;
});
afterEach(() => { globalThis.fetch = realFetch; });

const call = (name: string) => GET(new NextRequest(`http://localhost/brand/${name}`), { params: Promise.resolve({ name }) });

describe("logos and site images at /brand/<name>", () => {
  it("with nothing set in the admin, serves the built-in file", async () => {
    const r = await call("logo-horizontal");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/png");
    expect(h.fetched).toEqual(["http://localhost/logo-horizontal.png"]);
  });
  it("serves the image chosen in the admin (an uploaded file or an https address)", async () => {
    h.branding = { logoHorizontal: "/uploads/new-logo.png" };
    h.remote.set("http://localhost/uploads/new-logo.png", { type: "image/webp", bytes: 50 });
    const r = await call("logo-horizontal");
    expect(r.headers.get("content-type")).toBe("image/webp");
    h.branding = { logoHorizontal: "https://cdn.example.com/logo.png" };
    h.remote.set("https://cdn.example.com/logo.png", { type: "image/png", bytes: 60 });
    expect((await call("logo-horizontal")).status).toBe(200);
    expect(h.fetched.at(-1)).toBe("https://cdn.example.com/logo.png");
  });
  it("falls back to the built-in file when the chosen image is broken, too big, or not an image", async () => {
    h.branding = { logoHorizontal: "https://cdn.example.com/gone.png" };
    expect((await call("logo-horizontal")).status).toBe(200); // remote 404 -> built-in
    h.branding = { logoHorizontal: "https://cdn.example.com/page.html" };
    h.remote.set("https://cdn.example.com/page.html", { type: "text/html", bytes: 10 });
    expect((await call("logo-horizontal")).headers.get("content-type")).toBe("image/png");
    h.branding = { logoHorizontal: "https://cdn.example.com/huge.png" };
    h.remote.set("https://cdn.example.com/huge.png", { type: "image/png", bytes: 9 * 1024 * 1024 });
    expect((await call("logo-horizontal")).headers.get("content-type")).toBe("image/png");
    expect(h.fetched.at(-1)).toBe("http://localhost/logo-horizontal.png");
  });
  it("never fetches an unsafe address (http, javascript:, path tricks)", async () => {
    for (const bad of ["http://cdn.example.com/a.png", "javascript:alert(1)", "//evil.example/a.png", "/uploads/../secret", "file:///etc/passwd"]) {
      h.branding = { logoHorizontal: bad }; h.fetched.length = 0;
      expect((await call("logo-horizontal")).status).toBe(200);
      expect(h.fetched).toEqual(["http://localhost/logo-horizontal.png"]);
    }
  });
  it("unknown names are 404, and the browser-tab icon falls back to icon.png", async () => {
    expect((await call("passwd")).status).toBe(404);
    expect((await call("constructor")).status).toBe(404);
    expect((await call("favicon")).status).toBe(200);
    expect(h.fetched.at(-1)).toBe("http://localhost/icon.png");
  });
  it("every served image has an admin field, and the admin form accepts all of them", () => {
    const def = SECTION_MAP["site.branding"];
    const keys = def.fields.map((f) => f.key);
    for (const v of Object.values(BRAND_IMAGES)) expect(keys).toContain(v.field);
    const r = validateFields(def.fields, { logoHorizontal: "https://images.unsplash.com/photo-1?w=900", logoMark: "", favicon: "", shareImage: "", logoStacked: "" });
    expect(r.errors).toEqual([]);
  });
  it("isServableSource", () => {
    expect(isServableSource("/uploads/a.png")).toBe(true);
    expect(isServableSource("https://x.co/a.png")).toBe(true);
    expect(isServableSource(5)).toBe(false);
    expect(isServableSource("")).toBe(false);
  });
});
