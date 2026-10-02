/** Small helpers shared by the authenticated /api/account/* route handlers. */
import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE } from "@/lib/customer-auth";

export const NO_STORE = { "Cache-Control": "no-store" } as const;

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });

export const unauthorized = () => json({ error: "Please sign in to continue." }, 401);

/** Reads a request body as text but gives up as soon as it exceeds `maxChars` (so a huge upload never gets buffered). */
export async function readLimitedText(req: Request, maxChars: number): Promise<{ ok: true; text: string } | { ok: false }> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxChars * 4) return { ok: false };
  if (!req.body) return { ok: true, text: "" };
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    if (text.length > maxChars) { try { await reader.cancel(); } catch { /* ignore */ } return { ok: false }; }
  }
  text += decoder.decode();
  return { ok: true, text };
}

/** `Set-Cookie` that clears the customer session. */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
