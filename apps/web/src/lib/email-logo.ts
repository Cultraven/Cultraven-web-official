/**
 * The CULTRAVEN logo as it appears in every email header (570x119 PNG, white wordmark + gold leaf, made for the navy header bar).
 *
 * Emails carry the logo INSIDE the message (an inline "cid:" attachment) instead of linking to the website, so it shows up
 * even when the site is down or not deployed yet, and in mail apps that block remote images. The same file lives at
 * public/email-logo.png (used for previews); lib/email-logo.test.ts fails if the two ever differ.
 */
export const LOGO_CID = "cultraven-logo";

export const EMAIL_LOGO_PNG_BASE64 =
  "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" +
  "gVAKQqAiHJuWyZr+rgcaNwzFqIVRFh2ds0THFCPsb2cL9w0qW46+E+oKFDRbAZUxKF1hnSM6xV42FOuT8A6WOV2pDMqW1sdSUGOn" +
  "o3OG6JTJoeMlf5jbqZaqkdn7wrUMtpykbFvnvG9/LXTK/bO0XkRQ15x43Zr1Gg+V8tGOzrmhk1Z8zbel50Mz15z2Vyxc0aoSliPo" +
  "5JwdOlB/2mYpjNR8Xhtyz2cB1DRWqW/nI3WGzUkPy7w3ibrYk7uux0km2U5IR4caPOpmlj+LG39a8qGx3mt7Vbu+fT/oBKWlvKiR" +
  "ecnq0i1qfLxQdzu4o0PY8QOozKyvNJ7mh4ydwUro5HR0MqWF8qAWj/PTZOxUJ6ejU/CNbL6CBW4ki7Oe+9bRyT0twzpd6dCIYr9X" +
  "3zo6fKB6aLghL3QDuaPTuCaDIY2FYUZy3zo6Tezg1W3k6y5zOjrr7JRbmO2xk9PR2XTSbWnaWieno7PP0eJzxPvW0VlPh6ryKOi+" +
  "dXQ2lRbuIv+tk9PR2cHOMkKnmzkdnR3bm5SU6BHkjs7Oz08pCN2TVh2dYf8oEqF7iUXfboHO0Ess+ua3/wVlFKumgrxDqwAAAABJ" +
  "RU5ErkJggg==";

/** The logo as plain bytes (a Uint8Array, which is what pdf-lib wants). */
export const emailLogoBytes = (): Uint8Array => Uint8Array.from(atob(EMAIL_LOGO_PNG_BASE64), (c) => c.charCodeAt(0));

const LOGO_SRC = /(<img\b[^>]*?\bsrc=")[^"]*\/email-logo\.png(")/g;

export interface InlineAttachment { filename: string; content: Buffer; contentType: string; cid: string; contentDisposition: "inline" }

/** Point the header logo at the inline attachment. Returns the html unchanged (and no attachment) when it has no logo. */
export function withInlineLogo(html: string): { html: string; attachment?: InlineAttachment } {
  if (!LOGO_SRC.test(html)) { LOGO_SRC.lastIndex = 0; return { html }; }
  LOGO_SRC.lastIndex = 0;
  return {
    html: html.replace(LOGO_SRC, `$1cid:${LOGO_CID}$2`),
    attachment: { filename: "cultraven-logo.png", content: Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64"), contentType: "image/png", cid: LOGO_CID, contentDisposition: "inline" },
  };
}
