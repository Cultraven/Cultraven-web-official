/**
 * The public address of the shop, used for every link inside an email (track order, reset password, sign in…).
 *
 * Reads NEXT_PUBLIC_SITE_URL. If it is missing or not a web address, production falls back to the real site instead of
 * "localhost" (a reset link pointing at localhost would be useless to a customer); development keeps localhost.
 * Always returned without a trailing slash.
 */
import { BUSINESS } from "@/lib/business";

export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = (env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (/^https?:\/\/[^\s/?#]+/i.test(raw)) return raw.replace(/\/+$/, "");
  return env.NODE_ENV === "production" ? BUSINESS.website : "http://localhost:3000";
}
