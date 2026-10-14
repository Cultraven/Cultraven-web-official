/** Password hashing shared by register + account routes (bcryptjs, cost 12 — same as /api/auth/register). */
import bcrypt from "bcryptjs";
import { z } from "zod";

export const BCRYPT_COST = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_COST);

/** Constant-time compare; false for a missing hash. */
export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}

/** The rule for a NEW password (sign-up, reset, set-your-password): 8+ characters with upper-case, lower-case and a number. */
export const PasswordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase and a number")
  // bcrypt only uses the first 72 bytes: refuse longer ones instead of silently truncating them
  .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 characters");
