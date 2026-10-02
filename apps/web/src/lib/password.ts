/** Password hashing shared by register + account routes (bcryptjs, cost 12 — same as /api/auth/register). */
import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_COST);

/** Constant-time compare; false for a missing hash. */
export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}
