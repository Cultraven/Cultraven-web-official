/**
 * Admin -> Settings -> Payments: Razorpay credentials.
 *
 *   GET  -> { keyId, hasSecret, hasWebhookSecret, enabled, mode, ... }   (secrets are NEVER returned)
 *   PUT  -> save { enabled, keyId, keySecret?, webhookSecret? }          (blank secret = keep the saved one)
 *
 * Stored in the Setting collection under key "razorpay"; both secrets are AES-256-GCM encrypted (lib/secret-box).
 * lib/razorpay.ts resolves these over the RAZORPAY_* environment variables at request time.
 * Admin-only, same-origin only, rate limited, strict zod validation, no request-body spreading.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Setting } from "@/lib/models/Setting";
import { encryptSecret, decryptSecret } from "@/lib/secret-box";
import { RAZORPAY_KEY_ID_PATTERN, getRazorpayConfig, getWebhookSecret, isPlaceholderCredential, loadStoredRazorpay, razorpayMode, resolveRazorpay } from "@/lib/razorpay";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

/** Blank / missing = "keep what is saved". Anything else must look like a real secret (no spaces, not a template placeholder). */
const optionalSecret = (min: number, label: string) =>
  z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => v === "" || (v.length >= min && /^\S+$/.test(v)), `${label} must be at least ${min} characters with no spaces`)
    .refine((v) => v === "" || !isPlaceholderCredential(v), `${label} still looks like a placeholder`);

const RazorpaySettingsBody = z
  .object({
    enabled: z.boolean(),
    keyId: z.string().trim().regex(RAZORPAY_KEY_ID_PATTERN, "Key ID must start with rzp_test_ or rzp_live_ (copy it from the Razorpay dashboard)"),
    keySecret: optionalSecret(8, "Key Secret"),
    webhookSecret: optionalSecret(6, "Webhook secret"),
  })
  .strict();

/** What the page may see. Never contains a secret. */
async function publicView() {
  const stored = await loadStoredRazorpay();
  const resolved = resolveRazorpay(stored);
  const envCfg = getRazorpayConfig();
  return {
    keyId: stored?.keyId ?? "",
    hasSecret: !!stored?.keySecret,
    hasWebhookSecret: !!stored?.webhookSecret,
    enabled: stored ? stored.enabled !== false : true,
    mode: resolved.mode ?? razorpayMode(stored?.keyId),
    // Extras for the page:
    source: resolved.source,
    online: resolved.online,
    envConfigured: !!envCfg,
    envKeyId: envCfg?.keyId ?? "",
    envHasWebhookSecret: !!getWebhookSecret(),
  };
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await publicView(), { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Could not load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(`admin-razorpay-save:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: retryHeaders(rl) });

  const body = await parseJsonBody(req, 4 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const p = RazorpaySettingsBody.safeParse(body.data);
  if (!p.success) {
    return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid settings", issues: p.error.flatten().fieldErrors }, { status: 422 });
  }
  const d = p.data;

  try {
    await connectToDatabase();
    const existing = (await Setting.findOne({ key: "razorpay" }).lean()) as { value?: Record<string, unknown> } | null;
    const ev = existing?.value ?? {};
    const keptSecretEnc = typeof ev.keySecretEnc === "string" && decryptSecret(ev.keySecretEnc) ? ev.keySecretEnc : null;
    const keptWebhookEnc = typeof ev.webhookSecretEnc === "string" && decryptSecret(ev.webhookSecretEnc) ? ev.webhookSecretEnc : null;

    // A saved secret belongs to the saved Key ID: changing the id means the secret must be re-entered.
    if (!d.keySecret && ev.keyId && ev.keyId !== d.keyId) {
      return NextResponse.json({ error: "You changed the Key ID, so enter the matching Key Secret too" }, { status: 422 });
    }
    const keySecretEnc = d.keySecret ? encryptSecret(d.keySecret) : keptSecretEnc;
    if (!keySecretEnc) return NextResponse.json({ error: "Enter the Key Secret" }, { status: 422 });
    const webhookSecretEnc = d.webhookSecret ? encryptSecret(d.webhookSecret) : keptWebhookEnc;

    await Setting.findOneAndUpdate(
      { key: "razorpay" },
      { $set: { value: { enabled: d.enabled, keyId: d.keyId, keySecretEnc, ...(webhookSecretEnc ? { webhookSecretEnc } : {}) } } },
      { upsert: true }
    );
    console.info(`[razorpay-settings] saved by admin (mode=${razorpayMode(d.keyId)}, enabled=${d.enabled})`);
    return NextResponse.json({ success: true, settings: await publicView() }, { headers: NO_STORE });
  } catch (e) {
    console.error("[razorpay-settings] save failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
