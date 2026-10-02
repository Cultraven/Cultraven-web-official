/**
 * Post-login redirect targets come from the `?redirect=` query string, so they are attacker-controlled.
 * Only same-site absolute paths are allowed ("/account"), never "//evil.com", "/\evil.com" or "https://...".
 * `prefix` optionally pins the target to a section (e.g. "/portal-secure" for the admin sign-in).
 */
export function safeRedirect(value: string | null | undefined, fallback: string, prefix?: string): string {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return fallback;
  if (prefix && value !== prefix && !value.startsWith(prefix + "/") && !value.startsWith(prefix + "?")) return fallback;
  return value;
}
