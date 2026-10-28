// @vitest-environment node
/** Saving a CMS section that links to a product page that does not exist is refused; a real product is accepted. Fakes for the database. */
import crypto from "crypto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ products: new Set<string>(), saved: [] as any[] }));
vi.mock("@/lib/db", () => ({ connectToDatabase: async () => {} }));
vi.mock("@/lib/models/Product", () => ({ Product: { find: (q: any) => ({ select: () => ({ lean: async () => (q.slug.$in as string[]).filter((s) => h.products.has(s)).map((slug) => ({ slug })) }) }) } }));
vi.mock("@/lib/models/CmsSection", () => ({
  CmsSection: {
    updateOne: async (_q: any, u: any) => { h.saved.push(u.$set.data); },
    findOne: () => ({ lean: async () => ({ data: h.saved.at(-1), updatedAt: new Date() }) }),
  },
}));

import { PUT } from "../app/api/cms/sections/[key]/route";

const SECRET = "scenario-session-secret-0123456789abcdef";
const cookie = () => { const p = Buffer.from(JSON.stringify({ role: "admin", exp: Date.now() + 3_600_000, email: "b@x.co" })).toString("base64url"); return `cultraven_admin_session=${p}.${crypto.createHmac("sha256", SECRET).update(p).digest("base64url")}`; };
const put = (href: string) => PUT(new NextRequest("http://localhost/api/cms/sections/home.trending", { method: "PUT", headers: { host: "localhost", origin: "http://localhost", cookie: cookie(), "content-type": "application/json" }, body: JSON.stringify({ data: { heading: "Trending Now", items: [{ id: "a", title: "Hoodie", href, image: "https://images.unsplash.com/photo-1?w=800", alt: "", active: true }] } }) }), { params: Promise.resolve({ key: "home.trending" }) });

beforeEach(() => { h.products = new Set(["dharma-graphic-hoodie-stone"]); h.saved.length = 0; vi.stubEnv("SESSION_SECRET", SECRET); });

describe("scenario: a banner card must point at a real product page", () => {
  it("refuses /products/dharma-ep01-hoodie when no such product exists, and saves nothing", async () => {
    const res = await put("/products/dharma-ep01-hoodie");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no product at \/products\/dharma-ep01-hoodie/);
    expect(h.saved).toHaveLength(0);
  });
  it("accepts a link to a product that exists, and links to collections and pages", async () => {
    expect((await put("/products/dharma-graphic-hoodie-stone")).status).toBe(200);
    expect((await put("/collections/all")).status).toBe(200);
    expect(h.saved).toHaveLength(2);
  });
});
