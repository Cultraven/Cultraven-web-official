import { describe, it, expect } from "vitest";
import { BUSINESS, businessAddress, isValidGstin } from "./business";

describe("business details", () => {
  it("the registered GSTIN is valid (shape + check character) and is a Madhya Pradesh (23) registration", () => {
    expect(BUSINESS.gstin).toBe("23BJHPH4892N1ZQ");
    expect(isValidGstin(BUSINESS.gstin)).toBe(true);
    expect(BUSINESS.gstin.startsWith("23")).toBe(true);
    expect(BUSINESS.gstin[5]).toBe("P"); // PAN type P = individual / proprietor, matching "Proprietorship"
  });
  it("rejects a mistyped GSTIN (one wrong character, wrong length, the old placeholder)", () => {
    expect(isValidGstin("23BJHPH4892N1ZP")).toBe(false);
    expect(isValidGstin("23BJHPH4892N1Z")).toBe(false);
    expect(isValidGstin("23AABCB1234D1ZX")).toBe(false);
    expect(isValidGstin("")).toBe(false);
  });
  it("prints the registered address", () => {
    expect(businessAddress()).toBe("162, Jay Shri Nagar, Indore, Madhya Pradesh 452005");
    expect(BUSINESS.addressLines.join(" ")).toContain("452005");
  });
  it("no placeholder company details are left in the settings", () => {
    const all = JSON.stringify(BUSINESS);
    for (const old of ["PVT LTD", "Plot 42", "AB Road", "Vijay Nagar", "452010", "AABCB"]) expect(all).not.toContain(old);
  });
});
