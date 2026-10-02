"use client";
/**
 * State + behaviour for the address form shared by checkout and /account/addresses.
 *  - validates each field on blur and everything on submit with the SAME module the server uses (lib/address-validation);
 *  - focuses the first invalid field;
 *  - pincode autofill (India Post): fills city/state when empty or previously auto-filled, never overwrites a manual choice —
 *    a manual state that disagrees is flagged instead (hard error if the pincode prefix says it can't be that state);
 *  - "Use my current location": permission -> geolocation -> /api/geocode/reverse -> fills pincode/city/state/line1 (editable).
 * The pincode/state mismatch is always DERIVED from the current values (never stored), so it can't go stale.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADDRESS_FIELD_ORDER, canonicalState, normalizeText, suggestState, validateAddress, validateAddressLine, validateCity, validateLandmark,
  validateMobile, validateName, validatePincode, validatePincodeState, validateState,
  type AddressErrors, type AddressField, type AddressValues, type IndiaState, type ValueCheck,
} from "@/lib/address-validation";
import { LOCATE_MESSAGES, geolocationSupport, locateMe, lookupPincode, type GeoSupport, type LocateFailure } from "@/lib/address-client";
import type { GeocodedAddress } from "@/lib/address-geocode";

export type AddressLabel = "Home" | "Work" | "Other";
export interface AddressDraft { label: AddressLabel; name: string; phone: string; pincode: string; city: string; state: string; line1: string; line2: string }
export const EMPTY_DRAFT: AddressDraft = { label: "Home", name: "", phone: "", pincode: "", city: "", state: "", line1: "", line2: "" };

const CHECKS: Record<AddressField, (v: unknown) => ValueCheck> = {
  name: validateName, phone: validateMobile, pincode: validatePincode, city: validateCity, state: validateState, line1: validateAddressLine, line2: validateLandmark,
};
const FIELDS = ADDRESS_FIELD_ORDER;
const isField = (k: string): k is AddressField => (FIELDS as readonly string[]).includes(k);

/** A field's OWN rule only — the pincode/state mismatch is derived separately. */
const checkField = (k: AddressField, d: AddressDraft): string => { const r = CHECKS[k](d[k]); return r.ok ? "" : r.message; };

const LOCATE_SAFETY_MS = 30_000; // the browser's 10 s timeout doesn't count time spent on the permission prompt
const DNH_DD = new Set<string>(["Dadra & Nagar Haveli", "Daman & Diu"]);

export type LocStatus = "idle" | "asking" | "locating" | "ok" | "error";
export interface LocState { status: LocStatus; message: string; detail?: string; kind?: LocateFailure }
export type PinStatus = "idle" | "looking" | "found" | "notfound" | "unavailable";
export interface PinState { status: PinStatus; apiState: IndiaState | null; place: string }
const PIN_IDLE: PinState = { status: "idle", apiState: null, place: "" };

export function useAddressDraft(initial?: Partial<AddressDraft>) {
  const [draft, setDraft] = useState<AddressDraft>({ ...EMPTY_DRAFT, ...initial });
  const [errors, setErrors] = useState<AddressErrors>({});
  const [pin, setPin] = useState<PinState>(PIN_IDLE);
  const [loc, setLoc] = useState<LocState>({ status: "idle", message: "" });
  const [geo, setGeo] = useState<GeoSupport>("ok");

  const draftRef = useRef(draft);
  const touched = useRef(new Set<AddressField>());
  const auto = useRef({ city: false, state: false, line1: false, line2: false });
  const els = useRef<Partial<Record<AddressField, HTMLElement | null>>>({});
  const lookupSeq = useRef(0);
  const locSeq = useRef(0);

  useEffect(() => { setGeo(geolocationSupport()); }, []);
  useEffect(() => () => { lookupSeq.current++; locSeq.current++; }, []);

  /** Synchronously updates the ref (so back-to-back async handlers see fresh values) and React state. */
  const commit = useCallback((patch: Partial<AddressDraft>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    return next;
  }, []);

  const reg = useCallback((k: AddressField) => (el: HTMLElement | null) => { els.current[k] = el; }, []);
  const focusField = (k: AddressField) => {
    const el = els.current[k];
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  // ── Pincode: format check, India Post lookup, autofill ──
  const onPincode = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    commit({ pincode: digits });
    const seq = ++lookupSeq.current;
    if (digits.length < 6) {
      setPin(PIN_IDLE);
      if (touched.current.has("pincode")) setErrors((e) => ({ ...e, pincode: digits ? checkField("pincode", draftRef.current) : e.pincode }));
      return;
    }
    touched.current.add("pincode");
    const v = validatePincode(digits);
    setErrors((e) => ({ ...e, pincode: v.ok ? "" : v.message }));
    if (!v.ok) { setPin(PIN_IDLE); return; }
    setPin({ status: "looking", apiState: null, place: "" });
    lookupPincode(digits).then((res) => {
      if (seq !== lookupSeq.current || draftRef.current.pincode !== digits) return;
      if (res.status !== "found") { setPin({ status: res.status, apiState: null, place: "" }); return; }
      const apiState = canonicalState(res.state, digits);
      const d = draftRef.current;
      const patch: Partial<AddressDraft> = {};
      const city = normalizeText(res.city);
      if (validateCity(city).ok && (!d.city.trim() || auto.current.city)) { patch.city = city; auto.current.city = true; }
      if (apiState && (!d.state || auto.current.state)) { patch.state = apiState; auto.current.state = true; }
      if (Object.keys(patch).length) commit(patch);
      setErrors((e) => ({ ...e, ...(patch.city ? { city: "" } : {}), ...(patch.state ? { state: "" } : {}) }));
      setPin({ status: "found", apiState, place: [city, apiState ?? res.state].filter(Boolean).join(", ") });
    });
  };

  const setField = (k: keyof AddressDraft, value: string) => {
    if (k === "pincode") return onPincode(value);
    if (k === "city" || k === "state" || k === "line1" || k === "line2") auto.current[k] = false;
    const next = commit({ [k]: value } as Partial<AddressDraft>);
    if (k === "label") return;
    if (k === "state") touched.current.add("state"); // a select change is a committed choice
    if (touched.current.has(k)) setErrors((e) => ({ ...e, [k]: checkField(k, next) }));
  };

  const blurField = (k: AddressField) => {
    touched.current.add(k);
    setErrors((e) => ({ ...e, [k]: checkField(k, draftRef.current) }));
  };

  /** One-click fix for a mismatch / conflict: sets the state the pincode belongs to. */
  const applyState = (s: string) => { auto.current.state = false; commit({ state: s }); setErrors((e) => ({ ...e, state: "" })); };

  // ── Derived pincode <-> state consistency ──
  const mismatch = useMemo(() => {
    const p = validatePincode(draft.pincode), s = validateState(draft.state);
    if (!p.ok || !s.ok) return null;
    const m = validatePincodeState(p.value, s.value);
    return m.ok ? null : { message: m.message, fix: suggestState(p.value, pin.apiState) };
  }, [draft.pincode, draft.state, pin.apiState]);

  /** India Post disagrees with the chosen state although the prefix table allows it (e.g. 244xxx: UP vs Uttarakhand). Soft warning. */
  const softConflict = useMemo(() => {
    if (mismatch || pin.status !== "found" || !pin.apiState) return null;
    const cs = canonicalState(draft.state, draft.pincode);
    if (!cs || cs === pin.apiState || (DNH_DD.has(cs) && DNH_DD.has(pin.apiState))) return null;
    return { state: pin.apiState, message: `India Post lists pincode ${draft.pincode} under ${pin.apiState}, but you chose ${cs}. Please check.` };
  }, [mismatch, pin, draft.state, draft.pincode]);

  // ── Submit / bulk validation ──
  const validateAll = (): { ok: true; value: AddressValues } | { ok: false; errors: AddressErrors } => {
    const d = draftRef.current;
    const res = validateAddress(d);
    FIELDS.forEach((k) => touched.current.add(k));
    if (res.ok) { setErrors({}); return res; }
    const stored: AddressErrors = { ...res.errors };
    if (stored.state && validateState(d.state).ok) delete stored.state; // mismatch: shown from `mismatch`
    setErrors(stored);
    const first = FIELDS.find((k) => res.errors[k]);
    if (first) focusField(first);
    return { ok: false, errors: res.errors };
  };

  /** Show every current problem without moving focus (used when opening a saved address that no longer passes the rules). */
  const showAllErrors = () => {
    const res = validateAddress(draftRef.current);
    FIELDS.forEach((k) => touched.current.add(k));
    if (res.ok) { setErrors({}); return; }
    const stored: AddressErrors = { ...res.errors };
    if (stored.state && validateState(draftRef.current.state).ok) delete stored.state;
    setErrors(stored);
  };

  /** Map a 422 `issues` object ({ "address.state": ["…"] } or { state: ["…"] }) onto the fields. Returns true if any field matched. */
  const setServerErrors = (issues: unknown): boolean => {
    if (!issues || typeof issues !== "object") return false;
    const next: AddressErrors = {};
    for (const [path, msgs] of Object.entries(issues as Record<string, unknown>)) {
      const k = path.split(".").pop() ?? "";
      if (isField(k) && Array.isArray(msgs) && typeof msgs[0] === "string") next[k] = msgs[0];
    }
    if (!Object.keys(next).length) return false;
    setErrors((e) => ({ ...e, ...next }));
    const first = FIELDS.find((k) => next[k]);
    if (first) { touched.current.add(first); focusField(first); }
    return true;
  };

  const reset = (next?: Partial<AddressDraft>) => {
    lookupSeq.current++; locSeq.current++;
    touched.current.clear();
    auto.current = { city: false, state: false, line1: false, line2: false };
    const d = { ...EMPTY_DRAFT, ...next };
    draftRef.current = d;
    setDraft(d); setErrors({}); setPin(PIN_IDLE); setLoc({ status: "idle", message: "" });
  };

  // ── Use my current location ──
  const applyLocation = (a: GeocodedAddress) => {
    lookupSeq.current++; // a pincode lookup still in flight must not overwrite the location result
    const d = draftRef.current;
    const state = canonicalState(a.state, a.pincode);
    const patch: Partial<AddressDraft> = {};
    if (a.pincode) patch.pincode = a.pincode;
    if (a.city) { patch.city = a.city; auto.current.city = true; }
    if (state) { patch.state = state; auto.current.state = true; }
    if (a.line1 && (!d.line1.trim() || auto.current.line1)) { patch.line1 = a.line1; auto.current.line1 = true; }
    if (a.area && (!d.line2.trim() || auto.current.line2)) { patch.line2 = a.area; auto.current.line2 = true; }
    const next = commit(patch);
    setPin(a.pincode ? { status: "found", apiState: state || null, place: [a.city, state].filter(Boolean).join(", ") } : PIN_IDLE);
    const fresh: AddressErrors = {};
    for (const k of Object.keys(patch)) if (isField(k)) { touched.current.add(k); fresh[k] = k === "state" ? "" : checkField(k, next); }
    setErrors((e) => ({ ...e, ...fresh }));
    setLoc({
      status: "ok",
      message: "Filled from your location — please check house no.",
      detail: a.pincode ? undefined : "We couldn't find a pincode for this spot — please enter it.",
    });
    requestAnimationFrame(() => { const el = els.current[a.pincode ? "line1" : "pincode"]; el?.focus({ preventScroll: true }); el?.scrollIntoView({ block: "center", behavior: "smooth" }); });
  };

  const locate = async () => {
    if (loc.status === "asking" || loc.status === "locating") return;
    const id = ++locSeq.current;
    setLoc({ status: "asking", message: "" });
    const safety = setTimeout(() => {
      if (locSeq.current !== id) return;
      locSeq.current++;
      setLoc({ status: "error", kind: "timeout", message: LOCATE_MESSAGES.timeout });
    }, LOCATE_SAFETY_MS);
    const res = await locateMe((phase) => { if (locSeq.current === id) setLoc({ status: phase, message: "" }); });
    clearTimeout(safety);
    if (locSeq.current !== id) return;
    if (!res.ok) { setLoc({ status: "error", kind: res.kind, message: res.message }); return; }
    applyLocation(res.address);
  };

  return {
    draft, errors, pin, loc, geo, mismatch, softConflict,
    busy: loc.status === "asking" || loc.status === "locating",
    setField, blurField, applyState, validateAll, showAllErrors, setServerErrors, reset, locate, reg, focusField,
  };
}

export type AddressForm = ReturnType<typeof useAddressDraft>;
