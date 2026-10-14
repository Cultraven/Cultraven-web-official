/**
 * The business's registered details — ONE place, used by the receipt PDF, every email (header/footer) and the site footer.
 * Source: the GST registration certificate (Regular registration, Proprietorship, valid from 02/09/2026).
 *
 * To change a detail, change it here (or override the receipt's seller block on the server with the INVOICE_SELLER_* variables).
 * `sellerName` is what is printed as the seller: set it to the exact Trade Name / Legal Name shown on the certificate.
 */
export const BUSINESS = {
  brand: "CULTRAVEN",
  sellerName: "CULTRAVEN",
  constitution: "Proprietorship",
  addressLines: ["162, Jay Shri Nagar", "Indore, Madhya Pradesh 452005"],
  gstin: "23BJHPH4892N1ZQ",
  supportEmail: "support@cultraven.com",
  /** Customer support line (calls + WhatsApp). Digits with the country code, so it can feed tel: and wa.me links directly. */
  supportPhoneDigits: "918962212605",
  website: "https://cultraven.com",
} as const;

export const businessAddress = (sep = ", ") => BUSINESS.addressLines.join(sep);

/** "+91 89622 12605" — how the support number is printed in emails, the receipt and the site. */
export const supportPhoneDisplay = () => `+91 ${BUSINESS.supportPhoneDigits.slice(2, 7)} ${BUSINESS.supportPhoneDigits.slice(7)}`;

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Checks a GSTIN's shape AND its final check character (the official mod-36 rule), so a mistyped number is caught. */
export function isValidGstin(gstin: string): boolean {
  const g = String(gstin).trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = GSTIN_CHARS.indexOf(g[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(v / 36) + (v % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36] === g[14];
}
