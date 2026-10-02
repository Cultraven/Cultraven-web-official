import { describe, it, expect } from "vitest";
import { buildSoftDeleteUpdate, deletedEmailFor, isDeletedEmail, isUserActive, DELETE_CONFIRM_PHRASE } from "./account-delete";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same pattern as the User schema

describe("deletedEmailFor", () => {
  it("builds deleted+<id>@deleted.invalid and satisfies the User email pattern", () => {
    const e = deletedEmailFor("6abf820430f223da33a41571");
    expect(e).toBe("deleted+6abf820430f223da33a41571@deleted.invalid");
    expect(EMAIL_RE.test(e)).toBe(true);
  });
  it("is unique per id and stable for the same id", () => {
    expect(deletedEmailFor("a1")).toBe(deletedEmailFor("a1"));
    expect(deletedEmailFor("a1")).not.toBe(deletedEmailFor("a2"));
  });
  it("strips characters that could break the address", () => {
    expect(deletedEmailFor(" AB-12@x ")).toBe("deleted+ab12x@deleted.invalid");
  });
  it("refuses an empty id", () => {
    expect(() => deletedEmailFor("")).toThrow();
    expect(() => deletedEmailFor("  --  ")).toThrow();
  });
});

describe("isDeletedEmail", () => {
  it("recognises placeholders only", () => {
    expect(isDeletedEmail(deletedEmailFor("abc123"))).toBe(true);
    expect(isDeletedEmail("someone@example.com")).toBe(false);
    expect(isDeletedEmail("deleted+abc@example.com")).toBe(false);
    expect(isDeletedEmail(undefined)).toBe(false);
  });
});

describe("isUserActive", () => {
  it("treats legacy users (no soft-delete fields) as active", () => {
    expect(isUserActive({})).toBe(true);
    expect(isUserActive({ deletedAt: null, status: "active" })).toBe(true);
  });
  it("rejects deleted users, missing users, and either flag on its own", () => {
    expect(isUserActive(null)).toBe(false);
    expect(isUserActive(undefined)).toBe(false);
    expect(isUserActive({ deletedAt: new Date() })).toBe(false);
    expect(isUserActive({ status: "deleted" })).toBe(false);
  });
});

describe("buildSoftDeleteUpdate", () => {
  it("renames the email, keeps a copy, blanks the avatar and stamps deletedAt", () => {
    const now = new Date("2026-10-02T10:00:00Z");
    const u = buildSoftDeleteUpdate({ _id: "6abf820430f223da33a41571", email: "me@example.com" }, now);
    expect(u.$set.deletedAt).toBe(now);
    expect(u.$set.status).toBe("deleted");
    expect(u.$set.deletedEmail).toBe("me@example.com");
    expect(u.$set.email).toBe("deleted+6abf820430f223da33a41571@deleted.invalid");
    expect(u.$set.avatar).toBe("");
    expect(u.$set.avatarUpdatedAt).toBeNull();
  });
  it("never touches order data or the password hash", () => {
    const u = buildSoftDeleteUpdate({ _id: "x1", email: "a@b.co" });
    expect(Object.keys(u)).toEqual(["$set"]);
    expect(Object.keys(u.$set)).not.toContain("passwordHash");
  });
});

describe("confirm phrase", () => {
  it("is the literal DELETE", () => expect(DELETE_CONFIRM_PHRASE).toBe("DELETE"));
});
