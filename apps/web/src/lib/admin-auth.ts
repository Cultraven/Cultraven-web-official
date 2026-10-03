import crypto from "crypto";

export const ADMIN_COOKIE = "cultraven_admin_session";
export const DELIVERY_COOKIE = "cultraven_delivery_session";

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

function verifyToken(token: string, secret: string): Record<string, any> | null {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  try {
    const expected = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAdminPayload(req: Request): Record<string, any> | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const token = readCookie(req, ADMIN_COOKIE);
  if (!token) return null;
  return verifyToken(token, secret);
}

/** Accepts admin OR superadmin session. Most admin API routes use this. */
export function isAdminRequest(req: Request): boolean {
  const p = getAdminPayload(req);
  return p?.role === "admin" || p?.role === "superadmin";
}

/** Only superadmin — for role management and admin promotion/demotion. */
export function isSuperAdminRequest(req: Request): boolean {
  const p = getAdminPayload(req);
  return p?.role === "superadmin";
}

/** Returns the role from the admin cookie, or null if invalid/missing. */
export function getAdminRole(req: Request): "admin" | "superadmin" | null {
  const p = getAdminPayload(req);
  if (p?.role === "superadmin") return "superadmin";
  if (p?.role === "admin") return "admin";
  return null;
}

/** Delivery staff session check. */
export function isDeliveryRequest(req: Request): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const token = readCookie(req, DELIVERY_COOKIE);
  if (!token) return false;
  const p = verifyToken(token, secret);
  return p?.role === "delivery";
}

/** Any staff (admin, superadmin, or delivery) — for shared endpoints. */
export function isStaffRequest(req: Request): boolean {
  return isAdminRequest(req) || isDeliveryRequest(req);
}
