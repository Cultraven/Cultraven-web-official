import { describe, it, expect } from "vitest";
import { siteUrl } from "./site-url";

describe("site address used in emails", () => {
  it("uses the configured address, without a trailing slash", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://cultraven.com" })).toBe("https://cultraven.com");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://cultraven.com/" })).toBe("https://cultraven.com");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "  https://shop.example.in///  " })).toBe("https://shop.example.in");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3100" })).toBe("http://localhost:3100");
  });
  it("in production a missing or broken setting falls back to the real site, never localhost", () => {
    for (const bad of [undefined, "", "   ", "cultraven.com", "javascript:alert(1)", "ftp://x.com", "https://", "//evil.com", "not a url"]) {
      expect(siteUrl({ NEXT_PUBLIC_SITE_URL: bad, NODE_ENV: "production" })).toBe("https://cultraven.com");
    }
  });
  it("in development the fallback is localhost", () => {
    expect(siteUrl({ NODE_ENV: "development" })).toBe("http://localhost:3000");
    expect(siteUrl({})).toBe("http://localhost:3000");
  });
});
