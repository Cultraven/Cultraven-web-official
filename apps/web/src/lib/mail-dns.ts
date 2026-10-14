/**
 * "Will my emails reach the inbox?" — checks the three DNS records that let Gmail, Outlook and Yahoo trust mail sent
 * from your own domain: SPF (who may send), DKIM (a signature proving the mail is genuine) and DMARC (what to do with mail that
 * fails). Without them the mail server still says "sent", but the inbox provider files the message under Spam or drops it.
 *
 * Pure functions + an injectable resolver, so they are easy to test. The admin Email settings page shows the result.
 */
import { promises as nodeDns } from "dns";

export interface DnsResolver {
  resolveTxt(name: string): Promise<string[][]>;
  resolveMx(name: string): Promise<{ exchange: string; priority: number }[]>;
}

export type CheckStatus = "ok" | "missing" | "fix";
export interface DnsRecordToAdd { type: "TXT"; name: string; value: string }
export interface CheckItem { status: CheckStatus; title: string; message: string; found?: string; add?: DnsRecordToAdd; steps?: string[] }
export interface MailDnsReport { domain: string; google: boolean; allGood: boolean; spf: CheckItem; dkim: CheckItem; dmarc: CheckItem; mx: { status: "ok" | "missing"; records: string[] } }

const GOOGLE_INCLUDE = "_spf.google.com";
/** Selectors the common providers use (Google Workspace uses "google"). */
export const DKIM_SELECTORS = ["google", "default", "selector1", "selector2", "k1", "k2", "s1", "s2", "mail", "dkim", "zoho"];

const isGoogleHost = (host: string) => /(^|\.)(gmail|google|googlemail)\.com$/i.test(host.trim());

/** Everything after the @ of a valid address, lower-cased; "" when it isn't one. */
export function domainOf(email: string): string {
  const m = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(String(email ?? "").trim());
  return m ? m[1].toLowerCase() : "";
}

/** Put the include in front of the closing "all" of an existing SPF record (or append it). */
export function withInclude(record: string, include: string): string {
  const r = record.trim();
  if (new RegExp(`include:${include.replace(/[.]/g, "\\.")}`, "i").test(r)) return r;
  const m = /^(.*?)\s+([~\-?+]?all)\s*$/i.exec(r);
  return m ? `${m[1]} include:${include} ${m[2]}` : `${r} include:${include}`;
}

export function analyseSpf(records: string[], wantInclude: string | null, domain: string): CheckItem {
  const title = "SPF — who is allowed to send as your domain";
  const spf = records.filter((r) => /^v=spf1(\s|$)/i.test(r.trim()));
  if (spf.length === 0) {
    return {
      status: "missing", title,
      message: "No SPF record. Gmail can't confirm that your server may send mail for this domain, so it is likely to be filed as Spam.",
      add: wantInclude ? { type: "TXT", name: "@", value: `v=spf1 include:${wantInclude} ~all` } : undefined,
    };
  }
  if (spf.length > 1) {
    return { status: "fix", title, found: spf.join("  |  "), message: "There is more than one SPF record. Receivers ignore all of them when that happens — merge them into a single record." };
  }
  if (wantInclude && !new RegExp(`include:${wantInclude.replace(/[.]/g, "\\.")}`, "i").test(spf[0])) {
    return { status: "fix", title, found: spf[0], message: `Your SPF record doesn't include ${wantInclude}, which is what sends your mail. Change the existing record (keep only one) to the value below.`, add: { type: "TXT", name: "@", value: withInclude(spf[0], wantInclude) } };
  }
  return { status: "ok", title, found: spf[0], message: `SPF is set up for ${domain}.` };
}

export function analyseDkim(foundSelector: string | null, record: string | undefined, domain: string, google: boolean): CheckItem {
  const title = "DKIM — a signature that proves the mail is really yours";
  if (foundSelector) return { status: "ok", title, found: `${foundSelector}._domainkey.${domain}`, message: `DKIM is published (selector “${foundSelector}”). Make sure authentication is switched on with your mail provider.` };
  return {
    status: "missing", title,
    message: "No DKIM signature found. Without it Gmail treats the mail as unverified.",
    steps: google
      ? [
          "Open the Google Admin console → Apps → Google Workspace → Gmail → Authenticate email.",
          `Pick ${domain}, click “Generate new record” (2048-bit, selector google), and copy the TXT value it shows.`,
          `At your domain's DNS add a TXT record named google._domainkey with that value, and save.`,
          "Wait a few minutes, go back to the Admin console and click “Start authentication”.",
        ]
      : ["Your mail provider's “domain authentication” page gives you a DKIM record to add at your DNS. Add it, then click Check again."],
  };
}

export function analyseDmarc(records: string[], domain: string, reportTo: string): CheckItem {
  const title = "DMARC — what receivers should do with mail that fails the checks";
  const d = records.find((r) => /^v=DMARC1\b/i.test(r.trim()));
  if (d) {
    const policy = /\bp=(none|quarantine|reject)\b/i.exec(d)?.[1]?.toLowerCase() ?? "none";
    return { status: "ok", title, found: d, message: policy === "none" ? "DMARC is published in monitoring mode (p=none). That's a good start; tighten it to quarantine once your mail is passing." : `DMARC is published (policy ${policy}).` };
  }
  return {
    status: "missing", title,
    message: "No DMARC record. Gmail and Yahoo now expect one; without it your mail is much more likely to land in Spam.",
    add: { type: "TXT", name: "_dmarc", value: `v=DMARC1; p=none; rua=mailto:${reportTo}` },
  };
}

function withTimeout<T>(p: Promise<T>, ms = 5000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const late = new Promise<T>((_, rej) => { timer = setTimeout(() => rej(Object.assign(new Error("DNS lookup timed out"), { code: "ETIMEOUT" })), ms); });
  return Promise.race([p, late]).finally(() => clearTimeout(timer));
}
const EMPTY = new Set(["ENOTFOUND", "ENODATA", "ENOENT", "NXDOMAIN"]);

async function txt(r: DnsResolver, name: string): Promise<string[]> {
  try { return (await withTimeout(r.resolveTxt(name))).map((parts) => parts.join("")); }
  catch (e: any) { if (EMPTY.has(String(e?.code))) return []; throw e; }
}

// ── Resolvers ─────────────────────────────────────────────────────────────────────

const EMPTY_CODES = new Set(["ENOTFOUND", "ENODATA", "ENOENT", "NXDOMAIN"]);

async function dohQuery(name: string, type: "TXT" | "MX"): Promise<string[]> {
  const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!r.ok) throw Object.assign(new Error(`DNS over HTTPS answered ${r.status}`), { code: "EDOH" });
  const j = (await r.json()) as { Status?: number; Answer?: { type: number; data: string }[] };
  if (j.Status === 3 || !j.Answer) return []; // 3 = the name does not exist
  const want = type === "TXT" ? 16 : 15;
  return j.Answer.filter((a) => a.type === want).map((a) => a.data);
}

/** DNS over HTTPS (Cloudflare): works on any host that can make web requests, even where the system resolver is unavailable. */
export const dohResolver: DnsResolver = {
  resolveTxt: async (n) => (await dohQuery(n, "TXT")).map((d) => [...d.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])),
  resolveMx: async (n) => (await dohQuery(n, "MX")).map((d) => { const [pr, ex] = d.trim().split(/\s+/); return { priority: Number(pr), exchange: (ex ?? "").replace(/\.$/, "") }; }),
};

/** The system resolver first; if it can't answer at all (not "no such record"), ask over HTTPS instead. */
export const defaultResolver: DnsResolver = {
  resolveTxt: async (n) => { try { return await nodeDns.resolveTxt(n); } catch (e: any) { if (EMPTY_CODES.has(String(e?.code))) throw e; return dohResolver.resolveTxt(n); } },
  resolveMx: async (n) => { try { return await nodeDns.resolveMx(n); } catch (e: any) { if (EMPTY_CODES.has(String(e?.code))) throw e; return dohResolver.resolveMx(n); } },
};

/** Run the whole check for the domain of `fromEmail`, given the SMTP host in use (to know which SPF include is expected). */
export async function checkMailDns(fromEmail: string, smtpHost: string, reportTo: string, resolver: DnsResolver = defaultResolver): Promise<MailDnsReport> {
  const domain = domainOf(fromEmail);
  if (!domain) throw new Error("Save a valid From email first");
  const google = isGoogleHost(smtpHost);
  const [spfRecords, dmarcRecords, mx, ...dkim] = await Promise.all([
    txt(resolver, domain),
    txt(resolver, `_dmarc.${domain}`),
    withTimeout(resolver.resolveMx(domain)).catch((e: any) => { if (EMPTY.has(String(e?.code))) return []; throw e; }),
    ...DKIM_SELECTORS.map(async (sel) => ({ sel, recs: await txt(resolver, `${sel}._domainkey.${domain}`) })),
  ]);
  const hit = (dkim as { sel: string; recs: string[] }[]).find((d) => d.recs.some((r) => /v=DKIM1/i.test(r) || /\bp=[A-Za-z0-9+/=]{20,}/.test(r)));
  const spf = analyseSpf(spfRecords, google ? GOOGLE_INCLUDE : null, domain);
  const dk = analyseDkim(hit?.sel ?? null, hit?.recs[0], domain, google);
  const dm = analyseDmarc(dmarcRecords, domain, reportTo);
  return { domain, google, spf, dkim: dk, dmarc: dm, mx: { status: mx.length ? "ok" : "missing", records: mx.sort((a, b) => a.priority - b.priority).map((m) => `${m.priority} ${m.exchange}`) }, allGood: spf.status === "ok" && dk.status === "ok" && dm.status === "ok" };
}
