/**
 * POST /api/auth/admin-login
 * Issues a JWT with role=admin for /portal-secure routes.
 * Env: ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const BodySchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1).max(128),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

function createAdminToken(email: string): string {
  const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
  const payload = JSON.stringify({ userId: "admin", email, role: "admin", iat: Date.now(), exp: Date.now() + 8 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) return NextResponse.json({ error: "Too many attempts. Try in 15 minutes." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const result = BodySchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Email and password required." }, { status: 400 });

  const { email, password } = result.data;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("[admin-login] Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars");
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    console.warn(`[admin-login] Bad email from ${ip}`);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const pwBuf = Buffer.from(password);
  const expectedBuf = Buffer.from(adminPassword);
  let ok = false;
  if (pwBuf.length === expectedBuf.length) {
    try { ok = crypto.timingSafeEqual(pwBuf, expectedBuf); } catch { ok = false; }
  }
  if (!ok) {
    console.warn(`[admin-login] Bad password from ${ip}`);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = createAdminToken(email);
  const res = NextResponse.json({ ok: true }, { status: 200 });
  const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 60 * 60 * 8, path: "/" };
  res.cookies.set("cultraven_session", token, cookieOpts);
  if (process.env.ADMIN_SECRET_TOKEN) res.cookies.set("cultraven_admin", process.env.ADMIN_SECRET_TOKEN, cookieOpts);
  return res;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
