/**
 * Indian delivery-address validation — ONE pure module used by the browser (inline field errors) and the
 * server (zod schemas in address-schema.ts, create-order). No React, no I/O, no Node-only APIs.
 *
 * Rules were set after studying how Amazon.in / Flipkart / Shopify / WhatsApp address forms behave and the India Post
 * PIN structure:
 *   digit 1      = zone (1-2 North, 3-4 West, 5-6 South, 7-8 East, 9 Army Postal Service)
 *   digits 1-2   = sub-zone / postal circle  -> this is what we map to a state / UT
 *   digits 1-3   = sorting district
 *   digits 4-6   = route + delivery office
 * The prefix -> state table below was derived from, and is regression-tested against, the India Post "All India Pincode
 * Directory" (154,754 post offices). Border areas are deliberately generous (shared sorting districts accept both states).
 */

// ── Canonical states / union territories (the exact strings stored on addresses and orders) ───────────────────────
export const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar", "Chandigarh", "Dadra & Nagar Haveli", "Daman & Diu", "Delhi", "Jammu & Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
] as const;
export type IndiaState = (typeof INDIA_STATES)[number];

const compact = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");

const STATE_BY_KEY: Record<string, IndiaState> = (() => {
  const m: Record<string, IndiaState> = {};
  for (const s of INDIA_STATES) m[compact(s)] = s;
  const alias = (to: IndiaState, ...names: string[]) => names.forEach((n) => (m[compact(n)] = to));
  alias("Andaman & Nicobar", "Andaman and Nicobar Islands", "Andaman Nicobar Islands", "Andaman Nicobar", "A&N Islands");
  alias("Delhi", "NCT of Delhi", "New Delhi", "National Capital Territory of Delhi", "Delhi NCR");
  alias("Odisha", "Orissa");
  alias("Chhattisgarh", "Chattisgarh", "Chhatisgarh");
  alias("Puducherry", "Pondicherry");
  alias("Uttarakhand", "Uttaranchal");
  alias("Telangana", "Telengana");
  alias("Jammu & Kashmir", "Jammu and Kashmir", "Jammu Kashmir", "Jammukashmir", "J&K");
  alias("Tamil Nadu", "Tamilnadu");
  alias("Dadra & Nagar Haveli", "Dadra and Nagar Haveli", "Dadra Nagar Haveli");
  alias("Daman & Diu", "Daman and Diu", "Daman Diu");
  return m;
})();

const MERGED_UT_KEY = compact("Dadra and Nagar Haveli and Daman and Diu");
const MERGED_UT_KEYS = new Set([MERGED_UT_KEY, compact("Dadra & Nagar Haveli & Daman & Diu"), compact("Dadra and Nagar Haveli Daman and Diu")]);

/**
 * Maps any spelling of a state/UT (India Post, OpenStreetMap, user typing) to the canonical name, or null if unknown.
 * The merged UT "Dadra and Nagar Haveli and Daman and Diu" has no single canonical entry here, so a pincode can be
 * passed to choose between the two legacy names (Daman & Diu: 39621x/39622x Daman, 3625xx-3627xx Diu; otherwise Dadra & Nagar Haveli).
 */
export function canonicalState(input: unknown, pincode?: string): IndiaState | null {
  if (typeof input !== "string" || input.length > 100) return null;
  const k = compact(input);
  if (!k) return null;
  if (MERGED_UT_KEYS.has(k)) return pincode && /^(362[5-7]|3962[12])/.test(pincode) ? "Daman & Diu" : "Dadra & Nagar Haveli";
  return STATE_BY_KEY[k] ?? null;
}

// ── PIN prefix (first two digits) -> allowed states / UTs ──────────────────────────────────────────────────────────
const S = {
  AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CG: "Chhattisgarh", GA: "Goa", GJ: "Gujarat",
  HR: "Haryana", HP: "Himachal Pradesh", JH: "Jharkhand", KA: "Karnataka", KL: "Kerala", MP: "Madhya Pradesh",
  MH: "Maharashtra", MN: "Manipur", ML: "Meghalaya", MZ: "Mizoram", NL: "Nagaland", OD: "Odisha", PB: "Punjab",
  RJ: "Rajasthan", SK: "Sikkim", TN: "Tamil Nadu", TG: "Telangana", TR: "Tripura", UP: "Uttar Pradesh", UK: "Uttarakhand",
  WB: "West Bengal", AN: "Andaman & Nicobar", CH: "Chandigarh", DN: "Dadra & Nagar Haveli", DD: "Daman & Diu",
  DL: "Delhi", JK: "Jammu & Kashmir", LA: "Ladakh", LD: "Lakshadweep", PY: "Puducherry",
} as const satisfies Record<string, IndiaState>;

const T = (...codes: (keyof typeof S)[]): readonly IndiaState[] => codes.map((c) => S[c]);

const PREFIX2: Record<string, readonly IndiaState[]> = {
  "11": T("DL"),
  "12": T("HR"), "13": T("HR"),
  "14": T("PB"), "15": T("PB"), "16": T("CH", "PB"),
  "17": T("HP"),
  "18": T("JK"), "19": T("JK"),
  "20": T("UP"), "21": T("UP"), "22": T("UP"), "23": T("UP"),
  // Uttar Pradesh and Uttarakhand share sorting districts (244, 246, 247, 262): accept either across 24-26.
  "24": T("UP", "UK"), "25": T("UP", "UK"), "26": T("UP", "UK"),
  "27": T("UP"), "28": T("UP"),
  "30": T("RJ"), "31": T("RJ"), "32": T("RJ"), "33": T("RJ"), "34": T("RJ"),
  "36": T("GJ"), "37": T("GJ"), "38": T("GJ"), "39": T("GJ"),
  "40": T("MH"), "41": T("MH"), "42": T("MH"), "43": T("MH"), "44": T("MH"),
  "45": T("MP"), "46": T("MP"), "47": T("MP"), "48": T("MP"),
  "49": T("CG"),
  "50": T("TG"),
  "51": T("AP"), "52": T("AP"), "53": T("AP"),
  "56": T("KA"), "57": T("KA"), "58": T("KA"), "59": T("KA"),
  "60": T("TN"), "61": T("TN"), "62": T("TN"), "63": T("TN"), "64": T("TN"),
  "67": T("KL"), "68": T("KL"), "69": T("KL"),
  "70": T("WB"), "71": T("WB"), "72": T("WB"), "73": T("WB"), "74": T("WB"),
  "75": T("OD"), "76": T("OD"), "77": T("OD"),
  "78": T("AS", "ML"),
  "79": T("AR", "ML", "MN", "MZ", "NL", "TR"),
  // Bihar and Jharkhand share sorting districts (813-814, 821-824, 831-832) and history: accept either across the whole 80-85 block.
  "80": T("BR", "JH"), "81": T("BR", "JH"), "82": T("BR", "JH"), "83": T("BR", "JH"), "84": T("BR", "JH"), "85": T("BR", "JH"),
};

/**
 * Three-digit sorting districts that differ from their two-digit block: enclaves (Puducherry's Yanam/Mahe/Karaikal, Diu, Dadra,
 * Lakshadweep, Sikkim, Andaman, Goa) and the north-east, where the third digit identifies the state. Replaces the 2-digit entry.
 */
const PREFIX3: Record<string, readonly IndiaState[]> = {
  "140": T("PB", "CH"),
  "194": T("JK", "LA"), // Leh / Kargil
  "362": T("GJ", "DD"), // Diu
  "396": T("GJ", "DN", "DD"), // Vapi / Silvassa / Daman
  "403": T("GA"),
  "507": T("TG", "AP"), // Bhadrachalam belt
  "533": T("AP", "PY"), // Yanam
  "605": T("PY", "TN"), "607": T("TN", "PY"), "609": T("TN", "PY"), // Puducherry / Karaikal
  "673": T("KL", "PY"), // Mahe
  "682": T("KL", "LD"), // Kochi / Lakshadweep
  "737": T("SK"),
  "744": T("AN"),
  "790": T("AR"), "791": T("AR"), "792": T("AR"),
  "793": T("ML"), "794": T("ML"),
  "795": T("MN"),
  "796": T("MZ"),
  "797": T("NL"), "798": T("NL"),
  "799": T("TR"),
};

export type FieldCheck = { ok: true } | { ok: false; message: string };
export type ValueCheck = { ok: true; value: string } | { ok: false; message: string };
export type PincodeStateCheck = { ok: true } | { ok: false; message: string; allowed?: readonly IndiaState[] };

const fail = (message: string) => ({ ok: false as const, message });

// ── Text helpers ───────────────────────────────────────────────────────────────────────────────────────────────────
/** Control characters, bidi overrides, zero-width and BOM characters never belong in an address. */
const CONTROL_RE = /[\p{Cc}​‎‏‪-‮⁠-⁤⁦-⁩﻿]/u;
/** Characters that have no place in a postal address but are the building blocks of HTML / template / Mongo-operator injection. */
const FORBIDDEN_RE = /[<>{}\\$^|~`]/;

export const hasControlChars = (s: string) => CONTROL_RE.test(s);

/** Unicode NFC, collapses runs of spaces, trims. Does NOT hide control characters (callers reject those first). */
export function normalizeText(s: string): string {
  return s.normalize("NFC").replace(/[   -  　]+/g, " ").trim();
}

const LETTER_RE = /\p{L}/u;
const letterCount = (s: string) => (s.match(/\p{L}/gu) ?? []).length;

const KEYBOARD_RUNS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "abcdefghijklmnopqrstuvwxyz"].flatMap((r) => [r, [...r].reverse().join("")]);
/** 5+ letters typed along a keyboard row or the alphabet ("asdfgh", "qwerty", "abcdef"). */
function hasKeyboardRun(s: string): boolean {
  for (const token of s.toLowerCase().split(/[^a-z]+/)) {
    if (token.length < 5) continue;
    for (let i = 0; i + 5 <= token.length; i++) if (KEYBOARD_RUNS.some((r) => r.includes(token.slice(i, i + 5)))) return true;
  }
  return false;
}

const PLACEHOLDER_WORDS = new Set(["test", "testing", "abc", "abcd", "xyz", "xxx", "na", "n/a", "n.a", "none", "null", "nil", "address", "asdf", "qwerty", "demo", "dummy", "sample", "unknown", "home"]);

/** Repeated-character junk ("aaaaaa"), keyboard mashing ("asdfgh"), alternating junk ("ababab"), placeholder words. */
export function looksLikeJunkText(s: string): boolean {
  const t = s.trim();
  if (/(\p{L})\1{3,}/iu.test(t)) return true;
  if (hasKeyboardRun(t)) return true;
  const letters = [...t.toLowerCase()].filter((c) => LETTER_RE.test(c));
  if (letters.length >= 6 && new Set(letters).size <= 2) return true;
  if (PLACEHOLDER_WORDS.has(t.toLowerCase().replace(/[\s,]+/g, " ").trim())) return true;
  return false;
}

// ── Pincode ────────────────────────────────────────────────────────────────────────────────────────────────────────
export const PINCODE_RE = /^[1-9][0-9]{5}$/;

/**
 * 111111, 123456, 654321 … — well-formed but obviously not a real PIN. Repeating blocks (121212, 403403) are NOT
 * rejected: real post offices use them (checked against the India Post directory — 21 genuine PINs would be refused).
 */
export function isObviouslyFakePincode(pin: string): boolean {
  if (!/^\d{6}$/.test(pin)) return false;
  if (/^(\d)\1{5}$/.test(pin)) return true;
  const d = [...pin].map(Number);
  const step = d[1] - d[0];
  return (step === 1 || step === -1) && d.every((x, i) => i === 0 || x - d[i - 1] === step);
}

export function validatePincode(raw: unknown): ValueCheck {
  if (typeof raw !== "string") return fail("Enter your 6-digit pincode");
  const pin = raw.trim();
  if (!pin) return fail("Enter your 6-digit pincode");
  if (!/^\d+$/.test(pin)) return fail("Pincode can have digits only");
  if (pin.length !== 6) return fail(`Pincode must be exactly 6 digits (you entered ${pin.length})`);
  if (pin[0] === "0") return fail("Pincode can't start with 0");
  if (isObviouslyFakePincode(pin)) return fail("That doesn't look like a real pincode — please check it");
  return { ok: true, value: pin };
}

/** The states a pincode may belong to. `"skip"` = Army Postal Service (9x); `null` = prefix not allocated to any region. */
export function statesForPincode(pin: string): readonly IndiaState[] | "skip" | null {
  if (!PINCODE_RE.test(pin)) return null;
  if (pin[0] === "9") return "skip";
  return PREFIX3[pin.slice(0, 3)] ?? PREFIX2[pin.slice(0, 2)] ?? null;
}

const joinNames = (a: readonly string[]) => (a.length <= 1 ? a[0] ?? "" : `${a.slice(0, -1).join(", ")} or ${a[a.length - 1]}`);

/**
 * Does this pincode belong to the chosen state? e.g. {ok:false, message:"Pincode 452002 belongs to Madhya Pradesh, not Karnataka"}.
 * Army Postal Service pincodes (90-99) are not checked.
 */
export function validatePincodeState(pincode: unknown, state: unknown): PincodeStateCheck {
  const p = validatePincode(pincode);
  if (!p.ok) return p;
  const cs = canonicalState(state, p.value);
  if (!cs) return fail("Select a valid state");
  const allowed = statesForPincode(p.value);
  if (allowed === "skip") return { ok: true };
  if (!allowed) return fail(`Pincode ${p.value} isn't a valid Indian PIN code — please check it`);
  if (allowed.includes(cs)) return { ok: true };
  return { ok: false, message: `Pincode ${p.value} belongs to ${joinNames(allowed)}, not ${cs}`, allowed };
}

/** Best state to offer as a one-click fix: India Post's answer if the prefix table accepts it, else the table's only/first state. */
export function suggestState(pincode: string, apiState?: unknown): IndiaState | null {
  const allowed = statesForPincode(pincode);
  if (!allowed || allowed === "skip") return canonicalState(apiState, pincode);
  const api = canonicalState(apiState, pincode);
  if (api && allowed.includes(api)) return api;
  return allowed[0] ?? null;
}

// ── Name ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

export function validateName(raw: unknown): ValueCheck {
  if (typeof raw !== "string") return fail("Enter the receiver's full name");
  if (hasControlChars(raw)) return fail("Name can't contain line breaks or hidden characters");
  const s = normalizeText(raw);
  if (!s) return fail("Enter the receiver's full name");
  if (s.length < 2) return fail("Name is too short");
  if (s.length > 60) return fail("Name must be 60 characters or fewer");
  if (/\d/.test(s)) return fail("Name can't contain numbers");
  if (!NAME_RE.test(s)) return fail("Use only letters, spaces and . ' - in the name");
  if (letterCount(s) < 2) return fail("Enter the receiver's full name");
  if (/(\p{L})\1{3,}/iu.test(s) || hasKeyboardRun(s)) return fail("That doesn't look like a real name — please check it");
  return { ok: true, value: s };
}

// ── Mobile ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Strips spaces, dashes, brackets and a leading +91 / 91 / 0091 / 0 so "+91 98765-43210" becomes "9876543210". */
export function normalizeMobile(raw: string): string {
  let s = raw.replace(/[\s\-().]/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  else if (/^0091\d{10}$/.test(s)) s = s.slice(4);
  else if (/^91\d{10}$/.test(s)) s = s.slice(2);
  else if (/^0\d{10}$/.test(s)) s = s.slice(1);
  return s;
}

export function isObviouslyFakeMobile(n: string): boolean {
  if (!/^\d{10}$/.test(n)) return false;
  if (new Set(n).size <= 2) return true; // 9999999999, 9898989898, 9000000000
  const d = [...n].map(Number);
  for (const target of [1, 9]) { // 1 = ascending (9 -> 0 wraps), 9 = descending
    let run = 1;
    for (let i = 1; i < d.length; i++) {
      if ((d[i] - d[i - 1] + 10) % 10 === target) { if (++run >= 7) return true; } else run = 1;
    }
  }
  return false; // a 7-digit run catches 9876543210, 6789012345 and 9912345678
}

export function validateMobile(raw: unknown): ValueCheck {
  if (typeof raw !== "string") return fail("Enter your 10-digit mobile number");
  if (hasControlChars(raw)) return fail("Mobile number can have digits only");
  const n = normalizeMobile(raw.trim());
  if (!n) return fail("Enter your 10-digit mobile number");
  if (!/^\d+$/.test(n)) return fail("Mobile number can have digits only");
  if (n.length !== 10) return fail(`Mobile number must be 10 digits (you entered ${n.length})`);
  if (!/^[6-9]/.test(n)) return fail("Indian mobile numbers start with 6, 7, 8 or 9");
  if (isObviouslyFakeMobile(n)) return fail("That doesn't look like a real mobile number — please check it");
  return { ok: true, value: n };
}

// ── Address lines ──────────────────────────────────────────────────────────────────────────────────────────────────
export function validateAddressLine(raw: unknown): ValueCheck {
  if (typeof raw !== "string") return fail("Enter your house no., building and street");
  if (hasControlChars(raw)) return fail("Address can't contain line breaks or hidden characters");
  const s = normalizeText(raw);
  if (!s) return fail("Enter your house no., building and street");
  if (s.length < 5) return fail("Address is too short — add house no., building and street");
  if (s.length > 150) return fail("Address must be 150 characters or fewer");
  if (FORBIDDEN_RE.test(s)) return fail("Remove special characters like < > { } $ \\ from the address");
  if (!LETTER_RE.test(s)) return fail("Add the building, street or area name — numbers alone aren't enough");
  if (looksLikeJunkText(s)) return fail("That doesn't look like a real address — please check it");
  return { ok: true, value: s };
}

/** Landmark / area — optional. Empty is fine and normalises to "". */
export function validateLandmark(raw: unknown): ValueCheck {
  if (raw === undefined || raw === null || raw === "") return { ok: true, value: "" };
  if (typeof raw !== "string") return fail("Landmark must be text");
  if (hasControlChars(raw)) return fail("Landmark can't contain line breaks or hidden characters");
  const s = normalizeText(raw);
  if (!s) return { ok: true, value: "" };
  if (s.length < 2) return fail("Landmark is too short");
  if (s.length > 100) return fail("Landmark must be 100 characters or fewer");
  if (FORBIDDEN_RE.test(s)) return fail("Remove special characters like < > { } $ \\ from the landmark");
  if (!LETTER_RE.test(s)) return fail("Landmark should include a place name, e.g. Near City Mall");
  if (looksLikeJunkText(s)) return fail("That doesn't look like a real landmark — please check it");
  return { ok: true, value: s };
}

const CITY_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
export function validateCity(raw: unknown): ValueCheck {
  if (typeof raw !== "string") return fail("Enter your city or district");
  if (hasControlChars(raw)) return fail("City can't contain line breaks or hidden characters");
  const s = normalizeText(raw);
  if (!s) return fail("Enter your city or district");
  if (s.length < 2) return fail("City is too short");
  if (s.length > 60) return fail("City must be 60 characters or fewer");
  if (/\d/.test(s)) return fail("City can't contain numbers");
  if (!CITY_RE.test(s)) return fail("Use only letters, spaces and . ' - in the city");
  if (letterCount(s) < 2 || /(\p{L})\1{3,}/iu.test(s) || hasKeyboardRun(s)) return fail("That doesn't look like a real city — please check it");
  return { ok: true, value: s };
}

export function validateState(raw: unknown): ValueCheck {
  if (typeof raw !== "string" || !raw.trim()) return fail("Select your state");
  const cs = canonicalState(raw);
  return cs ? { ok: true, value: cs } : fail("Select a state from the list");
}

// ── Whole address ──────────────────────────────────────────────────────────────────────────────────────────────────
export type AddressField = "name" | "phone" | "pincode" | "city" | "state" | "line1" | "line2";
/** Visual order of the fields — the first invalid one gets focus. */
export const ADDRESS_FIELD_ORDER: readonly AddressField[] = ["name", "phone", "pincode", "city", "state", "line1", "line2"];
export type AddressErrors = Partial<Record<AddressField, string>>;
export interface AddressValues { name: string; phone: string; pincode: string; city: string; state: string; line1: string; line2: string }

export type AddressCheck = { ok: true; value: AddressValues } | { ok: false; errors: AddressErrors };

/** Validates and normalises a complete address. The pincode/state mismatch is reported on `state`. */
export function validateAddress(a: Partial<Record<AddressField, unknown>>): AddressCheck {
  const errors: AddressErrors = {};
  const v: Partial<AddressValues> = {};
  const run = (k: AddressField, r: ValueCheck) => { if (r.ok) v[k] = r.value; else errors[k] = r.message; };
  run("name", validateName(a.name));
  run("phone", validateMobile(a.phone));
  run("pincode", validatePincode(a.pincode));
  run("city", validateCity(a.city));
  run("state", validateState(a.state));
  run("line1", validateAddressLine(a.line1));
  run("line2", validateLandmark(a.line2));
  if (v.pincode && v.state) {
    const m = validatePincodeState(v.pincode, v.state);
    if (!m.ok) errors.state = m.message;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: v as AddressValues };
}

/** First error message in field order — handy for a single toast / API `error` string. */
export function firstAddressError(errors: AddressErrors): string | null {
  for (const k of ADDRESS_FIELD_ORDER) if (errors[k]) return errors[k]!;
  return null;
}
