import { describe, expect, it } from "vitest";
import { MAX_DISCOUNT_PERCENT, parseDiscountInput, percentOff, priceFromDiscount } from "./discount";

describe("priceFromDiscount", () => {
  it("20% off ₹2,999 is exactly ₹2,399 (whole rupees)", () => {
    expect(priceFromDiscount(299900, 20)).toBe(239900);
  });
  it("0% leaves the MRP unchanged", () => {
    expect(priceFromDiscount(199900, 0)).toBe(199900);
  });
  it("reads back as the same % the storefront shows", () => {
    for (const mrp of [49900, 99900, 129900, 199900, 299900, 349900, 459900]) {
      for (const pct of [5, 10, 15, 20, 25, 30, 33, 40, 50, 60, 70]) {
        expect(percentOff(priceFromDiscount(mrp, pct), mrp)).toBe(pct);
      }
    }
  });
  it("never returns a fractional rupee", () => {
    for (const pct of [7, 12.5, 18, 22.5, 33]) expect(priceFromDiscount(129900, pct) % 100).toBe(0);
  });
  it("clamps nonsense: above 90% → 90%, negative → 0%, NaN → 0%", () => {
    expect(priceFromDiscount(100000, 150)).toBe(priceFromDiscount(100000, MAX_DISCOUNT_PERCENT));
    expect(priceFromDiscount(100000, -20)).toBe(100000);
    expect(priceFromDiscount(100000, NaN)).toBe(100000);
  });
  it("never goes below ₹1 or above the MRP, and handles an empty MRP", () => {
    expect(priceFromDiscount(150, 90)).toBeGreaterThanOrEqual(100);
    expect(priceFromDiscount(150, 90)).toBeLessThanOrEqual(150);
    expect(priceFromDiscount(0, 20)).toBe(0);
  });
});

describe("parseDiscountInput", () => {
  it("accepts numbers and numeric strings", () => {
    expect(parseDiscountInput("20")).toBe(20);
    expect(parseDiscountInput(12.5)).toBe(12.5);
  });
  it("blank / junk → null (no discount typed)", () => {
    expect(parseDiscountInput("")).toBeNull();
    expect(parseDiscountInput("  ")).toBeNull();
    expect(parseDiscountInput("abc")).toBeNull();
    expect(parseDiscountInput(null)).toBeNull();
    expect(parseDiscountInput(undefined)).toBeNull();
  });
  it("clamps to 0–90", () => {
    expect(parseDiscountInput("-5")).toBe(0);
    expect(parseDiscountInput("95")).toBe(MAX_DISCOUNT_PERCENT);
  });
});
