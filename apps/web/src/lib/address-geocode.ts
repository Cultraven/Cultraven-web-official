/**
 * Pure helpers for "Use my current location": coordinate validation (+ India bounding box) and the OpenStreetMap Nominatim
 * (reverse, jsonv2, addressdetails=1) -> delivery-address mapper. No I/O here; the route handler does the fetching.
 * Coordinates are never stored or logged anywhere.
 */
import {
  canonicalState, normalizeText, validateAddressLine, validateCity, validateLandmark, validatePincode, validatePincodeState,
  type IndiaState,
} from "./address-validation";

/** Rough India bounding box (includes Andaman & Nicobar and Lakshadweep). The country_code check on the result is the precise one. */
export const INDIA_BBOX = { minLat: 6, maxLat: 38, minLng: 68, maxLng: 98 } as const;

export type CoordCheck =
  | { ok: true; lat: number; lng: number }
  | { ok: false; code: "INVALID" | "OUTSIDE_INDIA"; message: string };

const COORD_RE = /^-?\d{1,3}(\.\d{1,12})?$/;

export const OUTSIDE_INDIA_MESSAGE = "That location looks to be outside India — we deliver within India only. Please enter your address manually.";

/** Accepts only plain decimal strings (no exponent, hex, spaces, NaN/Infinity, arrays, objects). */
export function parseCoordinates(latRaw: unknown, lngRaw: unknown): CoordCheck {
  const bad = { ok: false, code: "INVALID", message: "Invalid coordinates" } as const;
  if (typeof latRaw !== "string" || typeof lngRaw !== "string") return bad;
  if (!COORD_RE.test(latRaw) || !COORD_RE.test(lngRaw)) return bad;
  const lat = Number(latRaw), lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return bad;
  if (lat < INDIA_BBOX.minLat || lat > INDIA_BBOX.maxLat || lng < INDIA_BBOX.minLng || lng > INDIA_BBOX.maxLng) {
    return { ok: false, code: "OUTSIDE_INDIA", message: OUTSIDE_INDIA_MESSAGE };
  }
  return { ok: true, lat, lng };
}

/** ~11 m grid: nearby taps share one cached answer (and one upstream call). */
export const coordCacheKey = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

export interface GeocodedAddress { pincode: string; city: string; state: string; line1: string; area: string }
export type GeocodeMapResult =
  | { ok: true; address: GeocodedAddress; notes: string[] }
  | { ok: false; code: "OUTSIDE_INDIA" | "NOT_FOUND"; message: string };

const ISO_LVL4_TO_STATE: Record<string, IndiaState | "MERGED_UT"> = {
  AN: "Andaman & Nicobar", AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CH: "Chandigarh",
  CT: "Chhattisgarh", DD: "Daman & Diu", DH: "MERGED_UT", DL: "Delhi", DN: "Dadra & Nagar Haveli", GA: "Goa", GJ: "Gujarat",
  HP: "Himachal Pradesh", HR: "Haryana", JH: "Jharkhand", JK: "Jammu & Kashmir", KA: "Karnataka", KL: "Kerala", LA: "Ladakh",
  LD: "Lakshadweep", MH: "Maharashtra", ML: "Meghalaya", MN: "Manipur", MP: "Madhya Pradesh", MZ: "Mizoram", NL: "Nagaland",
  OD: "Odisha", OR: "Odisha", PB: "Punjab", PY: "Puducherry", RJ: "Rajasthan", SK: "Sikkim", TG: "Telangana", TN: "Tamil Nadu",
  TR: "Tripura", TS: "Telangana", UK: "Uttarakhand", UP: "Uttar Pradesh", UT: "Uttarakhand", WB: "West Bengal",
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
/** A bounded, single-line string from untrusted JSON, or "". */
const str = (v: unknown, max = 200) => (typeof v === "string" && v.length <= max ? normalizeText(v) : "");
/** Remove characters our address rules refuse, so one odd OSM name doesn't discard the whole suggestion. */
const clean = (s: string) => normalizeText(s.replace(/[\p{Cc}<>{}\\$^|~`]/gu, " "));

function pickState(addr: Record<string, unknown>, pincode: string): IndiaState | "" {
  const direct = canonicalState(str(addr.state), pincode);
  if (direct) return direct;
  const iso = str(addr["ISO3166-2-lvl4"], 12).toUpperCase().replace(/^IN-/, "");
  const mapped = ISO_LVL4_TO_STATE[iso];
  if (mapped === "MERGED_UT") return canonicalState("Dadra and Nagar Haveli and Daman and Diu", pincode) ?? "";
  return mapped ?? "";
}

/** OSM `postcode` may be "560 001", a list "560001;560002" or junk. Returns the first plausible PIN. */
function pickPincode(raw: string): string {
  const m = raw.match(/(?<!\d)([1-9]\d{2})\s?(\d{3})(?!\d)/);
  return m ? m[1] + m[2] : "";
}

/** Turns a Nominatim reverse-geocode (jsonv2) result into form suggestions the shopper must still confirm. */
export function mapNominatimToAddress(json: unknown): GeocodeMapResult {
  const notFound = { ok: false, code: "NOT_FOUND", message: "We couldn't find an address for that location. Please enter it manually." } as const;
  if (!isObj(json) || json.error !== undefined || !isObj(json.address)) return notFound;
  const addr = json.address;

  const country = str(addr.country_code, 4).toLowerCase();
  if (country && country !== "in") return { ok: false, code: "OUTSIDE_INDIA", message: OUTSIDE_INDIA_MESSAGE };

  const notes: string[] = [];

  // Pincode first: it disambiguates the merged Daman/Dadra UT. Drop it if it disagrees with the state or is implausible.
  let pincode = pickPincode(str(addr.postcode, 60));
  const state = pickState(addr, pincode);
  if (pincode) {
    const fmt = validatePincode(pincode);
    if (!fmt.ok) { pincode = ""; notes.push("invalid-postcode"); }
    else if (state && !validatePincodeState(pincode, state).ok) { pincode = ""; notes.push("postcode-state-mismatch"); }
  } else notes.push("no-postcode");
  if (!state) notes.push("no-state");

  let city = "";
  for (const raw of [addr.city, addr.town, addr.village, addr.municipality, addr.state_district, addr.county]) {
    const cand = clean(str(raw, 100)).replace(/\s+District$/i, "");
    if (cand && validateCity(cand).ok) { city = normalizeText(cand); break; }
  }

  const road = clean(str(addr.road, 120) || str(addr.pedestrian, 120) || str(addr.footway, 120) || str(addr.path, 120));
  const house = clean(str(addr.house_number, 30));
  const locality = clean(str(addr.neighbourhood, 100) || str(addr.suburb, 100) || str(addr.hamlet, 100) || str(addr.quarter, 100) || str(addr.city_district, 100));

  const line1Text = [house, road].filter(Boolean).join(", ") || locality;
  if (!house) notes.push("no-house-number");
  const l1 = validateAddressLine(line1Text.slice(0, 150));
  const line1 = l1.ok ? l1.value : "";

  const areaCandidate = clean(str(addr.suburb, 100) || str(addr.neighbourhood, 100) || str(addr.quarter, 100));
  const a = validateLandmark(areaCandidate);
  const area = a.ok && a.value && !line1.toLowerCase().includes(a.value.toLowerCase()) ? a.value : "";

  if (!pincode && !state && !city && !line1) return notFound;
  return { ok: true, address: { pincode, city, state, line1, area }, notes };
}
