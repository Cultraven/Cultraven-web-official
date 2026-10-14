/**
 * Property-based ("hypothesis") tests. Instead of a handful of hand-picked examples, fast-check invents hundreds of inputs per
 * rule — including hostile and bizarre ones (empty strings, emoji, line breaks, huge numbers, Unicode tricks) — and checks that a rule
 * which must ALWAYS hold really does. When a rule fails, fast-check shrinks the input to the smallest example that breaks it.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { escapeHtml, estimatedDelivery, istDate, istDateTime } from "./email-templates";
import { rupeesInWords, prettyPhone } from "./invoice-pdf";
import { PasswordPolicy } from "./password";
import { TOKEN_SHAPE, hashToken, newToken } from "./password-reset";
import { domainOf, withInclude, analyseSpf, analyseDmarc } from "./mail-dns";
import { MAIL_CATEGORIES, MAIL_PROFILES, categoryOf, chosenProfile, cleanRouting, pickProfile, type MailProfile } from "./mail-routing";
import { siteUrl } from "./site-url";
import { supportConfig, cleanOrderNumber } from "./support";
import { signedInBeforePasswordChange } from "./customer-auth";
import { withInlineLogo } from "./email-logo";

/** `PROP_SCALE=10 pnpm test` searches ten times deeper (slower); CI uses the default. */
const SCALE = Number(process.env.PROP_SCALE) || 1;
const RUNS = { numRuns: 300 * SCALE };
/** Any text at all: ASCII, full Unicode (emoji, RTL marks, lone surrogates) and "binary" noise. */
const anyText = fc.oneof(fc.string(), fc.string({ unit: "grapheme" }), fc.string({ unit: "binary" }), fc.constantFrom("", " ", "\r\n", "‮", "<script>alert(1)</script>", "\"'><&"));

describe("escapeHtml", () => {
  const unescape = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  it("never leaves a markup character in the output, and loses nothing (unescaping returns the original)", () => {
    fc.assert(fc.property(anyText, (s) => {
      const e = escapeHtml(s);
      expect(e).not.toMatch(/[<>"']/);
      expect(e).not.toMatch(/&(?!(amp|lt|gt|quot|#39);)/);
      expect(unescape(e)).toBe(s);
    }), RUNS);
  });
  it("copes with whatever a database record can hold (null, undefined, numbers, booleans, dates, arrays)", () => {
    const dbValue = fc.oneof(fc.constant(null), fc.constant(undefined), fc.integer(), fc.double(), fc.boolean(), fc.date({ noInvalidDate: true }), fc.array(fc.string(), { maxLength: 3 }));
    fc.assert(fc.property(dbValue, (v) => { expect(typeof escapeHtml(v)).toBe("string"); }), RUNS);
  });
});

// ── Amount in words: checked against an independent parser, so the words and the number must agree ───────────────────
const UNITS: Record<string, number> = { Zero: 0, One: 1, Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7, Eight: 8, Nine: 9, Ten: 10, Eleven: 11, Twelve: 12, Thirteen: 13, Fourteen: 14, Fifteen: 15, Sixteen: 16, Seventeen: 17, Eighteen: 18, Nineteen: 19, Twenty: 20, Thirty: 30, Forty: 40, Fifty: 50, Sixty: 60, Seventy: 70, Eighty: 80, Ninety: 90 };
function wordsToNumber(words: string): number {
  let total = 0, current = 0;
  for (const w of words.replace(/-/g, " ").split(" ").filter(Boolean)) {
    if (w in UNITS) current += UNITS[w];
    else if (w === "Hundred") current *= 100;
    else if (w === "Thousand") { total += current * 1_000; current = 0; }
    else if (w === "Lakh") { total += current * 100_000; current = 0; }
    else if (w === "Crore") { total += current * 10_000_000; current = 0; }
    else throw new Error(`unexpected word ${w}`);
  }
  return total + current;
}
function wordsToPaise(s: string): number {
  let rupees = 0, paise = 0;
  const body = s.replace(/ Only$/, "");
  if (body.startsWith("Rupees ")) {
    const rest = body.slice(7);
    const [r, p] = rest.split(" and ");
    rupees = wordsToNumber(r);
    if (p) paise = wordsToNumber(p.replace(/ Paise$/, ""));
  } else paise = wordsToNumber(body.replace(/ Paise$/, ""));
  return rupees * 100 + paise;
}
describe("rupeesInWords", () => {
  it("round-trips: reading the words back gives exactly the amount, for any amount up to ₹1,000 crore", () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 100_000_000_000 }), (paise) => { expect(wordsToPaise(rupeesInWords(paise))).toBe(paise); }), { numRuns: 1500 });
  });
  it("is always tidy text: letters, single spaces and hyphens, starting with a capital and ending in Only", () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 100_000_000_000 }), (paise) => {
      const w = rupeesInWords(paise);
      expect(w).toMatch(/^[A-Z][A-Za-z -]* Only$/);
      expect(w).not.toMatch(/ {2}|--| -|- /);
    }), RUNS);
  });
  it("never throws and never prints NaN, for any input at all", () => {
    fc.assert(fc.property(fc.oneof(fc.double({ noNaN: false }), fc.integer(), fc.constant(undefined as unknown as number)), (v) => {
      const w = rupeesInWords(v as number);
      expect(w).toMatch(/Only$/);
      expect(w).not.toMatch(/NaN|undefined|Infinity/);
    }), RUNS);
  });
});

describe("prettyPhone", () => {
  it("either leaves the text alone or prints +91 xxxxx xxxxx with the same ten digits", () => {
    fc.assert(fc.property(anyText, (s) => {
      const out = prettyPhone(s);
      if (out === s) return;
      expect(out).toMatch(/^\+91 \d{5} \d{5}$/);
      expect(s.replace(/\D/g, "").endsWith(out.replace(/\D/g, "").slice(2))).toBe(true);
    }), RUNS);
  });
  it("any 10-digit mobile, however it is typed (+91, 0, spaces, dashes), prints the same way", () => {
    fc.assert(fc.property(fc.stringMatching(/^[6-9][0-9]{9}$/), fc.constantFrom("", "+91", "91", "0", "+91 ", "+91-"), (num, prefix) => {
      expect(prettyPhone(`${prefix}${num}`)).toBe(`+91 ${num.slice(0, 5)} ${num.slice(5)}`);
    }), RUNS);
  });
});

describe("password rule", () => {
  it("anything accepted really has 8+ characters, upper + lower case, a digit and fits bcrypt's 72 bytes (nothing weak slips through)", () => {
    fc.assert(fc.property(anyText, (s) => {
      if (PasswordPolicy.safeParse(s).success) {
        expect(s.length).toBeGreaterThanOrEqual(8);
        expect(s).toMatch(/[a-z]/); expect(s).toMatch(/[A-Z]/); expect(s).toMatch(/\d/);
        expect(Buffer.byteLength(s, "utf8")).toBeLessThanOrEqual(72);
        expect(s.length).toBeLessThanOrEqual(128);
      }
    }), { numRuns: 2000 });
  });
  it("and every single-line password that meets the rule IS accepted (no good password is refused)", () => {
    const good = fc.stringMatching(/^[A-Za-z0-9!@#$%^&*_.-]{8,60}$/).filter((s) => /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s));
    fc.assert(fc.property(good, (s) => { expect(PasswordPolicy.safeParse(s).success).toBe(true); }), RUNS);
  });
});

describe("reset tokens", () => {
  it("every generated token has the exact shape, and a string matching the shape is always 43 URL-safe characters", () => {
    fc.assert(fc.property(fc.constant(0), () => { expect(newToken()).toMatch(TOKEN_SHAPE); }), { numRuns: 500 });
    const nearMiss = fc.oneof(anyText, fc.stringMatching(/^[A-Za-z0-9_-]{40,46}\n?$/), fc.stringMatching(/^[A-Za-z0-9_-]{43}$/));
    fc.assert(fc.property(nearMiss, (s) => { if (TOKEN_SHAPE.test(s)) { expect(s).toHaveLength(43); expect(s).toMatch(/^[A-Za-z0-9_-]+$/); } }), { numRuns: 2000 });
  });
  it("hashing is stable, 64 hex characters, and different inputs give different hashes", () => {
    fc.assert(fc.property(anyText, anyText, (a, b) => {
      expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
      expect(hashToken(a)).toBe(hashToken(a));
      if (a !== b) expect(hashToken(a)).not.toBe(hashToken(b));
    }), RUNS);
  });
});

describe("a password change signs older sessions out", () => {
  it("is monotonic: a later sign-in is never rejected when an earlier one was accepted, and no data never locks anyone out", () => {
    const t = fc.integer({ min: 0, max: 4e12 });
    fc.assert(fc.property(t, t, t, (a, b, changed) => {
      const [early, late] = a <= b ? [a, b] : [b, a];
      const user = { passwordChangedAt: new Date(changed) };
      if (!signedInBeforePasswordChange({ iat: early }, user)) expect(signedInBeforePasswordChange({ iat: late }, user)).toBe(false);
      expect(signedInBeforePasswordChange({ iat: early }, null)).toBe(false);
      expect(signedInBeforePasswordChange({}, user)).toBe(false);
    }), RUNS);
  });
});

describe("mail routing", () => {
  const profile = fc.constantFrom(...MAIL_PROFILES);
  const knownKinds = ["order-customer", "order-customer-resend", "order-status-shipped", "order-status-cancel_requested", "order-admin", "admin-cancelled", "admin-return_requested", "support-admin", "support-ack", "welcome", "password-reset", "password-changed", "staff_account_created", "delivery_kyc_submitted", "delivery_kyc_decision"];
  const kind = fc.oneof(fc.constantFrom(...knownKinds), fc.string(), fc.string().map((s) => `order-${s}`));
  const routing = fc.dictionary(fc.constantFrom(...MAIL_CATEGORIES.map((c) => c.id), "bogus"), fc.oneof(profile, fc.string()));
  const usableSet = fc.subarray([...MAIL_PROFILES]).map((a) => new Set<MailProfile>(a));

  it("the mailbox that sends is always one that is set up and switched on — or the email is skipped; never anything else", () => {
    fc.assert(fc.property(kind, routing, usableSet, (k, r, usable) => {
      const pick = pickProfile(k, cleanRouting(r), usable);
      if (pick) { expect(usable.has(pick.profile)).toBe(true); expect(pick.fellBack).toBe(pick.profile !== pick.chosen); }
      else expect(usable.size === 0 || (usable.size === 1 && !usable.has("orders"))).toBe(true);
    }), { numRuns: 1000 });
  });
  it("when the chosen mailbox is usable it is always the one used", () => {
    fc.assert(fc.property(kind, routing, usableSet, (k, r, usable) => {
      const chosen = chosenProfile(k, cleanRouting(r));
      if (usable.has(chosen)) expect(pickProfile(k, cleanRouting(r), usable)?.profile).toBe(chosen);
    }), RUNS);
  });
  it("order emails are never silently moved to the Support mailbox when Orders is unavailable (with default routing)", () => {
    fc.assert(fc.property(fc.constantFrom("order-customer", "order-customer-resend", "order-status-shipped", "order-admin", "admin-cancelled"), (k) => {
      expect(pickProfile(k, {}, new Set<MailProfile>(["support"]))).toBeNull();
    }));
  });
  it("cleaning saved routing is idempotent and only keeps known categories with known mailboxes", () => {
    fc.assert(fc.property(fc.anything(), (raw) => {
      const once = cleanRouting(raw);
      expect(cleanRouting(once)).toEqual(once);
      for (const [cat, prof] of Object.entries(once)) { expect(MAIL_CATEGORIES.some((c) => c.id === cat)).toBe(true); expect(MAIL_PROFILES).toContain(prof); }
    }), RUNS);
  });
  it("categoryOf never throws and the category always owns the kind it was found for", () => {
    fc.assert(fc.property(kind, (k) => { const c = categoryOf(k); if (c) expect(c.match.test(k)).toBe(true); }), RUNS);
  });
});

describe("mail DNS checks", () => {
  it("domainOf: the domain of any well-formed address comes back lower-case; garbage never throws and never returns something with an @ or a space", () => {
    const label = fc.stringMatching(/^[a-z0-9]{1,12}$/);
    fc.assert(fc.property(fc.stringMatching(/^[A-Za-z0-9._%+-]{1,20}$/), fc.array(label, { minLength: 2, maxLength: 4 }), (local, labels) => {
      const dom = labels.join(".");
      expect(domainOf(`${local}@${dom.toUpperCase()}`)).toBe(dom);
    }), RUNS);
    fc.assert(fc.property(anyText, (s) => { const d = domainOf(s); expect(d).not.toMatch(/[@\s]/); if (d) expect(d).toContain("."); }), RUNS);
  });
  it("withInclude: the include is always present afterwards, adding it twice changes nothing, and a closing all stays last", () => {
    const mech = fc.constantFrom("a", "mx", "ip4:203.0.113.5", "include:mailgun.org", "include:spf.brevo.com");
    const record = fc.tuple(fc.array(mech, { maxLength: 4 }), fc.constantFrom("~all", "-all", "?all", "")).map(([m, all]) => ["v=spf1", ...m, all].filter(Boolean).join(" "));
    fc.assert(fc.property(record, (r) => {
      const out = withInclude(r, "_spf.google.com");
      expect(out).toContain("include:_spf.google.com");
      expect(withInclude(out, "_spf.google.com")).toBe(out);
      const all = /([~\-?+]?all)$/.exec(r)?.[1];
      if (all) expect(out.endsWith(all)).toBe(true);
    }), RUNS);
  });
  it("SPF 'ok' is only ever reported for exactly one record that includes the sender", () => {
    const rec = fc.oneof(fc.constant("v=spf1 include:_spf.google.com ~all"), fc.constant("v=spf1 a mx -all"), fc.constant("google-site-verification=abc"), fc.string());
    fc.assert(fc.property(fc.array(rec, { maxLength: 4 }), (records) => {
      const r = analyseSpf(records, "_spf.google.com", "x.com");
      if (r.status === "ok") {
        const spf = records.filter((x) => /^v=spf1(\s|$)/i.test(x.trim()));
        expect(spf).toHaveLength(1);
        expect(spf[0]).toMatch(/include:_spf\.google\.com/i);
      }
    }), RUNS);
  });
  it("DMARC is 'ok' exactly when a v=DMARC1 record exists", () => {
    fc.assert(fc.property(fc.array(fc.oneof(fc.string(), fc.constantFrom("v=DMARC1; p=none", "V=dmarc1; p=reject", "v=DMARC10")), { maxLength: 4 }), (records) => {
      expect(analyseDmarc(records, "x.com", "s@x.com").status === "ok").toBe(records.some((x) => /^v=DMARC1\b/i.test(x.trim())));
    }), RUNS);
  });
});

describe("site address", () => {
  it("is always a clean web address without a trailing slash; in production it is never localhost unless that was configured", () => {
    fc.assert(fc.property(fc.option(anyText, { nil: undefined }), fc.constantFrom("production", "development", "test", undefined), (raw, mode) => {
      const u = siteUrl({ NEXT_PUBLIC_SITE_URL: raw, NODE_ENV: mode });
      expect(u).toMatch(/^https?:\/\/[^\s/]/i);
      expect(u.endsWith("/")).toBe(false);
      if (mode === "production" && !/^https?:\/\/[^\s/?#]+/i.test((raw ?? "").trim())) expect(u).toBe("https://cultraven.com");
    }), { numRuns: 1000 });
  });
});

describe("support contact settings", () => {
  it("the phone and WhatsApp numbers are always 10–15 digits and never an example number, whatever the environment says", () => {
    fc.assert(fc.property(fc.option(anyText, { nil: undefined }), fc.option(anyText, { nil: undefined }), (wa, ph) => {
      const c = supportConfig({ NEXT_PUBLIC_WHATSAPP_NUMBER: wa, NEXT_PUBLIC_SUPPORT_PHONE: ph });
      for (const n of [c.whatsapp, c.phone]) { expect(n).toMatch(/^\d{10,15}$/); expect(["919876543210", "919999999999"]).not.toContain(n); }
      expect(c.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }), { numRuns: 1000 });
  });
  it("an order reference is either rejected or exactly CR- plus six hex characters (nothing can be smuggled into a message)", () => {
    fc.assert(fc.property(fc.option(anyText, { nil: null }), (s) => { const r = cleanOrderNumber(s); if (r !== null) expect(r).toMatch(/^CR-[0-9A-F]{6}$/); }), { numRuns: 1000 });
  });
});

describe("delivery window and India-time dates", () => {
  const when = fc.date({ min: new Date("2020-01-01"), max: new Date("2040-01-01"), noInvalidDate: true });
  it("arrives 3–5 days later, never on a Sunday, and the window never runs backwards", () => {
    fc.assert(fc.property(when, (placed) => {
      const e = estimatedDelivery(placed)!;
      const day = 86_400_000;
      expect(e.from.getTime() - placed.getTime()).toBeGreaterThanOrEqual(3 * day);
      expect(e.from.getTime() - placed.getTime()).toBeLessThanOrEqual(4 * day + 1);
      expect(e.to.getTime()).toBeGreaterThanOrEqual(e.from.getTime());
      expect(e.to.getTime() - e.from.getTime()).toBeLessThanOrEqual(3 * day);
      expect(istDate(e.from)).not.toMatch(/^Sun/);
      expect(istDate(e.to)).not.toMatch(/^Sun/);
    }), RUNS);
  });
  it("any valid moment prints as a full date, any invalid one prints nothing (and nothing throws)", () => {
    fc.assert(fc.property(when, (d) => {
      expect(istDate(d)).toMatch(/^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4}$/);
      expect(istDateTime(d)).toMatch(/^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}:\d{2} (am|pm) IST$/);
    }), RUNS);
    fc.assert(fc.property(anyText, (s) => { const out = istDate(s); expect(out === "" || /^[A-Z][a-z]{2}, /.test(out)).toBe(true); }), RUNS);
  });
});

describe("inline logo", () => {
  it("never throws on any html; the logo link is always replaced, only once, with exactly one attachment", () => {
    fc.assert(fc.property(anyText, anyText, (before, after) => {
      const html = `${before}<img src="https://cultraven.com/email-logo.png" alt="x">${after}`;
      const r = withInlineLogo(html);
      expect(r.html).not.toContain("/email-logo.png");
      expect(r.attachment?.cid).toBe("cultraven-logo");
      expect(withInlineLogo(r.html).attachment).toBeUndefined(); // already inline: nothing more to attach
    }), RUNS);
    fc.assert(fc.property(anyText, (s) => { const r = withInlineLogo(s.replace(/email-logo/g, "x")); expect(r.attachment).toBeUndefined(); expect(r.html).toBe(s.replace(/email-logo/g, "x")); }), RUNS);
  });
});
