/** The order-success page is reachable by order id alone, so never echo a full email address back. */
export function maskEmail(e: string): string {
  const [u, d] = (e || "").split("@");
  if (!u || !d) return "";
  return `${u.slice(0, 2)}${"*".repeat(Math.max(1, u.length - 2))}@${d}`;
}
