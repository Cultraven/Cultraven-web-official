import { describe, it, expect } from "vitest";
import defaults from "./cms/legal-defaults.json";
import { SECTION_MAP, validateFields } from "./cms/registry";
import { parseRichText, parseInline, isSafeHref } from "./rich-text";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE, COD_MAX_LIMIT } from "./constants";

const KEYS = ["page.terms", "page.privacy", "page.shipping", "page.returns"] as const;
const all = (k: string) => JSON.stringify((defaults as any)[k]);

describe("rich text for the policy pages", () => {
  it("makes paragraphs, bullets, bold, italic and links, and never leaves stray ** behind", () => {
    const b = parseRichText("Intro **bold** and *soft*.\n\n- one\n- two [link](/pages/contact)\n\nLast line");
    expect(b.map((x) => x.t)).toEqual(["p", "ul", "p"]);
    const ul: any = b[1];
    expect(ul.items).toHaveLength(2);
    expect(JSON.stringify(b)).not.toMatch(/\*\*/);
    expect(parseInline("**bold**")).toEqual([{ t: "b", v: "bold" }]);
    expect(parseInline("[x](mailto:a@b.co)")).toEqual([{ t: "a", v: "x", href: "mailto:a@b.co" }]);
  });
  it("only allows safe links; anything else is shown as plain text", () => {
    for (const ok of ["/pages/terms", "https://cultraven.com", "mailto:support@cultraven.com", "tel:+918962212605", "#top"]) expect(isSafeHref(ok), ok).toBe(true);
    for (const bad of ["javascript:alert(1)", "//evil.example", "http://insecure.example", "data:text/html,x", "ftp://x"]) expect(isSafeHref(bad), bad).toBe(false);
    expect(parseInline("[click](javascript:alert(1))").some((n) => n.t === "a")).toBe(false);
  });
  it("handles Windows line breaks, empty text and bullets with the • sign", () => {
    expect(parseRichText("")).toEqual([]);
    expect(parseRichText("a\r\n\r\n• b\r\n• c").map((x) => x.t)).toEqual(["p", "ul"]);
  });
});

describe("the built-in policy wording", () => {
  it.each(KEYS)("%s is accepted by the admin form's own validation (so it can be saved and edited as is)", (key) => {
    const { errors } = validateFields(SECTION_MAP[key].fields, (defaults as any)[key]);
    expect(errors).toEqual([]);
  });
  it.each(KEYS)("%s has a title, a Google description and at least 5 sections of real text", (key) => {
    const d: any = (defaults as any)[key];
    expect(d.title.length).toBeGreaterThan(3);
    expect(d.metaDescription.length).toBeGreaterThan(60);
    expect(d.metaDescription.length).toBeLessThanOrEqual(200);
    expect(d.sections.length).toBeGreaterThanOrEqual(5);
    for (const s of d.sections) expect(s.body.length, s.heading).toBeGreaterThan(40);
  });
  it("quotes the same fees and limits as the shop itself", () => {
    const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
    expect(all("page.shipping")).toContain(rupees(FREE_SHIPPING_THRESHOLD));
    expect(all("page.shipping")).toContain(rupees(SHIPPING_FEE));
    expect(all("page.shipping")).toContain(rupees(COD_FEE));
    expect(all("page.shipping")).toContain(rupees(COD_MAX_LIMIT));
    expect(all("page.terms")).toContain(rupees(COD_FEE));
  });
  it("tells one story about returns: 7 days, 15-day exchange, no sale returns, refunds in 5 to 7 days", () => {
    const r = all("page.returns"), t = all("page.terms");
    for (const text of [r, t]) {
      expect(text).toMatch(/7 days/);
      expect(text).toMatch(/15 days/);
      expect(text).toMatch(/5 to 7 business days/);
      expect(text).toMatch(/[Ss]ale and clearance items cannot be returned|SALE or CLEARANCE\*\* cannot be returned|cannot be returned or exchanged/);
    }
  });
  it("has no promises the shop does not keep (express, same-day, SMS) and no mailboxes that do not exist", () => {
    for (const k of KEYS) {
      const text = all(k);
      expect(text, k).not.toMatch(/express|same-day|same day|SMS|6 PM/i);
      for (const m of text.match(/[\w.+-]+@cultraven\.com/g) ?? []) expect(["support@cultraven.com", "orders@cultraven.com"], `${k}: ${m}`).toContain(m);
    }
  });
  it("uses the right business address and court city", () => {
    expect(all("page.terms")).toContain("Indore");
    expect(all("page.terms")).not.toMatch(/Mumbai/);
    expect(all("page.terms")).toContain("23BJHPH4892N1ZQ");
  });
});
