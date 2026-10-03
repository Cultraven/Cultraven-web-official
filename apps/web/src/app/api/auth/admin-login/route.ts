/**
 * POST /api/auth/admin-login
 *
 * Two-tier authentication:
 *  1. Superadmin — credentials from ADMIN_EMAIL / ADMIN_PASSWORD env vars → role: "superadmin"
 *  2. Admin users  — stored in User collection with role "admin" → role: "admin"
 *
 * Both land in the same /portal-secure panel; only superadmin can manage roles.
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
const safeEqual = (a: string, b: string) => crypto.timingSafeEqual(sha256(a), sha256(b));

function createToken(email: string, role: "admin" | "superadmin", userId?: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const payload = JSON.stringify({
    userId: userId ?? "env-admin",
    email,
    role,
    iat: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000,
  });
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

  // ── Tier 1: env-based superadmin ────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const emailOk = safeEqual(email.toLowerCase(), adminEmail.toLowerCase());
    const passwordOk = safeEqual(password, adminPassword);
    if (emailOk && passwordOk) {
      let token: string;
      try { token = createToken(email, "superadmin"); } catch {
        return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
      }
      const res = NextResponse.json({ ok: true, role: "superadmin" });
      res.cookies.set("cultraven_admin_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }

  // ── Tier 2: DB admin users ───────────────────────────────────────────────────
  try {
    const { connectToDatabase } = await import("@/lib/db");
    const { User } = await import("@/lib/models/User");
    const bcrypt = await import("bcryptjs");

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase(), role: "admin", status: "active" })
      .select("+passwordHash")
      .lean() as any;

    if (user && user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
      const token = createToken(user.email, "admin", user._id.toString());
      const res = NextResponse.json({ ok: true, role: "admin" });
      res.cookies.set("cultraven_admin_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  } catch (err) {
    console.error("[admin-login] DB lookup failed:", err);
  }

  console.warn(`[admin-login] Failed attempt from ${ip}`);
  return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
