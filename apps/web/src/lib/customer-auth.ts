import crypto from "crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";

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

/** Customer session from an API request's cookies. */
export function customerFromRequest(req: Request): CustomerSession | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === CUSTOMER_COOKIE) return verifyCustomerToken(part.slice(i + 1).trim());
  }
  return null;
}

export interface CustomerProfile { userId: string; email: string; firstName: string; lastName: string }

/** Server-component helper: the signed-in customer's profile from MongoDB (null if not signed in). */
export async function getCurrentCustomer(): Promise<CustomerProfile | null> {
  const store = await cookies();
  const session = verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
  if (!session) return null;
  try {
    await connectToDatabase();
    const u = (await User.findById(session.userId).select("firstName lastName email").lean()) as any;
    if (!u) return { userId: session.userId, email: session.email, firstName: "", lastName: "" };
    return { userId: session.userId, email: u.email, firstName: u.firstName ?? "", lastName: u.lastName ?? "" };
  } catch (e) {
    console.error("[account] profile lookup failed:", e instanceof Error ? e.message : e);
    return { userId: session.userId, email: session.email, firstName: "", lastName: "" };
  }
}
