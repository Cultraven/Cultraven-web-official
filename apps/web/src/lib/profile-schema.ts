/**
 * Validation for the customer profile endpoints (shared by the API routes, the profile page and the tests).
 * The password rule is the SAME one used by /api/auth/register.
 */
import { z } from "zod";
import { DELETE_CONFIRM_PHRASE } from "./account-delete";
import { PASSWORD_MAX, PASSWORD_MAX_BYTES, PASSWORD_MIN, PASSWORD_RE, PHONE_RE, normalizePhone, passwordBytes } from "./profile-rules";

export { PHONE_RE };

/** Registration + change-password strength rule: 8-128 chars with an uppercase letter, a lowercase letter and a digit. */
export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN, "Password must be at least 8 characters")
  .max(PASSWORD_MAX)
  .regex(PASSWORD_RE, "Password must contain uppercase, lowercase and a number")
  .refine((v) => passwordBytes(v) <= PASSWORD_MAX_BYTES, "Password must be at most 72 characters");

/** Accepts "98765 43210" / "98765-43210"; returns digits only. Empty string = "no phone". */
const phone = z
  .string()
  .max(20, "Phone number is too long")
  .transform(normalizePhone)
  .refine((v) => v === "" || PHONE_RE.test(v), "Enter a valid 10-digit mobile number");

const personName = (label: string) =>
  z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`).max(50, `${label} must be 50 characters or fewer`);

export const ProfileUpdateSchema = z
  .object({
    firstName: personName("First name"),
    lastName: personName("Last name"),
    phone: phone.optional(),
  })
  .strict();
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: "Current password is required" }).min(1, "Current password is required").max(128),
    newPassword: PasswordSchema,
  })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, { path: ["newPassword"], message: "Choose a password different from your current one" });

export const DeleteAccountSchema = z
  .object({
    confirm: z.literal(DELETE_CONFIRM_PHRASE, { errorMap: () => ({ message: `Type ${DELETE_CONFIRM_PHRASE} to confirm` }) }),
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required").max(128),
  })
  .strict();

/** zod issues -> { field: firstMessage } for the forms. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "_");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
