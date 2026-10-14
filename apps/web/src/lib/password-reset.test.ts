import { describe, it, expect } from "vitest";
import { TOKEN_SHAPE, canResetByEmail, hashToken, loginPathFor, newToken, RESET_TTL_MINUTES, INVITE_TTL_HOURS } from "./password-reset";
import { PasswordPolicy } from "./password";
import { signedInBeforePasswordChange } from "./customer-auth";

describe("reset tokens", () => {
  it("are 43-character random URL-safe strings, different every time", () => {
    const a = newToken(), b = newToken();
    expect(a).toMatch(TOKEN_SHAPE);
    expect(a).not.toBe(b);
    expect(new Set(Array.from({ length: 200 }, newToken)).size).toBe(200);
  });
  it("only that exact shape is accepted (nothing else reaches the database)", () => {
    for (const bad of ["", "short", "x".repeat(42), "x".repeat(44), `${"x".repeat(42)}!`, `{"$ne":1}`, "a".repeat(43) + "\n", "../".repeat(15)]) expect(TOKEN_SHAPE.test(bad)).toBe(false);
    expect(TOKEN_SHAPE.test("A".repeat(43))).toBe(true);
  });
  it("only a hash is stored: SHA-256, stable, and not the token", () => {
    const t = newToken();
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
  it("expire in 30 minutes (forgot password) and 48 hours (new account)", () => {
    expect(RESET_TTL_MINUTES).toBe(30);
    expect(INVITE_TTL_HOURS).toBe(48);
  });
});

describe("who can use the public Forgot password page", () => {
  it("customers and delivery partners can; admin and super-admin accounts cannot", () => {
    expect(canResetByEmail("customer")).toBe(true);
    expect(canResetByEmail("delivery")).toBe(true);
    expect(canResetByEmail("admin")).toBe(false);
    expect(canResetByEmail("superadmin")).toBe(false);
    expect(canResetByEmail(undefined)).toBe(false);
    expect(canResetByEmail("")).toBe(false);
  });
  it("sends people to the right sign-in page afterwards", () => {
    expect(loginPathFor("customer")).toBe("/login");
    expect(loginPathFor("delivery")).toBe("/portal-delivery-access");
    expect(loginPathFor("admin")).toBe("/portal-access");
    expect(loginPathFor("superadmin")).toBe("/portal-access");
  });
});

describe("new password rule (same as sign-up)", () => {
  it("accepts a strong one and says what is missing otherwise", () => {
    expect(PasswordPolicy.safeParse("Passw0rdTest").success).toBe(true);
    for (const weak of ["short1A", "alllowercase1", "ALLUPPERCASE1", "NoNumbersHere", "", "a".repeat(129)]) expect(PasswordPolicy.safeParse(weak).success).toBe(false);
    expect(PasswordPolicy.safeParse("Aa1" + "x".repeat(70)).success).toBe(false); // over bcrypt's 72-byte limit
    expect((PasswordPolicy.safeParse("alllowercase1") as any).error.issues[0].message).toMatch(/uppercase, lowercase and a number/);
  });
});

describe("a password change signs older sessions out", () => {
  const changed = new Date("2026-10-14T10:00:00Z");
  it("rejects a session issued before the change, accepts one issued after", () => {
    expect(signedInBeforePasswordChange({ iat: changed.getTime() - 1 }, { passwordChangedAt: changed })).toBe(true);
    expect(signedInBeforePasswordChange({ iat: changed.getTime() }, { passwordChangedAt: changed })).toBe(false);
    expect(signedInBeforePasswordChange({ iat: changed.getTime() + 5000 }, { passwordChangedAt: changed })).toBe(false);
  });
  it("never locks anyone out when there is nothing to compare", () => {
    expect(signedInBeforePasswordChange({ iat: 1 }, { passwordChangedAt: null })).toBe(false);
    expect(signedInBeforePasswordChange({ iat: 1 }, {})).toBe(false);
    expect(signedInBeforePasswordChange({}, { passwordChangedAt: changed })).toBe(false); // an old-format session has no iat
    expect(signedInBeforePasswordChange({ iat: 1 }, null)).toBe(false);
  });
});
