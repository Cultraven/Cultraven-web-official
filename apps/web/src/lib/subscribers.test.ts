import { describe, expect, it } from "vitest";
import { canonicalEmail, isDuplicateKeyError } from "./subscribers";
import { NewsletterSubscriber } from "./models/NewsletterSubscriber";

describe("canonicalEmail: when two addresses are the same person", () => {
  it.each([
    ["Jitesh.B@Gmail.com", "jiteshb@gmail.com"],
    ["jitesh.b+promo@gmail.com", "jiteshb@gmail.com"],
    ["j.i.t.e.s.h.b@googlemail.com", "jiteshb@gmail.com"],
    ["  JITESHB@GMAIL.COM ", "jiteshb@gmail.com"],
  ])("%s -> %s (Gmail ignores dots, +tags and capitals)", (input, key) => expect(canonicalEmail(input)).toBe(key));

  it.each([
    ["A.B+tag@Example.com", "a.b+tag@example.com"],
    ["name@outlook.com", "name@outlook.com"],
    ["a.b@yahoo.com", "a.b@yahoo.com"],
  ])("%s is only lower-cased (never guessed at on other providers)", (input, key) => expect(canonicalEmail(input)).toBe(key));

  it("does not blow up on odd input", () => {
    expect(canonicalEmail("")).toBe("");
    expect(canonicalEmail("no-at-sign")).toBe("no-at-sign");
    expect(canonicalEmail("@gmail.com")).toBe("@gmail.com");
  });
});

describe("isDuplicateKeyError", () => {
  it("recognises MongoDB's duplicate-key error and nothing else", () => {
    expect(isDuplicateKeyError(Object.assign(new Error("x"), { code: 11000 }))).toBe(true);
    expect(isDuplicateKeyError(new Error("E11000 duplicate key error collection"))).toBe(true);
    expect(isDuplicateKeyError(new Error("connection reset"))).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
  });
});

describe("the database itself refuses a second row", () => {
  it("email and the same-person key both have a unique index (the key is sparse so older rows without it still load)", () => {
    const s = (NewsletterSubscriber as any).schema;
    expect(s.path("email").options.unique).toBe(true);
    expect(s.path("canonical").options.unique).toBe(true);
    expect(s.path("canonical").options.sparse).toBe(true);
  });
});
