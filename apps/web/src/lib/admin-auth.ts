import crypto from "crypto";

/** Admin sessions live in their own cookie so a customer login/logout on the storefront can never replace or clear them. */
export const ADMIN_COOKIE = "cultraven_admin_session";

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

/** Server-side admin check. Verifies the HMAC session cookie and role === "admin". */
export function isAdminRequest(req: Request): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const token = readCookie(req, ADMIN_COOKIE);
  if (!token || !token.includes(".")) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  try {
    const expected = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}
