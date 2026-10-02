import { describe, it, expect } from "vitest";
import { ChangePasswordSchema, DeleteAccountSchema, PasswordSchema, ProfileUpdateSchema, fieldErrors } from "./profile-schema";
import { passwordProblem, phoneProblem } from "./profile-rules";

describe("ProfileUpdateSchema", () => {
  it("trims names and accepts a valid mobile number", () => {
    const r = ProfileUpdateSchema.parse({ firstName: "  Jitesh ", lastName: " Bawaskar", phone: "98765 43210" });
    expect(r).toEqual({ firstName: "Jitesh", lastName: "Bawaskar", phone: "9876543210" });
  });
  it("allows an empty phone (means: remove it) and an omitted phone", () => {
    expect(ProfileUpdateSchema.parse({ firstName: "A", lastName: "B", phone: "" }).phone).toBe("");
    expect(ProfileUpdateSchema.parse({ firstName: "A", lastName: "B" }).phone).toBeUndefined();
  });
  it("rejects phones that are not ^[6-9]\\d{9}$", () => {
    for (const phone of ["1234567890", "5876543210", "987654321", "98765432101", "98765abcde", "+919876543210"]) {
      expect(ProfileUpdateSchema.safeParse({ firstName: "A", lastName: "B", phone }).success, phone).toBe(false);
    }
  });
  it("requires names and caps them at 50 characters", () => {
    expect(ProfileUpdateSchema.safeParse({ firstName: "   ", lastName: "B" }).success).toBe(false);
    expect(ProfileUpdateSchema.safeParse({ firstName: "A", lastName: "" }).success).toBe(false);
    expect(ProfileUpdateSchema.safeParse({ firstName: "x".repeat(50), lastName: "B" }).success).toBe(true);
    expect(ProfileUpdateSchema.safeParse({ firstName: "x".repeat(51), lastName: "B" }).success).toBe(false);
    expect(ProfileUpdateSchema.safeParse({ lastName: "B" }).success).toBe(false);
  });
  it("is strict: cannot smuggle role / email / avatar fields", () => {
    expect(ProfileUpdateSchema.safeParse({ firstName: "A", lastName: "B", role: "admin" }).success).toBe(false);
    expect(ProfileUpdateSchema.safeParse({ firstName: "A", lastName: "B", email: "x@y.co" }).success).toBe(false);
  });
  it("reports one message per field", () => {
    const r = ProfileUpdateSchema.safeParse({ firstName: "", lastName: "ok", phone: "123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(["firstName", "phone"]);
  });
});

describe("password strength (same rule as registration)", () => {
  it("accepts 8+ chars with upper, lower and a digit", () => {
    expect(PasswordSchema.safeParse("Raven2026x").success).toBe(true);
    expect(passwordProblem("Raven2026x")).toBeNull();
  });
  it("rejects short, no-uppercase, no-lowercase and no-digit passwords", () => {
    for (const pw of ["Ab1", "raven2026x", "RAVEN2026X", "RavenRavenx"]) {
      expect(PasswordSchema.safeParse(pw).success, pw).toBe(false);
      expect(passwordProblem(pw), pw).not.toBeNull();
    }
  });
  it("rejects > 128 characters and anything over bcrypt's 72-byte limit", () => {
    expect(PasswordSchema.safeParse("Aa1" + "x".repeat(126)).success).toBe(false);
    expect(PasswordSchema.safeParse("Aa1" + "x".repeat(69)).success).toBe(true); // exactly 72 bytes
    expect(PasswordSchema.safeParse("Aa1" + "x".repeat(70)).success).toBe(false); // 73 bytes
    expect(PasswordSchema.safeParse("Aa1" + "é".repeat(35)).success).toBe(false); // 73 chars? 2-byte letters: 3 + 70 bytes = 73
    expect(passwordProblem("Aa1" + "x".repeat(70))).toBe("Password must be at most 72 characters");
  });
});

describe("ChangePasswordSchema", () => {
  it("needs the current password and a strong, different new one", () => {
    expect(ChangePasswordSchema.safeParse({ currentPassword: "Old2026pass", newPassword: "New2026pass" }).success).toBe(true);
    expect(ChangePasswordSchema.safeParse({ currentPassword: "", newPassword: "New2026pass" }).success).toBe(false);
    expect(ChangePasswordSchema.safeParse({ currentPassword: "Old2026pass", newPassword: "weak" }).success).toBe(false);
    expect(ChangePasswordSchema.safeParse({ currentPassword: "Same2026pass", newPassword: "Same2026pass" }).success).toBe(false);
    expect(ChangePasswordSchema.safeParse({ newPassword: "New2026pass" }).success).toBe(false);
  });
});

describe("DeleteAccountSchema", () => {
  it("requires the exact word DELETE (case-sensitive) and a password", () => {
    expect(DeleteAccountSchema.safeParse({ confirm: "DELETE", password: "x" }).success).toBe(true);
    for (const confirm of ["delete", "Delete", "DELETE ", "", "REMOVE"]) {
      expect(DeleteAccountSchema.safeParse({ confirm, password: "x" }).success, confirm).toBe(false);
    }
    expect(DeleteAccountSchema.safeParse({ confirm: "DELETE", password: "" }).success).toBe(false);
    expect(DeleteAccountSchema.safeParse({ confirm: "DELETE" }).success).toBe(false);
  });
});

describe("phoneProblem (client helper)", () => {
  it("matches the server rule", () => {
    expect(phoneProblem("")).toBeNull();
    expect(phoneProblem("98765-43210")).toBeNull();
    expect(phoneProblem("12345")).not.toBeNull();
  });
});
