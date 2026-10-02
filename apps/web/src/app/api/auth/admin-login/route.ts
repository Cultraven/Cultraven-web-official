/**
 * POST /api/auth/admin-login
 * Issues a signed session with role=admin for /portal-secure and the admin APIs.
 * Env: ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET
 *
 * Security: safe body parsing, one generic error for bad email / bad password, constant-time comparison of
 * digests (no length leak), 5 attempts per IP per 15 minutes, HttpOnly + SameSite=Lax (+ Secure in production)
 * cookie that expires after 8 hours.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";

const BodySchema = z.object({
  email: z.string().trim().max(254).email(),
  password: z.string().min(1).max(128),
});

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest();
/** Constant-time equality that does not leak the length of either value. */
const safeEqual = (a: string, b: string) => crypto.timingSafeEqual(sha256(a), sha256(b));

function createAdminToken(email: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const payload = JSON.stringify({ userId: "admin", email, role: "admin", iat: Date.now(), exp: Date.now() + 8 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req);
  const rl = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try in 15 minutes." }, { status: 429, headers: retryHeaders(rl) });

  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const result = BodySchema.safeParse(body.data);
  if (!result.success) return NextResponse.json({ error: "Email and password required." }, { status: 400 });

  const { email, password } = result.data;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("[admin-login] Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars");
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  // Evaluate both checks every time so a wrong email and a wrong password take the same path.
  const emailOk = safeEqual(email.toLowerCase(), adminEmail.toLowerCase());
  const passwordOk = safeEqual(password, adminPassword);
  if (!emailOk || !passwordOk) {
    console.warn(`[admin-login] Failed attempt from ${ip}`);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let token: string;
  try { token = createAdminToken(email); } catch { return NextResponse.json({ error: "Admin not configured." }, { status: 500 }); }
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set("cultraven_admin_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
