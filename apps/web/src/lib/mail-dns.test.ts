import { describe, it, expect } from "vitest";
import { analyseSpf, analyseDmarc, analyseDkim, checkMailDns, domainOf, withInclude, type DnsResolver } from "./mail-dns";

/** A fake DNS: name -> TXT records, plus MX. Anything not listed behaves like a real "no such record". */
function fakeDns(txts: Record<string, string[]>, mx: { exchange: string; priority: number }[] = []): DnsResolver {
  const miss = () => Object.assign(new Error("queryTxt ENOTFOUND"), { code: "ENOTFOUND" });
  return {
    resolveTxt: async (n) => { if (!txts[n.toLowerCase()]) throw miss(); return txts[n.toLowerCase()].map((s) => [s]); },
    resolveMx: async () => { if (!mx.length) throw miss(); return mx; },
  };
}

describe("domainOf", () => {
  it("takes the domain of an address", () => {
    expect(domainOf("orders@cultraven.com")).toBe("cultraven.com");
    expect(domainOf(" Orders@CultRaven.com ")).toBe("cultraven.com");
    expect(domainOf("not an email")).toBe("");
    expect(domainOf("")).toBe("");
  });
});

describe("SPF", () => {
  it("missing -> asks for the Google record", () => {
    const r = analyseSpf([], "_spf.google.com", "cultraven.com");
    expect(r.status).toBe("missing");
    expect(r.add).toEqual({ type: "TXT", name: "@", value: "v=spf1 include:_spf.google.com ~all" });
  });
  it("other TXT records (like the Google site verification) are not SPF", () => {
    expect(analyseSpf(["google-site-verification=abc"], "_spf.google.com", "x.com").status).toBe("missing");
  });
  it("a correct record is ok", () => {
    expect(analyseSpf(["v=spf1 include:_spf.google.com ~all"], "_spf.google.com", "x.com").status).toBe("ok");
  });
  it("a record without the sender is fixed in place, keeping what was there", () => {
    const r = analyseSpf(["v=spf1 include:mailgun.org -all"], "_spf.google.com", "x.com");
    expect(r.status).toBe("fix");
    expect(r.add!.value).toBe("v=spf1 include:mailgun.org include:_spf.google.com -all");
  });
  it("two SPF records are flagged (receivers ignore both)", () => {
    expect(analyseSpf(["v=spf1 a ~all", "v=spf1 include:_spf.google.com ~all"], "_spf.google.com", "x.com").status).toBe("fix");
  });
  it("another provider: only checks one exists, never invents a value", () => {
    const m = analyseSpf([], null, "x.com");
    expect(m.status).toBe("missing");
    expect(m.add).toBeUndefined();
    expect(analyseSpf(["v=spf1 include:spf.brevo.com ~all"], null, "x.com").status).toBe("ok");
  });
  it("withInclude puts the include before the final all, or appends", () => {
    expect(withInclude("v=spf1 a mx ~all", "_spf.google.com")).toBe("v=spf1 a mx include:_spf.google.com ~all");
    expect(withInclude("v=spf1 a", "_spf.google.com")).toBe("v=spf1 a include:_spf.google.com");
    expect(withInclude("v=spf1 include:_spf.google.com ~all", "_spf.google.com")).toBe("v=spf1 include:_spf.google.com ~all");
  });
});

describe("DMARC", () => {
  it("missing -> proposes a monitoring record that reports to support", () => {
    const r = analyseDmarc([], "cultraven.com", "support@cultraven.com");
    expect(r.status).toBe("missing");
    expect(r.add).toEqual({ type: "TXT", name: "_dmarc", value: "v=DMARC1; p=none; rua=mailto:support@cultraven.com" });
  });
  it("present is ok, and p=none says it is monitoring only", () => {
    expect(analyseDmarc(["v=DMARC1; p=none"], "x.com", "s@x.com").message).toMatch(/monitoring/);
    expect(analyseDmarc(["v=DMARC1; p=reject"], "x.com", "s@x.com").message).toMatch(/reject/);
  });
});

describe("DKIM", () => {
  it("not found gives the Google Admin steps, with the selector name", () => {
    const r = analyseDkim(null, undefined, "cultraven.com", true);
    expect(r.status).toBe("missing");
    expect(r.steps!.join(" ")).toMatch(/Authenticate email/);
    expect(r.steps!.join(" ")).toMatch(/google\._domainkey/);
  });
});

describe("whole check", () => {
  it("cultraven.com as it was in production: only a site-verification TXT and an old-style MX -> three things missing", async () => {
    const dns = fakeDns({ "cultraven.com": ["google-site-verification=e1SbcOLBpUwFY9aukiDbBJH3J6EQTnsnfpqMYPJKSlA"] }, [{ exchange: "SMTP.GOOGLE.com", priority: 1 }]);
    const r = await checkMailDns("orders@cultraven.com", "smtp.gmail.com", "support@cultraven.com", dns);
    expect(r.domain).toBe("cultraven.com");
    expect([r.spf.status, r.dkim.status, r.dmarc.status]).toEqual(["missing", "missing", "missing"]);
    expect(r.allGood).toBe(false);
    expect(r.mx).toEqual({ status: "ok", records: ["1 SMTP.GOOGLE.com"] });
  });
  it("everything published -> allGood", async () => {
    const dns = fakeDns({ "cultraven.com": ["v=spf1 include:_spf.google.com ~all"], "_dmarc.cultraven.com": ["v=DMARC1; p=none; rua=mailto:support@cultraven.com"], "google._domainkey.cultraven.com": ["v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA"] }, [{ exchange: "aspmx.l.google.com", priority: 1 }]);
    const r = await checkMailDns("orders@cultraven.com", "smtp.gmail.com", "support@cultraven.com", dns);
    expect(r.allGood).toBe(true);
    expect(r.dkim.found).toBe("google._domainkey.cultraven.com");
  });
  it("a DKIM key under another selector is found too", async () => {
    const dns = fakeDns({ "cultraven.com": ["v=spf1 include:_spf.google.com ~all"], "selector1._domainkey.cultraven.com": ["v=DKIM1; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA"] });
    expect((await checkMailDns("orders@cultraven.com", "smtp.gmail.com", "s@cultraven.com", dns)).dkim.status).toBe("ok");
  });
  it("a real DNS failure (not 'no such record') is reported, never shown as 'missing'", async () => {
    const broken: DnsResolver = { resolveTxt: async () => { throw Object.assign(new Error("refused"), { code: "ECONNREFUSED" }); }, resolveMx: async () => [] };
    await expect(checkMailDns("orders@cultraven.com", "smtp.gmail.com", "s@cultraven.com", broken)).rejects.toThrow();
  });
  it("refuses an invalid From address", async () => {
    await expect(checkMailDns("nope", "smtp.gmail.com", "s@x.com", fakeDns({}))).rejects.toThrow(/valid From email/);
  });
});

describe("DNS over HTTPS fallback", () => {
  it("reads TXT (including quoted, split records) and MX answers, and treats a missing name as empty", async () => {
    const { dohResolver } = await import("./mail-dns");
    const answers: Record<string, any> = {
      "TXT cultraven.com": { Status: 0, Answer: [{ type: 16, data: '"v=spf1 include:_spf.google.com ~all"' }, { type: 16, data: '"google-site-verification=abc" "def"' }] },
      "MX cultraven.com": { Status: 0, Answer: [{ type: 15, data: "1 smtp.google.com." }] },
      "TXT _dmarc.cultraven.com": { Status: 3 },
    };
    const orig = globalThis.fetch;
    globalThis.fetch = (async (url: string) => { const u = new URL(url); const key = `${u.searchParams.get("type")} ${u.searchParams.get("name")}`; return { ok: true, status: 200, json: async () => answers[key] ?? { Status: 3 } }; }) as any;
    try {
      expect(await dohResolver.resolveTxt("cultraven.com")).toEqual([["v=spf1 include:_spf.google.com ~all"], ["google-site-verification=abc", "def"]]);
      expect(await dohResolver.resolveMx("cultraven.com")).toEqual([{ priority: 1, exchange: "smtp.google.com" }]);
      expect(await dohResolver.resolveTxt("_dmarc.cultraven.com")).toEqual([]);
    } finally { globalThis.fetch = orig; }
  });
});
