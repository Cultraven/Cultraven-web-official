/**
 * Profile-photo validation (server side, pure — unit tested).
 *
 * The browser resizes the picture to 256x256 JPEG before uploading, but the server never trusts that:
 *  - the body must be a base64 data URL whose declared type is image/jpeg, image/png or image/webp (nothing else — no SVG, GIF, HTML ...),
 *  - the decoded bytes must be <= 150 KB,
 *  - the file's magic bytes must really be that image type (a declared "image/jpeg" that starts with PNG/SVG/HTML bytes is rejected).
 */

export const AVATAR_MAX_BYTES = 150 * 1024;
export type AvatarMime = "image/jpeg" | "image/png" | "image/webp";
export const AVATAR_MIMES: readonly AvatarMime[] = ["image/jpeg", "image/png", "image/webp"];

/** Largest request body we will even look at: 150 KB of bytes is ~200 KB of base64, plus the `data:...;base64,` prefix and JSON wrapper. */
export const AVATAR_MAX_BODY_CHARS = Math.ceil(AVATAR_MAX_BYTES / 3) * 4 + 200;

const DATA_URL = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/]+={0,2})$/i;

export type AvatarCheck =
  | { ok: true; mime: AvatarMime; bytes: Buffer; dataUrl: string }
  | { ok: false; status: 400 | 413 | 415; error: string };

/** Identify the image type from the file signature (magic bytes), ignoring whatever the client claimed. */
export function sniffImageMime(b: Uint8Array): AvatarMime | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

export function parseAvatarDataUrl(input: unknown): AvatarCheck {
  if (typeof input !== "string" || input.length === 0) return { ok: false, status: 400, error: "Send the picture as a data URL." };
  if (input.length > AVATAR_MAX_BODY_CHARS) return { ok: false, status: 413, error: "That picture is too large (max 150 KB after resizing)." };

  const m = DATA_URL.exec(input.trim());
  if (!m) return { ok: false, status: 400, error: "Send the picture as a base64 data URL." };

  const declared = m[1].toLowerCase();
  if (!(AVATAR_MIMES as readonly string[]).includes(declared)) {
    return { ok: false, status: 415, error: "Only JPEG, PNG or WebP pictures are allowed." };
  }
  const b64 = m[2];
  if (b64.length % 4 !== 0) return { ok: false, status: 400, error: "The picture data is corrupt." };

  const bytes = Buffer.from(b64, "base64");
  if (bytes.length === 0) return { ok: false, status: 400, error: "The picture data is empty." };
  if (bytes.length > AVATAR_MAX_BYTES) return { ok: false, status: 413, error: "That picture is too large (max 150 KB after resizing)." };

  const real = sniffImageMime(bytes);
  if (!real) return { ok: false, status: 415, error: "That file is not a JPEG, PNG or WebP picture." };
  if (real !== declared) return { ok: false, status: 415, error: "The picture does not match its declared type." };

  return { ok: true, mime: real, bytes, dataUrl: `data:${real};base64,${b64}` };
}

/** Decode a stored data URL back into bytes + type for serving (null if the stored value is not a valid avatar). */
export function decodeStoredAvatar(stored: unknown): { mime: AvatarMime; bytes: Buffer } | null {
  const r = parseAvatarDataUrl(stored);
  return r.ok ? { mime: r.mime, bytes: r.bytes } : null;
}
