/**
 * Browser-side helpers for the address forms: pincode autofill lookup and the "Use my current location" flow.
 * Coordinates live only in a local variable for the duration of one request — never in state, storage, logs or URLs we keep.
 */
import type { GeocodedAddress } from "./address-geocode";

export type PincodeLookup =
  | { status: "found"; city: string; state: string }
  | { status: "notfound" }
  | { status: "unavailable" };

/** GET /api/pincode/<pin> — India Post city/district + state. Never throws. */
export async function lookupPincode(pin: string, signal?: AbortSignal): Promise<PincodeLookup> {
  try {
    const r = await fetch(`/api/pincode/${pin}`, { signal, cache: "no-store" });
    if (!r.ok) return { status: "unavailable" };
    const j = await r.json();
    if (j && typeof j.city === "string" && typeof j.state === "string") return { status: "found", city: j.city, state: j.state };
    if (j && j.notFound === true) return { status: "notfound" };
  } catch { /* offline / aborted / API down — the shopper types it */ }
  return { status: "unavailable" };
}

export type GeoSupport = "ok" | "insecure" | "unsupported" | "blocked";

/** Geolocation needs a secure context (https or localhost) and a permissions policy that allows it. Browser-only. */
export function geolocationSupport(): GeoSupport {
  if (typeof window === "undefined") return "ok";
  if (!window.isSecureContext) return "insecure";
  if (!("geolocation" in navigator)) return "unsupported";
  try {
    const fp = (document as any).permissionsPolicy ?? (document as any).featurePolicy;
    if (fp?.allowsFeature && !fp.allowsFeature("geolocation")) return "blocked";
  } catch { /* ignore */ }
  return "ok";
}

export type LocateFailure = "insecure" | "unsupported" | "blocked" | "denied" | "unavailable" | "timeout" | "outside" | "notfound" | "rate" | "error";
export type LocateResult = { ok: true; address: GeocodedAddress } | { ok: false; kind: LocateFailure; message: string };
export type LocatePhase = "asking" | "locating";

export const LOCATE_MESSAGES: Record<LocateFailure, string> = {
  insecure: "Location needs a secure (https) connection — please enter your address manually.",
  unsupported: "This browser can't share your location — please enter your address manually.",
  blocked: "Location is switched off on this site — please enter your address manually.",
  denied: "Location permission denied — enter your address manually.",
  unavailable: "We couldn't work out where you are — please enter your address manually.",
  timeout: "Finding your location took too long — try again or enter your address manually.",
  outside: "That location looks to be outside India — we deliver within India only. Please enter your address manually.",
  notfound: "We couldn't find an address for that spot — please enter it manually.",
  rate: "Too many location requests — please wait a minute or enter your address manually.",
  error: "We couldn't look up your address right now — please enter it manually.",
};

const failure = (kind: LocateFailure, message = LOCATE_MESSAGES[kind]): LocateResult => ({ ok: false, kind, message });

/**
 * navigator.geolocation (10 s timeout, high accuracy off) -> GET /api/geocode/reverse. `onPhase` reports "asking" while the
 * browser permission prompt is open and "locating" once we are working. Resolves with a result — never rejects.
 */
export async function locateMe(onPhase?: (p: LocatePhase) => void): Promise<LocateResult> {
  const support = geolocationSupport();
  if (support !== "ok") return failure(support);

  let permState: PermissionState | "unknown" = "unknown";
  let perm: PermissionStatus | undefined;
  try {
    perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    if (perm) {
      permState = perm.state;
      if (perm.state === "denied") return failure("denied");
      if (perm.state === "prompt") perm.onchange = () => { if (perm?.state === "granted") onPhase?.("locating"); };
    }
  } catch { /* Permissions API missing (older Safari) */ }
  onPhase?.(permState === "prompt" || permState === "unknown" ? "asking" : "locating");

  const pos = await new Promise<{ lat: number; lng: number } | LocateFailure>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => resolve(e.code === 1 ? (/permissions? policy|disabled/i.test(e.message || "") ? "blocked" : "denied") : e.code === 3 ? "timeout" : "unavailable"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  });
  if (perm) perm.onchange = null;
  if (typeof pos === "string") return failure(pos);

  onPhase?.("locating");
  try {
    const qs = new URLSearchParams({ lat: pos.lat.toFixed(5), lng: pos.lng.toFixed(5) });
    const r = await fetch(`/api/geocode/reverse?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(9_000) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j && typeof j.state === "string") {
      return { ok: true, address: { pincode: String(j.pincode ?? ""), city: String(j.city ?? ""), state: String(j.state ?? ""), line1: String(j.line1 ?? ""), area: String(j.area ?? "") } };
    }
    if (r.status === 422 && j?.code === "OUTSIDE_INDIA") return failure("outside", typeof j.error === "string" ? j.error : undefined);
    if (r.status === 404) return failure("notfound");
    if (r.status === 429) return failure("rate");
    return failure("error");
  } catch (e) {
    return failure((e as Error)?.name === "TimeoutError" ? "timeout" : "error");
  }
}
