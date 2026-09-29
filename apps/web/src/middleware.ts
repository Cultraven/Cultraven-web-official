/**
 * Middleware — CULTRAVEN storefront.
 *
 * Protects:
 *   - /admin/**        → requires ADMIN_SESSION cookie with valid admin token
 *   - /account/**      → requires AUTH_SESSION cookie (any logged-in user)
 *
 * All other routes are public.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Route patterns ─────────────────────────────────────────────────────────────
const ADMIN_PATHS = ["/portal-secure"];
const AUTH_PATHS = ["/account"];
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

function isMatch(pathname: string, patterns: string[]): boolean {
  return patterns.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes: require ADMIN_TOKEN cookie ──────────────────────────────
  if (isMatch(pathname, ADMIN_PATHS)) {
    const adminToken = req.cookies.get("cultraven_admin")?.value;
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET_TOKEN) {
      // Redirect to admin login page
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/portal-access";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Account routes: require AUTH_SESSION cookie ────────────────────────────
  if (isMatch(pathname, AUTH_PATHS)) {
    const session = req.cookies.get("cultraven_session")?.value;
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Already logged in → redirect away from auth pages ─────────────────────
  if (isMatch(pathname, PUBLIC_PATHS)) {
    const session = req.cookies.get("cultraven_session")?.value;
    if (session) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/account";
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public assets
     * - API routes (they do their own auth checks)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|api/).*)",
  ],
};
