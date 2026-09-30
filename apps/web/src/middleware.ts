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

export async function middleware(req: NextRequest) {
  if (!process.env.SESSION_SECRET || !process.env.ADMIN_SECRET_TOKEN) {
    return new NextResponse(
      JSON.stringify({ error: "Server misconfigured: Missing secrets" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { pathname } = req.nextUrl;

  // ── Helper to verify HMAC-SHA256 token ────────────────────────────────────
  async function verifyToken(token: string) {
    if (!token || !token.includes(".")) return null;
    const [encodedPayload, signature] = token.split(".");
    
    try {
      const secret = process.env.SESSION_SECRET;
      if (!secret) return null;
      const encoder = new TextEncoder();
      
      // We can't use node:crypto in Edge, so we use Web Crypto API
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );
      
      // base64url decode signature to buffer
      let sigBase64 = signature.replace(/-/g, "+").replace(/_/g, "/");
      while (sigBase64.length % 4 !== 0) sigBase64 += "=";
      const sigStr = atob(sigBase64);
      const sigBuf = new Uint8Array(sigStr.length);
      for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);
      
      const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        sigBuf,
        encoder.encode(encodedPayload)
      );
      
      if (!isValid) return null;
      
      let payloadBase64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
      while (payloadBase64.length % 4 !== 0) payloadBase64 += "=";
      const payloadStr = atob(payloadBase64);
      const payload = JSON.parse(payloadStr);
      
      if (payload.exp && payload.exp < Date.now()) return null;
      return payload;
    } catch (err) {
      return null;
    }
  }

  // ── Admin routes: require ADMIN_TOKEN cookie ──────────────────────────────
  if (isMatch(pathname, ADMIN_PATHS)) {
    const session = req.cookies.get("cultraven_session")?.value;
    const payload = session ? await verifyToken(session) : null;
    
    // In dev, we might allow fallback to ADMIN_SECRET_TOKEN for backward compatibility
    const fallbackAdminToken = req.cookies.get("cultraven_admin")?.value;
    const isFallbackAdmin = fallbackAdminToken === process.env.ADMIN_SECRET_TOKEN;

    if (!(payload && payload.role === "admin") && !isFallbackAdmin) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/portal-access";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Account routes: require AUTH_SESSION cookie ────────────────────────────
  if (isMatch(pathname, AUTH_PATHS)) {
    const session = req.cookies.get("cultraven_session")?.value;
    const payload = session ? await verifyToken(session) : null;
    
    if (!payload) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Already logged in → redirect away from auth pages ─────────────────────
  if (isMatch(pathname, PUBLIC_PATHS)) {
    const session = req.cookies.get("cultraven_session")?.value;
    const payload = session ? await verifyToken(session) : null;
    
    if (payload) {
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
