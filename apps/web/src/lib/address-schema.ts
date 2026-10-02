/**
 * Server-side address schemas (zod) built on the pure validators in address-validation.ts — the browser runs the very same
 * rules, so a form that passes on the client passes here, and a crafted request can't skip them.
 *
 * Injection posture: every field starts as z.string(), so objects such as {"$ne":null} / {"$gt":""}, arrays, numbers and null
 * are rejected before any validator (and certainly before any database query) runs. Strings are length-capped first, rejected
 * if they hold control characters or <>{}\$^|~` and are normalised (NFC, trimmed, single spaces). State is mapped to the
 * canonical list; pincode must belong to that state (422 with a plain-English message otherwise).
 */
import { z } from "zod";
import {
  validateName, validateMobile, validatePincode, validateCity, validateState, validateAddressLine, validateLandmark,
  validatePincodeState, type ValueCheck,
} from "./address-validation";

/** Hard cap applied before any regex-based validator so a multi-megabyte string can't burn CPU. */
const RAW_CAP = 500;

/** Wraps a pure validator as a zod string schema that outputs the normalised value. */
const field = (check: (v: unknown) => ValueCheck) =>
  z.string({ invalid_type_error: "Must be text", required_error: "Required" })
    .max(RAW_CAP, "Too long")
    .transform((v, ctx) => {
      const r = check(v);
      if (!r.ok) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message }); return z.NEVER; }
      return r.value;
    });

export const NameField = field(validateName);
export const MobileField = field(validateMobile);
export const PincodeField = field(validatePincode);
export const CityField = field(validateCity);
export const StateField = field(validateState);
export const AddressLineField = field(validateAddressLine);
export const LandmarkField = field(validateLandmark).optional().default("");

/** Rejects a pincode that belongs to a different state than the one chosen. Runs only when both fields are individually valid. */
const pincodeMatchesState = (a: { pincode?: string; state?: string }, ctx: z.RefinementCtx) => {
  if (typeof a.pincode !== "string" || typeof a.state !== "string") return;
  const r = validatePincodeState(a.pincode, a.state);
  if (!r.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["state"], message: r.message });
};

/** The delivery-address block of an order (no name/phone — those travel at the top level of the create-order body). */
export const CheckoutAddress = z
  .object({ line1: AddressLineField, line2: LandmarkField, city: CityField, state: StateField, pincode: PincodeField })
  .superRefine(pincodeMatchesState);

/** A saved address-book entry. `.strict()` rejects unknown keys (including a literal "__proto__"). */
export const AddressInput = z
  .object({
    label: z.enum(["Home", "Work", "Other"]).default("Home"),
    name: NameField,
    phone: MobileField,
    line1: AddressLineField,
    line2: LandmarkField,
    city: CityField,
    state: StateField,
    pincode: PincodeField,
    isDefault: z.boolean().optional().default(false),
  })
  .strict()
  .superRefine(pincodeMatchesState);

export type AddressInputData = z.infer<typeof AddressInput>;

export const shape = (a: any) => ({
  id: String(a._id), label: a.label, name: a.name, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state,
  pincode: a.pincode, phone: a.phone, isDefault: !!a.isDefault,
});
