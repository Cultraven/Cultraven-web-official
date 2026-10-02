import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret } from "./secret-box";

const env = { SESSION_SECRET: "unit-test-secret" } as any;

describe("secret-box", () => {
  it("round-trips and never stores plaintext", () => {
    const t = encryptSecret("app-password-1234", env);
    expect(t.startsWith("v1.")).toBe(true);
    expect(t).not.toContain("app-password");
    expect(decryptSecret(t, env)).toBe("app-password-1234");
  });
  it("uses a fresh IV each time", () => expect(encryptSecret("x", env)).not.toBe(encryptSecret("x", env)));
  it("rejects tampering, wrong key and junk", () => {
    const t = encryptSecret("secret", env);
    const bad = t.slice(0, -2) + (t.endsWith("AA") ? "BB" : "AA");
    expect(decryptSecret(bad, env)).toBeNull();
    expect(decryptSecret(t, { SESSION_SECRET: "other" } as any)).toBeNull();
    for (const j of [null, undefined, "", "v1.a.b", "garbage", "v2.a.b.c"]) expect(decryptSecret(j as any, env)).toBeNull();
  });
  it("prefers SETTINGS_ENC_KEY", () => {
    const t = encryptSecret("s", { SESSION_SECRET: "a", SETTINGS_ENC_KEY: "b" } as any);
    expect(decryptSecret(t, { SESSION_SECRET: "zzz", SETTINGS_ENC_KEY: "b" } as any)).toBe("s");
  });
});
