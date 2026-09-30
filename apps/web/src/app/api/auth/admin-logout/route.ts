/**
 * POST /api/auth/admin-logout
 * Ends the admin session: clears BOTH the signed session cookie (what the API
 * actually trusts) and the legacy admin cookie.
 */
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  for (const name of ["cultraven_session", "cultraven_admin"]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }
  return response;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
