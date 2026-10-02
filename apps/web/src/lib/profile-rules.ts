/**
 * Zod-free profile rules shared by the server schema (profile-schema.ts) and the profile page (client bundle stays small).
 */

/** Indian mobile number: 10 digits starting 6-9. */
export const PHONE_RE = /^[6-9]\d{9}$/;

/** Registration + change-password strength rule: at least one lowercase letter, one uppercase letter and one digit. */
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
/** bcrypt only hashes the first 72 BYTES, so longer passwords are refused instead of being silently truncated (same as /api/auth/register). */
export const PASSWORD_MAX_BYTES = 72;

export const passwordBytes = (pw: string) => new TextEncoder().encode(pw).length;

/** "98765 43210" / "98765-43210" -> "9876543210". */
export const normalizePhone = (v: string) => v.replace(/[\s-]/g, "");

/** null when OK, otherwise the same wording the server uses. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return "Password must be at least 8 characters";
  if (pw.length > PASSWORD_MAX) return "Password is too long";
  if (passwordBytes(pw) > PASSWORD_MAX_BYTES) return "Password must be at most 72 characters";
  if (!PASSWORD_RE.test(pw)) return "Password must contain uppercase, lowercase and a number";
  return null;
}

/** null when OK (empty phone is allowed = no phone). */
export function phoneProblem(raw: string): string | null {
  const v = normalizePhone(raw);
  return v === "" || PHONE_RE.test(v) ? null : "Enter a valid 10-digit mobile number";
}
