import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { DELIVERY_COOKIE } from "@/lib/admin-auth";

const BodySchema = z.object({
  email: z.string().trim().max(254).email(),
  password: z.string().min(1).max(128),
});

function createDeliveryToken(email: string, userId: string, name: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not configured");
  const payload = JSON.stringify({ userId, email, name, role: "delivery", iat: Date.now(), exp: Date.now() + 12 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req);
  const rl = rateLimit(`delivery-login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try in 15 minutes." }, { status: 429, headers: retryHeaders(rl) });

  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const result = BodySchema.safeParse(body.data);
  if (!result.success) return NextResponse.json({ error: "Email and password required." }, { status: 400 });

  const { email, password } = result.data;

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase(), role: "delivery", status: "active" })
      .select("+passwordHash")
      .lean() as any;

    // Always run bcrypt to prevent timing-based account enumeration
    const DUMMY_HASH = "$2b$12$invalidhashtopreventtimingattacksonunknownemailaddresses.";
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);
    if (!user || !passwordMatch) {
      console.warn(`[delivery-login] Failed attempt from ${ip}`);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = createDeliveryToken(user.email, user._id.toString(), `${user.firstName} ${user.lastName}`);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(DELIVERY_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 12, path: "/" });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[delivery-login] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
