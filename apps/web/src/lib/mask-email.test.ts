import { describe, it, expect } from "vitest";
import { maskEmail } from "./mask-email";

describe("maskEmail", () => {
  it("keeps the first two characters and the domain", () => {
    expect(maskEmail("jitesh@example.com")).toBe("ji****@example.com");
  });
  it("always hides at least one character", () => {
    expect(maskEmail("ab@x.io")).toBe("ab*@x.io");
    expect(maskEmail("a@x.io")).toBe("a*@x.io");
  });
  it("returns an empty string for junk", () => {
    expect(maskEmail("")).toBe("");
    expect(maskEmail("nope")).toBe("");
  });
});
