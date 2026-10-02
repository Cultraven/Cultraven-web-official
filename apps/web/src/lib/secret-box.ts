/**
 * AES-256-GCM encryption for secrets stored in the database (the SMTP password).
 * Key = SHA-256 of SETTINGS_ENC_KEY (preferred) or SESSION_SECRET. Never stored in the DB.
 * Format: "v1.<iv>.<tag>.<ciphertext>" (base64url).
 */
import crypto from "crypto";

function key(env: NodeJS.ProcessEnv = process.env): Buffer {
  const secret = env.SETTINGS_ENC_KEY || env.SESSION_SECRET;
  if (!secret) throw new Error("SETTINGS_ENC_KEY or SESSION_SECRET must be set to store secrets");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string, env?: NodeJS.ProcessEnv): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(env), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

/** Returns null when the value is missing, tampered with, or was encrypted with a different key. */
export function decryptSecret(token: string | undefined | null, env?: NodeJS.ProcessEnv): string | null {
  if (!token) return null;
  const [v, iv, tag, data] = token.split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", key(env), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
