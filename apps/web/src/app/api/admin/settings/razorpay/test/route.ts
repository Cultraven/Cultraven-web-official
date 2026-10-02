/**
 * POST /api/admin/settings/razorpay/test
 *
 * "Test connection": asks Razorpay (read-only GET /v1/orders?count=1) whether the keys work.
 * Body (all optional): { keyId, keySecret } to test values typed into the form before saving.
 * With no secret in the body the saved keys (else the environment keys) are tested.
 * Replies with a plain-English reason on failure; neither secrets nor Razorpay's raw error text are ever returned.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { RAZORPAY_KEY_ID_PATTERN, getRazorpayStatusAsync, loadStoredRazorpay, razorpayMode, testRazorpayCredentials, type RazorpayConfig } from "@/lib/razorpay";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

const Body = z
  .object({
    keyId: z.string().trim().regex(RAZORPAY_KEY_ID_PATTERN, "Key ID must start with rzp_test_ or rzp_live_").optional(),
    keySecret: z.string().max(200).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Each test is an outbound call to Razorpay: keep it modest.
  const rl = rateLimit(`admin-razorpay-test:${clientIp(req)}`, 6, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Please wait a moment between tests" }, { status: 429, headers: retryHeaders(rl) });

  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const p = Body.safeParse(body.data);
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  try {
    let cfg: RazorpayConfig | null = null;
    const typedSecret = (p.data.keySecret ?? "").trim();
    if (typedSecret) {
      // Testing what is typed in the form (not saved yet).
      const keyId = p.data.keyId ?? (await loadStoredRazorpay())?.keyId ?? "";
      if (!RAZORPAY_KEY_ID_PATTERN.test(keyId)) return NextResponse.json({ error: "Enter the Key ID (rzp_test_... or rzp_live_...)" }, { status: 422 });
      cfg = { keyId, keySecret: typedSecret };
    } else {
      const stored = await loadStoredRazorpay();
      if (p.data.keyId && stored?.keyId && p.data.keyId !== stored.keyId) {
        return NextResponse.json({ error: "Enter the Key Secret to test a different Key ID" }, { status: 422 });
      }
      // Saved keys (else environment keys), whether or not the payments switch is on.
      cfg = (await getRazorpayStatusAsync()).config;
    }
    if (!cfg) return NextResponse.json({ ok: false, error: "No Razorpay keys saved yet. Enter the Key ID and Key Secret first." }, { status: 400, headers: NO_STORE });

    const r = await testRazorpayCredentials(cfg);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.message }, { status: 502, headers: NO_STORE });
    const mode = razorpayMode(cfg.keyId);
    return NextResponse.json(
      { ok: true, mode, message: `Connected to Razorpay${mode ? ` (${mode} mode)` : ""}. The keys work.` },
      { headers: NO_STORE }
    );
  } catch (e) {
    console.error("[razorpay-settings] test failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Could not run the test. Try again." }, { status: 500, headers: NO_STORE });
  }
}
