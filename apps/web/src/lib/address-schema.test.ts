import { describe, expect, it } from "vitest";
import { AddressInput, CheckoutAddress, MobileField, NameField } from "./address-schema";
import { summarizeZodError } from "./address-api";

const GOOD = { label: "Home", name: "Ravi Kumar", phone: "9810457632", line1: "12, 4th Cross, Indiranagar", line2: "Near Metro Station", city: "Bengaluru", state: "Karnataka", pincode: "560038", isDefault: false };
const FIELDS = ["name", "phone", "line1", "line2", "city", "state", "pincode"] as const;

const issuesOf = (r: { success: boolean; error?: any }) => (r.success ? [] : r.error.issues.map((i: any) => i.path.join(".")));

describe("AddressInput — happy path and normalisation", () => {
  it("accepts a valid address", () => {
    const r = AddressInput.safeParse(GOOD);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual(GOOD);
  });
  it("normalises name, phone, state alias and whitespace; defaults label, line2 and isDefault", () => {
    const r = AddressInput.safeParse({ name: "  Ravi   Kumar ", phone: "+91 98104-57632", line1: " 12,  4th Cross ", city: " Bengaluru ", state: "karnataka", pincode: "560038" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ label: "Home", name: "Ravi Kumar", phone: "9810457632", line1: "12, 4th Cross", line2: "", city: "Bengaluru", state: "Karnataka", pincode: "560038", isDefault: false });
  });
  it("Orissa -> Odisha", () => {
    const r = AddressInput.safeParse({ ...GOOD, state: "Orissa", pincode: "751001", city: "Bhubaneswar" });
    expect(r.success && r.data.state).toBe("Odisha");
  });
});

describe("AddressInput — India rules", () => {
  it("rejects a pincode that belongs to another state with the plain-English message (path: state)", () => {
    const r = AddressInput.safeParse({ ...GOOD, pincode: "452002" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues).toHaveLength(1);
      expect(r.error.issues[0].path).toEqual(["state"]);
      expect(r.error.issues[0].message).toBe("Pincode 452002 belongs to Madhya Pradesh, not Karnataka");
      expect(summarizeZodError(r.error)).toEqual({ error: "Pincode 452002 belongs to Madhya Pradesh, not Karnataka", issues: { state: ["Pincode 452002 belongs to Madhya Pradesh, not Karnataka"] } });
    }
  });
  it("rejects fake mobiles, fake pincodes, junk addresses, digit names, unknown states", () => {
    for (const [k, v] of [["phone", "9999999999"], ["phone", "1234567890"], ["phone", "98104"], ["pincode", "123456"], ["pincode", "000000"], ["line1", "aaaaaa"], ["line1", "asdfgh"], ["name", "12345"], ["name", "A"], ["city", "123"], ["state", "Atlantis"], ["state", ""]] as const) {
      expect(issuesOf(AddressInput.safeParse({ ...GOOD, [k]: v }))).toContain(k);
    }
  });
  it("landmark is optional but capped at 100", () => {
    expect(AddressInput.safeParse({ ...GOOD, line2: undefined }).success).toBe(true);
    expect(AddressInput.safeParse({ ...GOOD, line2: "" }).success).toBe(true);
    expect(issuesOf(AddressInput.safeParse({ ...GOOD, line2: "Near Hospital ".repeat(10) }))).toContain("line2");
  });
  it("reports every missing required field", () => {
    const r = AddressInput.safeParse({});
    expect(new Set(issuesOf(r))).toEqual(new Set(["name", "phone", "line1", "city", "state", "pincode"]));
  });
});

describe("AddressInput — injection / type confusion (nothing here may ever reach a Mongo query)", () => {
  const operators: unknown[] = [{ $ne: null }, { $gt: "" }, { $regex: ".*" }, { $where: "1==1" }, { $in: ["a"] }, ["a"], [], [{ $ne: null }], 123, 0, true, null, {}];

  it.each(FIELDS)("field %s rejects objects with operators, arrays, numbers, booleans, null", (field) => {
    for (const bad of operators) {
      const r = AddressInput.safeParse({ ...GOOD, [field]: bad });
      expect(r.success, `${field}=${JSON.stringify(bad)}`).toBe(false);
      expect(issuesOf(r)).toContain(field);
    }
  });
  it("label and isDefault reject non-enum / non-boolean values", () => {
    for (const bad of [{ $ne: null }, ["Home"], "Hacked", 1, null, "home"]) expect(issuesOf(AddressInput.safeParse({ ...GOOD, label: bad }))).toContain("label");
    for (const bad of [{ $ne: null }, "true", 1, "yes", [true]]) expect(issuesOf(AddressInput.safeParse({ ...GOOD, isDefault: bad }))).toContain("isDefault");
  });
  it("rejects prototype keys and any unknown key (strict)", () => {
    const polluted = JSON.parse('{"__proto__":{"isAdmin":true},"name":"Ravi Kumar","phone":"9810457632","line1":"12, 4th Cross","city":"Bengaluru","state":"Karnataka","pincode":"560038"}');
    expect(AddressInput.safeParse(polluted).success).toBe(false);
    expect(({} as any).isAdmin).toBeUndefined(); // no pollution
    for (const k of ["constructor", "prototype", "userId", "_id", "role", "$set", "isAdmin"]) {
      expect(AddressInput.safeParse({ ...GOOD, [k]: "x" }).success, k).toBe(false);
    }
  });
  it("rejects non-object bodies", () => {
    for (const bad of [null, undefined, "x", 5, [], [GOOD], true]) expect(AddressInput.safeParse(bad).success).toBe(false);
  });
  it("very long strings are rejected quickly (hard cap before any regex)", () => {
    const huge = "a".repeat(2_000_000);
    const t0 = Date.now();
    for (const f of FIELDS) expect(issuesOf(AddressInput.safeParse({ ...GOOD, [f]: huge }))).toContain(f);
    expect(Date.now() - t0).toBeLessThan(1000);
  });
  it("control characters, hidden characters and markup are rejected in every text field", () => {
    const bad = ["\u0000", "\n", "\r\n", "\t", "\u0007", "‮", "​", "﻿", "<script>", "{{x}}", "$ne", "\\", "`x`"];
    for (const f of ["name", "line1", "line2", "city"] as const) {
      for (const c of bad) {
        const base = f === "name" ? "Ravi" : f === "city" ? "Pune" : "Flat 12 Main Road";
        expect(issuesOf(AddressInput.safeParse({ ...GOOD, [f]: base + c + base })), `${f} + ${JSON.stringify(c)}`).toContain(f);
      }
    }
    for (const c of ["\u0000", "\n", " ", "56​0038"]) expect(AddressInput.safeParse({ ...GOOD, pincode: c }).success).toBe(false);
    expect(AddressInput.safeParse({ ...GOOD, phone: "98104\u000057632" }).success).toBe(false);
  });
  it("the 422 body never echoes the offending value or key names", () => {
    const evil = "ZZZ-SENTINEL-<script>";
    const r = AddressInput.safeParse({ ...GOOD, name: evil, label: evil, [evil]: evil });
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(summarizeZodError(r.error))).not.toContain("SENTINEL");
  });
});

describe("CheckoutAddress (create-order body)", () => {
  const addr = { line1: "12, 4th Cross, Indiranagar", line2: "", city: "Bengaluru", state: "Karnataka", pincode: "560038" };
  it("accepts and normalises", () => {
    const r = CheckoutAddress.safeParse({ ...addr, state: "KARNATAKA", line1: "  12,   4th Cross, Indiranagar " });
    expect(r.success && r.data).toEqual(addr);
    expect(CheckoutAddress.safeParse({ line1: addr.line1, city: addr.city, state: addr.state, pincode: addr.pincode }).success).toBe(true); // line2 omitted
  });
  it("rejects a state/pincode mismatch on `state` with the clear message", () => {
    const r = CheckoutAddress.safeParse({ ...addr, state: "Maharashtra" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]).toMatchObject({ path: ["state"], message: "Pincode 560038 belongs to Karnataka, not Maharashtra" });
  });
  it("rejects operator objects / arrays / junk in every field", () => {
    for (const f of ["line1", "city", "state", "pincode"] as const) {
      for (const bad of [{ $ne: null }, ["x"], 1, null]) expect(CheckoutAddress.safeParse({ ...addr, [f]: bad }).success, `${f}=${JSON.stringify(bad)}`).toBe(false);
    }
    expect(CheckoutAddress.safeParse({ ...addr, line1: "aaaaaa" }).success).toBe(false);
    expect(CheckoutAddress.safeParse(null).success).toBe(false);
  });
  it("name and phone fields used at the top level of the create-order body", () => {
    expect(NameField.safeParse("Ravi Kumar").success).toBe(true);
    expect(NameField.safeParse("Ravi 2").success).toBe(false);
    expect(NameField.safeParse({ $ne: null }).success).toBe(false);
    expect(MobileField.safeParse("+91 98104 57632")).toMatchObject({ success: true, data: "9810457632" });
    expect(MobileField.safeParse("9999999999").success).toBe(false);
    expect(MobileField.safeParse({ $gt: "" }).success).toBe(false);
  });
});
