/**
 * Razorpay configuration + signature helpers (server-only).
 *
 * Credentials come from, in order:
 *   1. Admin -> Settings -> Payments (MongoDB `settings` document "razorpay"; secrets AES-GCM encrypted via secret-box),
 *   2. the RAZORPAY_* environment variables (placeholders from .env.example count as "not set").
 * The admin "Enable online payments" switch is a kill switch: when it is OFF, online payment is unavailable for NEW
 * orders even if environment keys exist. Verifying / reconciling payments that were already started keeps working
 * (it uses `ignoreSwitch`), so flipping the switch never strands a customer who is mid-payment.
 *
 * `resolveRazorpay()` is a pure function (stored settings + env in, decision out) so the precedence rules are unit-tested.
 */

import crypto from "crypto";
import { decryptSecret } from "@/lib/secret-box";

/** Values copied from the template count as "not set". */
const PLACEHOLDER = /^(|your_.*|rzp_(test|live)_x+|x+|changeme|todo)$/i;

function real(v: string | undefined): string | null {
  const t = (v ?? "").trim().replace(/^["']+|["']+$/g, "");
  return PLACEHOLDER.test(t) ? null : t;
}

/** True for template placeholders / empty values ("your_razorpay_secret_here", "rzp_test_xxxxxx", ...). */
export function isPlaceholderCredential(v: string | undefined | null): boolean {
  return real(v ?? undefined) === null;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

/** Key id + secret, or null while they are missing / still placeholders. The key id falls back to the public one. */
export function getRazorpayConfig(env: NodeJS.ProcessEnv = process.env): RazorpayConfig | null {
  const keyId = real(env.RAZORPAY_KEY_ID) ?? real(env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  const keySecret = real(env.RAZORPAY_KEY_SECRET);
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export function getWebhookSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  return real(env.RAZORPAY_WEBHOOK_SECRET);
}

export type RazorpayMode = "test" | "live";

/** "rzp_test_..." -> "test", "rzp_live_..." -> "live", anything else -> null. */
export function razorpayMode(keyId: string | null | undefined): RazorpayMode | null {
  const m = /^rzp_(test|live)_/.exec((keyId ?? "").trim());
  return m ? (m[1] as RazorpayMode) : null;
}

/** What the admin may save as Key ID: the mode prefix plus an alphanumeric id. */
export const RAZORPAY_KEY_ID_PATTERN = /^rzp_(test|live)_[A-Za-z0-9]{6,40}$/;

/** Admin-saved settings AFTER decryption (never leave the server). */
export interface StoredRazorpay {
  enabled?: boolean;
  keyId?: string | null;
  keySecret?: string | null;
  webhookSecret?: string | null;
}

export interface ResolvedRazorpay {
  /** Key id + secret to use, or null when none are configured. Present even when the switch is off (see ignoreSwitch). */
  config: RazorpayConfig | null;
  webhookSecret: string | null;
  /** Where `config` came from. */
  source: "admin" | "env" | "none";
  /** False only when the admin switched online payments off. */
  enabled: boolean;
  /** Can NEW online payments be started right now? (keys present AND switch on) */
  online: boolean;
  mode: RazorpayMode | null;
}

/**
 * Pure precedence rules:
 *  - admin keys (both id and secret real) beat environment keys;
 *  - a saved document with enabled === false switches online payments off for new orders, whatever the env says;
 *  - nothing saved (or only an incomplete document) -> environment variables decide.
 */
export function resolveRazorpay(stored: StoredRazorpay | null | undefined, env: NodeJS.ProcessEnv = process.env): ResolvedRazorpay {
  const sKeyId = real(stored?.keyId ?? undefined);
  const sSecret = real(stored?.keySecret ?? undefined);
  const adminCfg: RazorpayConfig | null = sKeyId && sSecret ? { keyId: sKeyId, keySecret: sSecret } : null;
  const envCfg = getRazorpayConfig(env);
  const config = adminCfg ?? envCfg;
  const enabled = stored ? stored.enabled !== false : true;
  return {
    config,
    webhookSecret: real(stored?.webhookSecret ?? undefined) ?? getWebhookSecret(env),
    source: adminCfg ? "admin" : envCfg ? "env" : "none",
    enabled,
    online: !!config && enabled,
    mode: razorpayMode(config?.keyId),
  };
}

/** Reads + decrypts the admin-saved settings. Null when nothing is saved or the database is unreachable. */
export async function loadStoredRazorpay(): Promise<StoredRazorpay | null> {
  try {
    const [{ connectToDatabase }, { Setting }] = await Promise.all([import("@/lib/db"), import("@/lib/models/Setting")]);
    await connectToDatabase();
    const doc = (await Setting.findOne({ key: "razorpay" }).lean()) as { value?: Record<string, unknown> } | null;
    const v = doc?.value;
    if (!v || typeof v !== "object") return null;
    const keySecret = decryptSecret(typeof v.keySecretEnc === "string" ? v.keySecretEnc : null);
    const webhookSecret = decryptSecret(typeof v.webhookSecretEnc === "string" ? v.webhookSecretEnc : null);
    if ((v.keySecretEnc && !keySecret) || (v.webhookSecretEnc && !webhookSecret)) {
      console.warn("[razorpay] saved secrets could not be decrypted (SETTINGS_ENC_KEY / SESSION_SECRET changed?). Falling back to environment keys.");
    }
    return { enabled: v.enabled !== false, keyId: typeof v.keyId === "string" ? v.keyId : null, keySecret, webhookSecret };
  } catch (e) {
    console.error("[razorpay] could not read saved settings:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Full resolution (DB over env) as seen right now. */
export async function getRazorpayStatusAsync(): Promise<ResolvedRazorpay> {
  return resolveRazorpay(await loadStoredRazorpay());
}

/**
 * Key id + secret for the request at hand, or null. New payments need the admin switch ON (default). Pass
 * `{ ignoreSwitch: true }` when finishing a payment that was already started (verify, webhook).
 */
export async function getRazorpayConfigAsync(opts: { ignoreSwitch?: boolean } = {}): Promise<RazorpayConfig | null> {
  const r = await getRazorpayStatusAsync();
  return r.online || (opts.ignoreSwitch && r.config) ? r.config : null;
}

/** Webhook secret (admin-saved, else env). Independent of the switch: in-flight payments must still reconcile. */
export async function getWebhookSecretAsync(): Promise<string | null> {
  return (await getRazorpayStatusAsync()).webhookSecret;
}

/** Plain-English reason for a failed credentials check, from the HTTP status Razorpay answered with. Never echoes upstream text. */
export function explainRazorpayStatus(status: number): string {
  if (status === 400 || status === 401) return "Razorpay rejected these keys. Check the Key ID and Key Secret are copied exactly and belong to the same mode (test or live).";
  if (status === 403) return "Razorpay accepted the keys but is not allowing access. Check the keys are active in your Razorpay dashboard.";
  if (status === 429) return "Razorpay is rate-limiting requests right now. Wait a minute and try again.";
  if (status >= 500) return "Razorpay is having trouble right now. Try again in a few minutes.";
  return "Razorpay returned an unexpected response. Try again, and check the keys.";
}

export type CredentialCheck = { ok: true; mode: RazorpayMode | null } | { ok: false; message: string };

/** Calls Razorpay (GET /v1/orders?count=1, read-only) with basic auth to prove the keys work. */
export async function testRazorpayCredentials(cfg: RazorpayConfig, fetchImpl: typeof fetch = fetch): Promise<CredentialCheck> {
  try {
    const auth = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64");
    const res = await fetchImpl("https://api.razorpay.com/v1/orders?count=1", {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? { ok: true, mode: razorpayMode(cfg.keyId) } : { ok: false, message: explainRazorpayStatus(res.status) };
  } catch {
    return { ok: false, message: "Could not reach Razorpay. Check the server's internet connection and try again." };
  }
}

function safeHexEqual(expectedHex: string, givenHex: string): boolean {
  if (!/^[0-9a-f]+$/i.test(givenHex) || givenHex.length !== expectedHex.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(givenHex, "hex"));
}

/** Checkout-complete signature: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeHexEqual(expected, signature);
}

/** Webhook signature: HMAC-SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeHexEqual(expected, signature);
}
