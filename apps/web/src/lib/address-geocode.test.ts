import { describe, expect, it } from "vitest";
import { INDIA_BBOX, OUTSIDE_INDIA_MESSAGE, coordCacheKey, mapNominatimToAddress, parseCoordinates } from "./address-geocode";
import { validateAddress } from "./address-validation";
// Real responses from https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18 (captured 2026-10-02).
import bengaluru from "./__fixtures__/nominatim-bengaluru.json";
import jaipur from "./__fixtures__/nominatim-jaipur.json";
import mumbai from "./__fixtures__/nominatim-mumbai.json";
import delhi from "./__fixtures__/nominatim-delhi.json";
import goa from "./__fixtures__/nominatim-goa.json";
import nodata from "./__fixtures__/nominatim-nodata.json";

describe("parseCoordinates", () => {
  it("accepts plain decimals inside India", () => {
    expect(parseCoordinates("12.97160", "77.59460")).toEqual({ ok: true, lat: 12.9716, lng: 77.5946 });
    expect(parseCoordinates("28", "77")).toEqual({ ok: true, lat: 28, lng: 77 });
    expect(parseCoordinates("-0", "77")).toMatchObject({ ok: false, code: "OUTSIDE_INDIA" });
    expect(parseCoordinates("11.6234", "92.7265")).toMatchObject({ ok: true }); // Port Blair
    expect(parseCoordinates("10.5667", "72.6417")).toMatchObject({ ok: true }); // Lakshadweep
  });
  it("rejects out-of-range values as INVALID (lat -90..90, lng -180..180)", () => {
    for (const [a, b] of [["91", "77"], ["-91", "77"], ["12", "181"], ["12", "-181"], ["999", "77"], ["12", "1000"]]) {
      expect(parseCoordinates(a, b)).toMatchObject({ ok: false, code: "INVALID" });
    }
  });
  it("rejects non-numeric, exponent, hex, spaced, NaN/Infinity, empty and operator-looking values", () => {
    for (const v of ["", " ", "abc", "1e2", "0x10", "12 .5", "12,5", "NaN", "Infinity", "-", "--5", "12.", ".5", "1".repeat(20), "[$ne]", "12;DROP", "12\n"]) {
      expect(parseCoordinates(v, "77")).toMatchObject({ ok: false, code: "INVALID" });
      expect(parseCoordinates("12", v)).toMatchObject({ ok: false, code: "INVALID" });
    }
  });
  it("rejects non-strings (arrays, objects, numbers, null)", () => {
    for (const v of [12, null, undefined, ["12"], { $ne: 1 }, true]) expect(parseCoordinates(v, "77")).toMatchObject({ ok: false, code: "INVALID" });
  });
  it("answers OUTSIDE_INDIA with a friendly message outside the bounding box", () => {
    for (const [a, b] of [["51.5074", "-0.1278"], ["40.7", "-74"], ["0", "0"], ["-33.9", "151.2"], ["5.9", "77"], ["38.1", "77"], ["20", "67.9"], ["20", "98.1"], ["1.35", "103.8"]]) {
      expect(parseCoordinates(a, b)).toEqual({ ok: false, code: "OUTSIDE_INDIA", message: OUTSIDE_INDIA_MESSAGE });
    }
    expect(INDIA_BBOX).toEqual({ minLat: 6, maxLat: 38, minLng: 68, maxLng: 98 });
  });
  it("cache key is an ~11 m grid", () => {
    expect(coordCacheKey(12.97163, 77.59461)).toBe(coordCacheKey(12.971649, 77.594612));
    expect(coordCacheKey(12.9716, 77.5946)).not.toBe(coordCacheKey(12.9726, 77.5946));
  });
});

describe("mapNominatimToAddress (real fixtures)", () => {
  it("Bengaluru: road, area, city, state, pincode (prefix agrees with state)", () => {
    const r = mapNominatimToAddress(bengaluru);
    expect(r).toMatchObject({ ok: true, address: { pincode: "560001", city: "Bengaluru", state: "Karnataka", line1: "Vittal Mallya Road", area: "Ashokanagar" } });
    if (r.ok) expect(r.notes).toContain("no-house-number");
  });
  it("Jaipur", () => {
    expect(mapNominatimToAddress(jaipur)).toMatchObject({ ok: true, address: { pincode: "302001", city: "Jaipur", state: "Rajasthan", line1: "Acharya Shri Tulsi Setu", area: "Sodala" } });
  });
  it("Mumbai", () => {
    expect(mapNominatimToAddress(mumbai)).toMatchObject({ ok: true, address: { pincode: "400070", city: "Mumbai", state: "Maharashtra" } });
  });
  it("Delhi: New Delhi city, Delhi state", () => {
    expect(mapNominatimToAddress(delhi)).toMatchObject({ ok: true, address: { pincode: "110004", city: "New Delhi", state: "Delhi", line1: "Kartavya Path" } });
  });
  it("Goa: 403 prefix belongs to Goa", () => {
    expect(mapNominatimToAddress(goa)).toMatchObject({ ok: true, address: { pincode: "403114", city: "Panaji", state: "Goa" } });
  });
  it("every mapped fixture passes the same address rules the form and server use (given a name and phone)", () => {
    for (const f of [bengaluru, jaipur, mumbai, delhi, goa]) {
      const m = mapNominatimToAddress(f);
      expect(m.ok).toBe(true);
      if (m.ok) expect(validateAddress({ name: "Ravi Kumar", phone: "9810457632", ...m.address }).ok).toBe(true);
    }
  });
  it("'Unable to geocode' (no OSM data) is NOT_FOUND", () => {
    expect(mapNominatimToAddress(nodata)).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });
});

describe("mapNominatimToAddress (edge cases)", () => {
  const base = { country_code: "in", state: "Karnataka", city: "Mysuru", postcode: "570001", road: "Sayyaji Rao Road", house_number: "12" };

  it("house number goes first in line1", () => {
    const r = mapNominatimToAddress({ address: base });
    expect(r).toMatchObject({ ok: true, address: { line1: "12, Sayyaji Rao Road", pincode: "570001", city: "Mysuru", state: "Karnataka" } });
    if (r.ok) expect(r.notes).not.toContain("no-house-number");
  });
  it("outside India by country_code, even inside the bounding box (Nepal, Bangladesh)", () => {
    for (const cc of ["np", "bd", "pk", "cn", "lk", "mm", "bt"]) {
      expect(mapNominatimToAddress({ address: { ...base, country_code: cc } })).toMatchObject({ ok: false, code: "OUTSIDE_INDIA" });
    }
  });
  it("drops a postcode that disagrees with the state (bad OSM data) instead of filling a wrong one", () => {
    const r = mapNominatimToAddress({ address: { ...base, postcode: "110001" } });
    expect(r).toMatchObject({ ok: true, address: { pincode: "", state: "Karnataka" } });
    if (r.ok) expect(r.notes).toContain("postcode-state-mismatch");
  });
  it("drops fake / malformed postcodes", () => {
    for (const postcode of ["123456", "111111", "ABC", "12345", "0560001", ""]) {
      const r = mapNominatimToAddress({ address: { ...base, postcode } });
      expect(r).toMatchObject({ ok: true, address: { pincode: "" } });
    }
  });
  it("normalises spaced and multi-value postcodes", () => {
    expect(mapNominatimToAddress({ address: { ...base, postcode: "570 001" } })).toMatchObject({ ok: true, address: { pincode: "570001" } });
    expect(mapNominatimToAddress({ address: { ...base, postcode: "570001;570002" } })).toMatchObject({ ok: true, address: { pincode: "570001" } });
  });
  it("falls back to the ISO code when the state name is unusual, and to district/village for the city", () => {
    const r = mapNominatimToAddress({ address: { country_code: "in", "ISO3166-2-lvl4": "IN-TG", state: "తెలంగాణ", village: "Shamirpet", state_district: "Medchal–Malkajgiri District", postcode: "500078" } });
    expect(r).toMatchObject({ ok: true, address: { state: "Telangana", city: "Shamirpet", pincode: "500078" } });
    const d = mapNominatimToAddress({ address: { country_code: "in", state: "Odisha", state_district: "Khordha District", postcode: "751001" } });
    expect(d).toMatchObject({ ok: true, address: { city: "Khordha", state: "Odisha" } });
  });
  it("maps the merged Dadra/Daman UT using the pincode", () => {
    expect(mapNominatimToAddress({ address: { country_code: "in", state: "Dadra and Nagar Haveli and Daman and Diu", city: "Daman", postcode: "396210" } })).toMatchObject({ ok: true, address: { state: "Daman & Diu", pincode: "396210" } });
    expect(mapNominatimToAddress({ address: { country_code: "in", "ISO3166-2-lvl4": "IN-DH", city: "Silvassa", postcode: "396230" } })).toMatchObject({ ok: true, address: { state: "Dadra & Nagar Haveli" } });
  });
  it("missing postcode still returns the rest", () => {
    const { postcode: _p, ...noPin } = base;
    const r = mapNominatimToAddress({ address: noPin });
    expect(r).toMatchObject({ ok: true, address: { pincode: "", city: "Mysuru", state: "Karnataka" } });
    if (r.ok) expect(r.notes).toContain("no-postcode");
  });
  it("strips characters our address rules refuse, so one odd OSM name does not discard the suggestion", () => {
    const r = mapNominatimToAddress({ address: { ...base, road: "MG <b>Road</b> {x}", house_number: "12$" } });
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.address.line1).not.toMatch(/[<>{}$]/);
  });
  it("never trusts shapes: non-objects, arrays, huge strings, wrong types", () => {
    for (const j of [null, undefined, 5, "x", [], { address: null }, { address: [] }, { address: "x" }, { error: "Unable to geocode" }]) {
      expect(mapNominatimToAddress(j)).toMatchObject({ ok: false, code: "NOT_FOUND" });
    }
    const r = mapNominatimToAddress({ address: { country_code: "in", state: { $ne: null }, city: ["x"], postcode: 560001, road: "a".repeat(10_000), house_number: {} } });
    expect(r.ok === false || (r.ok && r.address.line1 === "" && r.address.state === "" && r.address.city === "")).toBe(true);
  });
  it("returns NOT_FOUND when nothing usable remains", () => {
    expect(mapNominatimToAddress({ address: { country_code: "in" } })).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });
});
