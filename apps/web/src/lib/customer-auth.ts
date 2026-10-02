import crypto from "crypto";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isUserActive } from "@/lib/account-delete";

export const CUSTOMER_COOKIE = "cultraven_session";

export interface CustomerSession { userId: string; email: string; role?: string }

/** Verifies the signed customer session token (HMAC). Never falls back to a default secret. */
export function verifyCustomerToken(token: string | undefined | null): CustomerSession | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  try {
    const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
    const a = Buffer.from(signature), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    if (!payload.userId) return null;
    return { userId: String(payload.userId), email: String(payload.email ?? ""), role: payload.role };
  } catch {
    return null;
  }
}

/** Customer session from an API request's cookies (signature only — no database lookup; see activeCustomerFromRequest). */
export function customerFromRequest(req: Request): CustomerSession | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === CUSTOMER_COOKIE) return verifyCustomerToken(part.slice(i + 1).trim());
  }
  return null;
}

/**
 * Like customerFromRequest, but also confirms the account still exists and is not soft-deleted.
 * A deleted customer's still-valid cookie (e.g. on another device) is treated as signed out.
 * Throws when the database is unreachable — callers answer 500/503 rather than guessing.
 */
export async function activeCustomerFromRequest(req: Request): Promise<CustomerSession | null> {
  const session = customerFromRequest(req);
  if (!session || !mongoose.isValidObjectId(session.userId)) return null;
  await connectToDatabase();
  const u = (await User.findById(session.userId).select("deletedAt status").lean()) as any;
  return isUserActive(u) ? session : null;
}

export interface CustomerProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Cache-busting version of the profile photo (null = no photo). Fetch the image from /api/account/avatar?v=<version>. */
  avatarVersion: number | null;
}

/** Server-component helper: the signed-in customer's profile from MongoDB (null if not signed in or the account was deleted). */
export async function getCurrentCustomer(): Promise<CustomerProfile | null> {
  const store = await cookies();
  const session = verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
  if (!session) return null;
  try {
    await connectToDatabase();
    const u = (await User.findById(session.userId).select("firstName lastName email avatarUpdatedAt deletedAt status").lean()) as any;
    if (u && !isUserActive(u)) return null; // soft-deleted account: not signed in
    if (!u) return { userId: session.userId, email: session.email, firstName: "", lastName: "", avatarVersion: null };
    return {
      userId: session.userId,
      email: u.email,
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      avatarVersion: u.avatarUpdatedAt ? new Date(u.avatarUpdatedAt).getTime() : null,
    };
  } catch (e) {
    console.error("[account] profile lookup failed:", e instanceof Error ? e.message : e);
    return { userId: session.userId, email: session.email, firstName: "", lastName: "", avatarVersion: null };
  }
}
