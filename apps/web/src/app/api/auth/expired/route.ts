/**
 * GET /api/auth/expired — clears the customer session cookie and sends the visitor to /login.
 * Used when a still-validly-signed cookie belongs to an account that no longer exists / was deleted
 * (otherwise middleware would bounce /login straight back to /account in a loop).
 */
import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/account-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return clearSessionCookie(NextResponse.redirect(url));
}
