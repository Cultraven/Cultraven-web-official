import { describe, expect, it } from "vitest";
import {
  INDIA_STATES, canonicalState, firstAddressError, isObviouslyFakeMobile, isObviouslyFakePincode, looksLikeJunkText, normalizeMobile,
  normalizeText, statesForPincode, suggestState, validateAddress, validateAddressLine, validateCity, validateLandmark, validateMobile,
  validateName, validatePincode, validatePincodeState, validateState,
} from "./address-validation";
// One real pincode per (3-digit prefix, state) combination in the India Post "All India Pincode Directory" (154,754 post offices).
import samples from "./__fixtures__/pincode-state-samples.json";

const GOOD = { name: "Ravi Kumar", phone: "9810457632", pincode: "560038", city: "Bengaluru", state: "Karnataka", line1: "12, 4th Cross, Indiranagar", line2: "Near Metro Station" };

describe("pincode format", () => {
  it("accepts real 6-digit pincodes", () => {
    for (const p of ["110001", "560001", "400001", "682001", "799001", "744101", "403001"]) expect(validatePincode(p)).toEqual({ ok: true, value: p });
  });
  it("rejects wrong length, letters, leading zero and non-strings with a clear message", () => {
    expect(validatePincode("")).toMatchObject({ ok: false });
    expect(validatePincode("56001")).toMatchObject({ ok: false, message: expect.stringContaining("exactly 6 digits") });
    expect(validatePincode("5600011")).toMatchObject({ ok: false });
    expect(validatePincode("56A001")).toMatchObject({ ok: false, message: expect.stringContaining("digits only") });
    expect(validatePincode("012345")).toMatchObject({ ok: false, message: expect.stringContaining("start with 0") });
    expect(validatePincode("000000")).toMatchObject({ ok: false });
    expect(validatePincode(560001 as unknown)).toMatchObject({ ok: false });
    expect(validatePincode({ $ne: null } as unknown)).toMatchObject({ ok: false });
  });
  it("rejects obviously fake pincodes (same digit, sequential)", () => {
    for (const p of ["111111", "222222", "999999", "123456", "234567", "345678", "456789", "654321", "987654", "876543"]) {
      expect(isObviouslyFakePincode(p)).toBe(true);
      expect(validatePincode(p)).toMatchObject({ ok: false });
    }
  });
  it("does NOT reject repeating-block pincodes that genuinely exist (403403, 141414…)", () => {
    for (const p of ["403403", "141414", "505505", "609609"]) expect(validatePincode(p).ok).toBe(true);
  });
});

describe("pincode prefix -> state (India Post circles)", () => {
  it("covers every state/UT in the canonical list", () => {
    const seen = new Set<string>();
    for (const [pin] of samples as [string, string][]) { const s = statesForPincode(pin); if (Array.isArray(s)) s.forEach((x) => seen.add(x)); }
    expect(INDIA_STATES.filter((s) => !seen.has(s))).toEqual([]);
  });

  it("accepts every real pincode/state pair from the India Post directory sample (422 prefix-district combos)", () => {
    const failures: string[] = [];
    for (const [pin, state] of samples as [string, string][]) {
      const r = validatePincodeState(pin, state);
      if (!r.ok) failures.push(`${pin} ${state}: ${r.message}`);
    }
    expect(failures).toEqual([]);
    expect((samples as unknown[]).length).toBeGreaterThan(400);
  });

  it("the spec example: 452002 is Madhya Pradesh, not Karnataka", () => {
    expect(validatePincodeState("452002", "Karnataka")).toMatchObject({ ok: false, message: "Pincode 452002 belongs to Madhya Pradesh, not Karnataka" });
    expect(validatePincodeState("452002", "Madhya Pradesh")).toEqual({ ok: true });
  });

  it("border and shared sorting districts are generous", () => {
    expect(validatePincodeState("244001", "Uttar Pradesh").ok).toBe(true);
    expect(validatePincodeState("248001", "Uttarakhand").ok).toBe(true);
    expect(validatePincodeState("263001", "Uttarakhand").ok).toBe(true);
    expect(validatePincodeState("396210", "Daman & Diu").ok).toBe(true);
    expect(validatePincodeState("396230", "Dadra & Nagar Haveli").ok).toBe(true);
    expect(validatePincodeState("362520", "Daman & Diu").ok).toBe(true);
    expect(validatePincodeState("403001", "Goa").ok).toBe(true);
    expect(validatePincodeState("400001", "Maharashtra").ok).toBe(true);
    expect(validatePincodeState("605001", "Puducherry").ok).toBe(true);
    expect(validatePincodeState("605602", "Tamil Nadu").ok).toBe(true);
    expect(validatePincodeState("673310", "Puducherry").ok).toBe(true); // Mahe
    expect(validatePincodeState("533464", "Puducherry").ok).toBe(true); // Yanam
    expect(validatePincodeState("609602", "Puducherry").ok).toBe(true); // Karaikal
    expect(validatePincodeState("682001", "Kerala").ok).toBe(true);
    expect(validatePincodeState("682555", "Lakshadweep").ok).toBe(true);
    expect(validatePincodeState("737101", "Sikkim").ok).toBe(true);
    expect(validatePincodeState("744101", "Andaman & Nicobar").ok).toBe(true);
    expect(validatePincodeState("734001", "West Bengal").ok).toBe(true);
    expect(validatePincodeState("500001", "Telangana").ok).toBe(true);
    expect(validatePincodeState("520001", "Andhra Pradesh").ok).toBe(true);
    expect(validatePincodeState("194101", "Ladakh").ok).toBe(true);
    expect(validatePincodeState("194101", "Jammu & Kashmir").ok).toBe(true);
    expect(validatePincodeState("160017", "Chandigarh").ok).toBe(true);
    expect(validatePincodeState("800001", "Bihar").ok).toBe(true);
    expect(validatePincodeState("834001", "Jharkhand").ok).toBe(true);
    expect(validatePincodeState("814101", "Jharkhand").ok).toBe(true);
    expect(validatePincodeState("814101", "Bihar").ok).toBe(true);
  });

  it("north-east: the 3-digit sorting district pins the state", () => {
    expect(validatePincodeState("781001", "Assam").ok).toBe(true);
    expect(validatePincodeState("791111", "Arunachal Pradesh").ok).toBe(true);
    expect(validatePincodeState("793001", "Meghalaya").ok).toBe(true);
    expect(validatePincodeState("795001", "Manipur").ok).toBe(true);
    expect(validatePincodeState("796001", "Mizoram").ok).toBe(true);
    expect(validatePincodeState("797001", "Nagaland").ok).toBe(true);
    expect(validatePincodeState("799001", "Tripura").ok).toBe(true);
    expect(validatePincodeState("795001", "Tripura")).toMatchObject({ ok: false, message: "Pincode 795001 belongs to Manipur, not Tripura" });
  });

  it("rejects clear mismatches with the allowed states in the message", () => {
    expect(validatePincodeState("110001", "Maharashtra")).toMatchObject({ ok: false, message: "Pincode 110001 belongs to Delhi, not Maharashtra" });
    expect(validatePincodeState("400001", "Goa")).toMatchObject({ ok: false, message: "Pincode 400001 belongs to Maharashtra, not Goa" });
    expect(validatePincodeState("403001", "Maharashtra")).toMatchObject({ ok: false, message: "Pincode 403001 belongs to Goa, not Maharashtra" });
    expect(validatePincodeState("244001", "Karnataka")).toMatchObject({ ok: false, message: "Pincode 244001 belongs to Uttar Pradesh or Uttarakhand, not Karnataka" });
    expect(validatePincodeState("560001", "Tamil Nadu")).toMatchObject({ ok: false, allowed: ["Karnataka"] });
    expect(validatePincodeState("737101", "West Bengal")).toMatchObject({ ok: false });
  });

  it("Army Postal Service (9x) is not checked; unallocated prefixes are rejected", () => {
    expect(validatePincodeState("901234", "Karnataka")).toEqual({ ok: true });
    expect(validatePincodeState("998877", "Punjab")).toEqual({ ok: true });
    for (const p of ["101010", "291234", "351234", "541234", "551234", "651234", "661234", "861234", "881234"]) {
      expect(validatePincodeState(p, "Karnataka")).toMatchObject({ ok: false, message: expect.stringContaining("isn't a valid Indian PIN") });
    }
  });

  it("accepts state aliases and rejects unknown states", () => {
    expect(validatePincodeState("751001", "Orissa").ok).toBe(true);
    expect(validatePincodeState("492001", "Chattisgarh").ok).toBe(true);
    expect(validatePincodeState("110001", "NCT of Delhi").ok).toBe(true);
    expect(validatePincodeState("560001", "Narnia")).toMatchObject({ ok: false, message: "Select a valid state" });
    expect(validatePincodeState("560001", "")).toMatchObject({ ok: false });
    expect(validatePincodeState("12345", "Karnataka")).toMatchObject({ ok: false });
  });

  it("suggestState offers India Post's answer when the table agrees, else the table's state", () => {
    expect(suggestState("452002")).toBe("Madhya Pradesh");
    expect(suggestState("244001", "Uttarakhand")).toBe("Uttarakhand");
    expect(suggestState("244001", "Karnataka")).toBe("Uttar Pradesh");
    expect(suggestState("901234", "Karnataka")).toBe("Karnataka");
  });
});

describe("canonicalState", () => {
  it("maps spellings used by India Post and OpenStreetMap", () => {
    expect(canonicalState("karnataka")).toBe("Karnataka");
    expect(canonicalState("  TAMIL NADU ")).toBe("Tamil Nadu");
    expect(canonicalState("Tamilnadu")).toBe("Tamil Nadu");
    expect(canonicalState("Pondicherry")).toBe("Puducherry");
    expect(canonicalState("CHATTISGARH")).toBe("Chhattisgarh");
    expect(canonicalState("Andaman and Nicobar Islands")).toBe("Andaman & Nicobar");
    expect(canonicalState("ANDAMAN & NICOBAR ISLANDS")).toBe("Andaman & Nicobar");
    expect(canonicalState("Jammu and Kashmir")).toBe("Jammu & Kashmir");
    expect(canonicalState("Dadra and Nagar Haveli")).toBe("Dadra & Nagar Haveli");
    expect(canonicalState("Telengana")).toBe("Telangana");
  });
  it("splits the merged UT by pincode", () => {
    expect(canonicalState("Dadra and Nagar Haveli and Daman and Diu", "396210")).toBe("Daman & Diu");
    expect(canonicalState("Dadra and Nagar Haveli and Daman and Diu", "362520")).toBe("Daman & Diu");
    expect(canonicalState("Dadra and Nagar Haveli and Daman and Diu", "396230")).toBe("Dadra & Nagar Haveli");
  });
  it("returns null for junk, objects and long input", () => {
    expect(canonicalState("")).toBeNull();
    expect(canonicalState("Atlantis")).toBeNull();
    expect(canonicalState({ $ne: null })).toBeNull();
    expect(canonicalState(["Karnataka"])).toBeNull();
    expect(canonicalState("a".repeat(500))).toBeNull();
  });
  it("every canonical name maps to itself", () => { for (const s of INDIA_STATES) expect(canonicalState(s)).toBe(s); });
});

describe("name", () => {
  it("accepts real names incl. initials, apostrophes, hyphens and Indic scripts", () => {
    for (const n of ["Ravi Kumar", "A. P. J. Abdul Kalam", "D'Souza", "Anne-Marie O'Neil", "Rajesh K.", "रवि कुमार", "முருகன் சுந்தரம்", "Li"]) expect(validateName(n).ok).toBe(true);
  });
  it("normalises spaces and trims", () => { expect(validateName("  Ravi    Kumar ")).toEqual({ ok: true, value: "Ravi Kumar" }); });
  it("rejects empty, 1 char, > 60, digits, symbols, junk and hidden characters", () => {
    expect(validateName("")).toMatchObject({ ok: false });
    expect(validateName("A")).toMatchObject({ ok: false, message: "Name is too short" });
    expect(validateName("A".repeat(61).replace(/(.{5})/g, "$1 "))).toMatchObject({ ok: false });
    expect(validateName("R".repeat(5) + " Kumar")).toMatchObject({ ok: false });
    expect(validateName("12345")).toMatchObject({ ok: false, message: "Name can't contain numbers" });
    expect(validateName("Ravi2")).toMatchObject({ ok: false });
    expect(validateName("Ravi <b>")).toMatchObject({ ok: false });
    expect(validateName("Ravi; DROP TABLE")).toMatchObject({ ok: false });
    expect(validateName(".. ..")).toMatchObject({ ok: false });
    expect(validateName("asdfgh qwerty")).toMatchObject({ ok: false });
    expect(validateName("Ravi\nKumar")).toMatchObject({ ok: false });
    expect(validateName("Ravi\u0000")).toMatchObject({ ok: false });
    expect(validateName("Ravi‮Kumar")).toMatchObject({ ok: false });
    expect(validateName({ $ne: null } as unknown)).toMatchObject({ ok: false });
    expect(validateName(["Ravi"] as unknown)).toMatchObject({ ok: false });
  });
});

describe("mobile", () => {
  it("accepts valid Indian mobiles and normalises +91 / 0 / 91 / separators", () => {
    expect(validateMobile("9810457632")).toEqual({ ok: true, value: "9810457632" });
    expect(validateMobile("+91 98104 57632")).toEqual({ ok: true, value: "9810457632" });
    expect(validateMobile("919810457632")).toEqual({ ok: true, value: "9810457632" });
    expect(validateMobile("09810457632")).toEqual({ ok: true, value: "9810457632" });
    expect(validateMobile("(981) 045-7632")).toEqual({ ok: true, value: "9810457632" });
    expect(validateMobile("6204957183").ok).toBe(true);
    expect(normalizeMobile("+91-9810457632")).toBe("9810457632");
  });
  it("rejects wrong length, wrong first digit, letters and non-strings", () => {
    expect(validateMobile("")).toMatchObject({ ok: false });
    expect(validateMobile("98104576")).toMatchObject({ ok: false, message: expect.stringContaining("10 digits") });
    expect(validateMobile("98104576321")).toMatchObject({ ok: false });
    expect(validateMobile("5810457632")).toMatchObject({ ok: false, message: expect.stringContaining("start with 6, 7, 8 or 9") });
    expect(validateMobile("1234567890")).toMatchObject({ ok: false });
    expect(validateMobile("98104ABCDE")).toMatchObject({ ok: false });
    expect(validateMobile({ $gt: "" } as unknown)).toMatchObject({ ok: false });
    expect(validateMobile(9810457632 as unknown)).toMatchObject({ ok: false });
  });
  it("rejects obviously fake numbers", () => {
    for (const n of ["9999999999", "8888888888", "6666666666", "9000000000", "9898989898", "9876543210", "6789012345", "7890123456", "9912345678"]) {
      expect(isObviouslyFakeMobile(n)).toBe(true);
      expect(validateMobile(n)).toMatchObject({ ok: false });
    }
  });
  it("does not reject realistic numbers", () => {
    for (const n of ["9810457632", "9845012367", "7208765431", "8095123470", "9004455667", "6381204957"]) expect(validateMobile(n).ok).toBe(true);
  });
});

describe("address line 1", () => {
  it("accepts typical Indian addresses", () => {
    for (const l of ["12, 4th Cross, Indiranagar", "Flat 4B, Sky Heights, MG Road", "H.No. 23/4, Gali No. 5, Laxmi Nagar", "Plot 17 Sector 21 Dwarka", "बी-12, गांधी नगर", "S/o Ram Singh, Village Kheda, PO Dabra"]) expect(validateAddressLine(l).ok).toBe(true);
  });
  it("min 5, max 150, needs a letter", () => {
    expect(validateAddressLine("12 A")).toMatchObject({ ok: false, message: expect.stringContaining("too short") });
    expect(validateAddressLine("")).toMatchObject({ ok: false });
    expect(validateAddressLine("x".repeat(151))).toMatchObject({ ok: false });
    expect(validateAddressLine(("Street " + "a1 ".repeat(60)).slice(0, 150)).ok).toBe(true);
    expect(validateAddressLine("12345 6789")).toMatchObject({ ok: false, message: expect.stringContaining("numbers alone") });
    expect(validateAddressLine("12/3, 4-5")).toMatchObject({ ok: false });
  });
  it("rejects repeated-character and keyboard junk", () => {
    for (const j of ["aaaaaa", "asdfgh", "qwerty", "abcdef", "zxcvbn", "xxxxxxx", "ababab", "test", "Flat sdfghj"]) {
      expect(looksLikeJunkText(j)).toBe(true);
    }
    for (const j of ["aaaaaa", "asdfgh", "qwerty"]) expect(validateAddressLine(j)).toMatchObject({ ok: false });
    expect(validateAddressLine("Flat 12 aaaaaaa Road")).toMatchObject({ ok: false });
  });
  it("does not flag real words", () => {
    for (const w of ["Hanumangarh Road", "Vijayawada Bypass", "Kasturba Gandhi Marg", "Sector 62 Noida", "Opp. Reliance Fresh, Andheri West"]) expect(looksLikeJunkText(w)).toBe(false);
  });
  it("rejects injection characters and control characters", () => {
    for (const bad of ["12 <script>alert(1)</script> Road", "Flat {{7*7}}", "12 Main St $ne", "Flat 12\\Road", "Main road | ls", "12 `whoami` road", "Flat 4\nRoad X", "Flat 4\tRoad X", "Flat\u0000 12 Road", "Flat 12 Road​", "Flat 12 Road﻿"]) {
      expect(validateAddressLine(bad)).toMatchObject({ ok: false });
    }
    expect(validateAddressLine({ $ne: null } as unknown)).toMatchObject({ ok: false });
    expect(validateAddressLine(["12 Main Road"] as unknown)).toMatchObject({ ok: false });
  });
  it("collapses whitespace", () => { expect(validateAddressLine("  12,   Main   Road ")).toEqual({ ok: true, value: "12, Main Road" }); });
});

describe("landmark (optional)", () => {
  it("empty, undefined and null are fine", () => {
    for (const v of ["", "   ", undefined, null]) expect(validateLandmark(v)).toEqual({ ok: true, value: "" });
  });
  it("accepts a normal landmark up to 100 chars", () => {
    expect(validateLandmark("Near City Mall")).toEqual({ ok: true, value: "Near City Mall" });
    expect(validateLandmark("a b ".repeat(25).trim()).ok).toBe(false); // looks like junk (two letters only)
    expect(validateLandmark(("Opposite Government School Building " + "Road ".repeat(20)).slice(0, 100)).ok).toBe(true);
  });
  it("rejects > 100, numbers only, junk, symbols and non-strings", () => {
    expect(validateLandmark("Near Hospital ".repeat(8))).toMatchObject({ ok: false });
    expect(validateLandmark("12345")).toMatchObject({ ok: false });
    expect(validateLandmark("aaaaa")).toMatchObject({ ok: false });
    expect(validateLandmark("Near <b>mall</b>")).toMatchObject({ ok: false });
    expect(validateLandmark({ $ne: 1 } as unknown)).toMatchObject({ ok: false });
    expect(validateLandmark(5 as unknown)).toMatchObject({ ok: false });
  });
});

describe("city and state", () => {
  it("accepts real city / district names", () => {
    for (const c of ["Bengaluru", "New Delhi", "Y.S.R. Kadapa", "Janjgir-Champa", "Pondicherry", "Kamrup Metropolitan", "Sri Ganganagar", "भोपाल"]) expect(validateCity(c).ok).toBe(true);
  });
  it("rejects digits, symbols, junk and over-long values", () => {
    for (const c of ["", "A", "Pune 411001", "12345", "Mumbai<script>", "aaaaaa", "Delhi\n", "x".repeat(61)]) expect(validateCity(c)).toMatchObject({ ok: false });
    expect(validateCity({ $ne: null } as unknown)).toMatchObject({ ok: false });
  });
  it("state must be in the canonical list", () => {
    expect(validateState("Karnataka")).toEqual({ ok: true, value: "Karnataka" });
    expect(validateState("orissa")).toEqual({ ok: true, value: "Odisha" });
    expect(validateState("")).toMatchObject({ ok: false, message: "Select your state" });
    expect(validateState("Gondwana")).toMatchObject({ ok: false, message: "Select a state from the list" });
    expect(validateState({ $ne: null } as unknown)).toMatchObject({ ok: false });
  });
});

describe("validateAddress (whole form)", () => {
  it("passes a good address and returns normalised values", () => {
    const r = validateAddress({ ...GOOD, name: "  Ravi   Kumar ", phone: "+91 98104-57632", state: "karnataka" });
    expect(r).toEqual({ ok: true, value: { ...GOOD, name: "Ravi Kumar", phone: "9810457632", state: "Karnataka" } });
  });
  it("reports every empty required field", () => {
    const r = validateAddress({ name: "", phone: "", pincode: "", city: "", state: "", line1: "", line2: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["city", "line1", "name", "phone", "pincode", "state"]);
  });
  it("landmark is optional", () => { expect(validateAddress({ ...GOOD, line2: "" }).ok).toBe(true); expect(validateAddress({ ...GOOD, line2: undefined }).ok).toBe(true); });
  it("puts the pincode/state mismatch on state", () => {
    const r = validateAddress({ ...GOOD, pincode: "452002" });
    expect(r).toEqual({ ok: false, errors: { state: "Pincode 452002 belongs to Madhya Pradesh, not Karnataka" } });
  });
  it("does not report a mismatch while the pincode itself is invalid", () => {
    const r = validateAddress({ ...GOOD, pincode: "4520" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toEqual(["pincode"]);
  });
  it("tolerates missing keys and wrong types without throwing", () => {
    expect(validateAddress({}).ok).toBe(false);
    expect(validateAddress({ name: { $ne: null }, phone: [1], pincode: 560038, city: null, state: undefined, line1: {}, line2: 5 }).ok).toBe(false);
  });
  it("firstAddressError follows the visual field order", () => {
    expect(firstAddressError({ line1: "L", name: "N", state: "S" })).toBe("N");
    expect(firstAddressError({})).toBeNull();
  });
});

describe("normalizeText", () => {
  it("NFC-normalises and collapses spaces", () => {
    expect(normalizeText("  a    b ")).toBe("a b");
    expect(normalizeText("é")).toBe("é");
  });
});
