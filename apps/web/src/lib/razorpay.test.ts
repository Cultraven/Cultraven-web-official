import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  getRazorpayConfig, getWebhookSecret, verifyPaymentSignature, verifyWebhookSignature,
  resolveRazorpay, razorpayMode, explainRazorpayStatus, testRazorpayCredentials, RAZORPAY_KEY_ID_PATTERN,
} from "./razorpay";

const hmac = (secret: string, data: string) => crypto.createHmac("sha256", secret).update(data).digest("hex");

describe("getRazorpayConfig", () => {
  it("is null when nothing is set", () => expect(getRazorpayConfig({} as any)).toBeNull());
  it("treats the template placeholders as unset", () => {
    expect(getRazorpayConfig({ NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_XXXXXXXXXXXXXXXXXX", RAZORPAY_KEY_SECRET: "your_razorpay_secret_here" } as any)).toBeNull();
  });
  it("is null when only the id is real", () => expect(getRazorpayConfig({ RAZORPAY_KEY_ID: "rzp_test_abc123", RAZORPAY_KEY_SECRET: "" } as any)).toBeNull());
  it("accepts real keys and falls back to the public key id", () => {
    expect(getRazorpayConfig({ NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_Ab12Cd34", RAZORPAY_KEY_SECRET: "s3cr3tvalue" } as any)).toEqual({ keyId: "rzp_test_Ab12Cd34", keySecret: "s3cr3tvalue" });
  });
  it("tolerates quotes and spaces around values", () => {
    expect(getRazorpayConfig({ RAZORPAY_KEY_ID: ' "rzp_live_Real1" ', RAZORPAY_KEY_SECRET: "'sec'" } as any)).toEqual({ keyId: "rzp_live_Real1", keySecret: "sec" });
  });
  it("webhook secret placeholder is unset", () => {
    expect(getWebhookSecret({ RAZORPAY_WEBHOOK_SECRET: "your_razorpay_webhook_secret_here" } as any)).toBeNull();
    expect(getWebhookSecret({ RAZORPAY_WEBHOOK_SECRET: "whsec_123" } as any)).toBe("whsec_123");
  });
});

describe("verifyPaymentSignature", () => {
  const secret = "topsecret";
  const sig = hmac(secret, "order_1|pay_1");
  it("accepts the genuine signature", () => expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true));
  it("rejects a tampered order, payment or secret", () => {
    expect(verifyPaymentSignature("order_2", "pay_1", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "other")).toBe(false);
  });
  it("rejects malformed signatures without throwing", () => {
    for (const bad of ["", "zz", "abc", sig.slice(1), sig + "00", "' OR 1=1 --"]) expect(verifyPaymentSignature("order_1", "pay_1", bad, secret)).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured" });
  const sig = hmac("whsec", body);
  it("accepts the genuine signature", () => expect(verifyWebhookSignature(body, sig, "whsec")).toBe(true));
  it("rejects when the body changes", () => expect(verifyWebhookSignature(body + " ", sig, "whsec")).toBe(false));
});

describe("resolveRazorpay (DB over env, master switch, placeholders)", () => {
  const ENV = { RAZORPAY_KEY_ID: "rzp_test_EnvKey1234", RAZORPAY_KEY_SECRET: "envsecret", RAZORPAY_WEBHOOK_SECRET: "envhook" } as any;
  const DB = { enabled: true, keyId: "rzp_live_DbKey123456", keySecret: "dbsecret", webhookSecret: "dbhook" };

  it("nothing anywhere -> not configured", () => {
    const r = resolveRazorpay(null, {} as any);
    expect(r).toMatchObject({ config: null, source: "none", online: false, enabled: true, mode: null, webhookSecret: null });
  });
  it("env only -> env keys, online", () => {
    const r = resolveRazorpay(null, ENV);
    expect(r).toMatchObject({ config: { keyId: "rzp_test_EnvKey1234", keySecret: "envsecret" }, source: "env", online: true, mode: "test", webhookSecret: "envhook" });
  });
  it("admin keys beat env keys", () => {
    const r = resolveRazorpay(DB, ENV);
    expect(r).toMatchObject({ config: { keyId: "rzp_live_DbKey123456", keySecret: "dbsecret" }, source: "admin", online: true, mode: "live", webhookSecret: "dbhook" });
  });
  it("admin keys work without any env", () => {
    expect(resolveRazorpay(DB, {} as any)).toMatchObject({ source: "admin", online: true });
  });
  it("master switch OFF -> unavailable for new orders, even though env keys exist", () => {
    const r = resolveRazorpay({ ...DB, enabled: false }, ENV);
    expect(r.online).toBe(false);
    expect(r.enabled).toBe(false);
    // ...but the credentials stay resolvable so an in-flight payment can still be verified
    expect(r.config).toEqual({ keyId: "rzp_live_DbKey123456", keySecret: "dbsecret" });
    expect(r.webhookSecret).toBe("dbhook");
  });
  it("switch OFF with only env keys still disables online payment", () => {
    const r = resolveRazorpay({ enabled: false }, ENV);
    expect(r.online).toBe(false);
    expect(r.config?.keyId).toBe("rzp_test_EnvKey1234");
  });
  it("a saved doc without usable keys falls back to env and respects its switch", () => {
    expect(resolveRazorpay({ enabled: true, keyId: "rzp_live_OnlyId1234", keySecret: null }, ENV)).toMatchObject({ source: "env", online: true });
    expect(resolveRazorpay({ enabled: true, keyId: "rzp_live_OnlyId1234", keySecret: null }, {} as any)).toMatchObject({ source: "none", online: false });
  });
  it("placeholders in the admin doc count as unset", () => {
    const r = resolveRazorpay({ enabled: true, keyId: "rzp_test_XXXXXXXXXXXXXX", keySecret: "your_razorpay_secret_here", webhookSecret: "your_razorpay_webhook_secret_here" }, ENV);
    expect(r).toMatchObject({ source: "env", webhookSecret: "envhook" });
  });
  it("placeholders in env + nothing saved -> offline", () => {
    const r = resolveRazorpay(null, { RAZORPAY_KEY_ID: "rzp_test_xxxxxxxxxxxxxx", RAZORPAY_KEY_SECRET: "your_razorpay_secret_here" } as any);
    expect(r).toMatchObject({ config: null, online: false, source: "none" });
  });
  it("webhook secret: admin value, else env, independent of the keys", () => {
    expect(resolveRazorpay({ enabled: true, keyId: DB.keyId, keySecret: DB.keySecret, webhookSecret: null }, ENV).webhookSecret).toBe("envhook");
    expect(resolveRazorpay({ enabled: true, keyId: DB.keyId, keySecret: DB.keySecret, webhookSecret: "dbhook" }, {} as any).webhookSecret).toBe("dbhook");
  });
  it("a missing `enabled` field means enabled", () => {
    expect(resolveRazorpay({ keyId: DB.keyId, keySecret: DB.keySecret }, {} as any).online).toBe(true);
  });
  it("never returns a quoted/padded secret", () => {
    expect(resolveRazorpay({ enabled: true, keyId: ' "rzp_test_Pad123456" ', keySecret: " 'abc123xyz' " }, {} as any).config).toEqual({ keyId: "rzp_test_Pad123456", keySecret: "abc123xyz" });
  });
});

describe("razorpayMode / key id pattern", () => {
  it("derives the mode from the prefix", () => {
    expect(razorpayMode("rzp_test_abc")).toBe("test");
    expect(razorpayMode("rzp_live_abc")).toBe("live");
    for (const v of ["", null, undefined, "key_123", "RZP_TEST_abc", "xrzp_test_abc"]) expect(razorpayMode(v as any)).toBeNull();
  });
  it("accepts well-formed ids only", () => {
    expect(RAZORPAY_KEY_ID_PATTERN.test("rzp_test_Ab12Cd34Ef56")).toBe(true);
    expect(RAZORPAY_KEY_ID_PATTERN.test("rzp_live_Ab12Cd34Ef56")).toBe(true);
    for (const v of ["rzp_prod_Ab12Cd34Ef56", "rzp_test_", "rzp_test_ab", "rzp_test_a b c d e f", "rzp_test_Ab12Cd34Ef56\n", "rzp_test_$ne"]) expect(RAZORPAY_KEY_ID_PATTERN.test(v)).toBe(false);
  });
});

describe("testRazorpayCredentials", () => {
  const cfg = { keyId: "rzp_test_Ab12Cd34Ef56", keySecret: "supersecretvalue" };
  const reply = (status: number, body: unknown = {}) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("200 -> ok with the mode", async () => expect(await testRazorpayCredentials(cfg, reply(200, { items: [] }))).toEqual({ ok: true, mode: "test" }));
  it("401 -> plain-English invalid keys message, no secrets", async () => {
    const r = await testRazorpayCredentials(cfg, reply(401, { error: { description: "Authentication failed supersecretvalue" } }));
    expect(r.ok).toBe(false);
    const text = JSON.stringify(r);
    expect(text).toMatch(/rejected these keys/i);
    expect(text).not.toContain("supersecretvalue");
    expect(text).not.toContain("Authentication failed");
  });
  it("sends basic auth to the Razorpay API and nothing else", async () => {
    let seen: { url: string; auth: string } | null = null;
    const f = (async (url: string, init: RequestInit) => { seen = { url, auth: (init.headers as any).Authorization }; return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    await testRazorpayCredentials(cfg, f);
    expect(seen!.url).toBe("https://api.razorpay.com/v1/orders?count=1");
    expect(seen!.auth).toBe("Basic " + Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64"));
  });
  it("network failure -> reachability message (and never throws)", async () => {
    const boom = (async () => { throw new Error("getaddrinfo ENOTFOUND api.razorpay.com supersecretvalue"); }) as unknown as typeof fetch;
    const r = await testRazorpayCredentials(cfg, boom);
    expect(r).toMatchObject({ ok: false });
    expect(JSON.stringify(r)).toMatch(/could not reach/i);
    expect(JSON.stringify(r)).not.toContain("supersecretvalue");
  });
  it("maps statuses", () => {
    expect(explainRazorpayStatus(400)).toMatch(/rejected/);
    expect(explainRazorpayStatus(403)).toMatch(/not allowing/);
    expect(explainRazorpayStatus(429)).toMatch(/rate-limiting/);
    expect(explainRazorpayStatus(503)).toMatch(/trouble/);
    expect(explainRazorpayStatus(418)).toMatch(/unexpected/);
  });
});
