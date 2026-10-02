import { describe, it, expect } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("allows same-site paths", () => {
    expect(safeRedirect("/account/orders", "/account")).toBe("/account/orders");
    expect(safeRedirect("/checkout?mode=buy-now", "/account")).toBe("/checkout?mode=buy-now");
  });
  it("falls back for empty / external / protocol-relative / backslash targets", () => {
    for (const bad of [null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com", "/a\nb"]) {
      expect(safeRedirect(bad as string | null | undefined, "/account")).toBe("/account");
    }
  });
  it("pins to a prefix when asked", () => {
    expect(safeRedirect("/portal-secure/orders", "/portal-secure", "/portal-secure")).toBe("/portal-secure/orders");
    expect(safeRedirect("/portal-secure", "/portal-secure", "/portal-secure")).toBe("/portal-secure");
    expect(safeRedirect("/account", "/portal-secure", "/portal-secure")).toBe("/portal-secure");
    expect(safeRedirect("/portal-secure-evil", "/portal-secure", "/portal-secure")).toBe("/portal-secure");
  });
});
