/**
 * POST /api/auth/admin-logout
 * Ends the admin session: clears the signed admin cookie (what the API trusts) and the
 * legacy admin cookie. The customer storefront session is a separate cookie and is untouched.
 */
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  for (const name of ["cultraven_admin_session", "cultraven_admin"]) {
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
