import { describe, it, expect } from "vitest";
import { supportConfig, whatsappLink, mailtoLink, contactLink, cleanOrderNumber, searchFaqs, matchSubject, telLink, formatPhone, TOPICS, TOPIC_BY_SLUG, POPULAR } from "./support";

describe("support config + links", () => {
  it("uses env values when valid, safe defaults otherwise", () => {
    expect(supportConfig({ NEXT_PUBLIC_WHATSAPP_NUMBER: "+91 98450 73921", NEXT_PUBLIC_SUPPORT_EMAIL: "help@x.in" } as any)).toMatchObject({ whatsapp: "919845073921", email: "help@x.in" });
    expect(supportConfig({ NEXT_PUBLIC_WHATSAPP_NUMBER: "abc", NEXT_PUBLIC_SUPPORT_EMAIL: "not-an-email" } as any)).toMatchObject({ whatsapp: "919999999999", email: "support@cultraven.com" });
    expect(supportConfig({} as any).hours).toMatch(/IST/);
  });
  it("builds whatsapp / mailto / contact links with encoding", () => {
    const cfg = { whatsapp: "919845073921", email: "s@x.in", hours: "", phone: "" };
    expect(whatsappLink("Hi, order CR-1A2B3C", cfg)).toBe("https://wa.me/919845073921?text=Hi%2C%20order%20CR-1A2B3C");
    expect(mailtoLink("Order help & more", "Line 1\nLine 2", cfg)).toBe("mailto:s@x.in?subject=Order%20help%20%26%20more&body=Line%201%0ALine%202");
    expect(contactLink({ subject: "Return / exchange", order: "CR-1A2B3C" })).toBe("/pages/contact?subject=Return+%2F+exchange&order=CR-1A2B3C");
    expect(contactLink()).toBe("/pages/contact");
  });
  it("caps very long prefilled text", () => {
    expect(decodeURIComponent(whatsappLink("a".repeat(900)).split("text=")[1]).length).toBe(500);
  });
  it("accepts only real-looking order numbers", () => {
    expect(cleanOrderNumber("cr-1a2b3c")).toBe("CR-1A2B3C");
    for (const bad of ["", null, undefined, "CR-12", "<script>", "CR-1A2B3C extra", "XX-1A2B3C"]) expect(cleanOrderNumber(bad as any)).toBeNull();
  });
});

describe("faq content", () => {
  it("every topic has questions and unique slugs; popular questions exist", () => {
    expect(new Set(TOPICS.map((t) => t.slug)).size).toBe(TOPICS.length);
    for (const t of TOPICS) expect(t.faqs.length).toBeGreaterThan(2);
    for (const p of POPULAR) expect(TOPIC_BY_SLUG[p.topic].faqs.some((f) => f.q === p.q)).toBe(true);
  });
  it("answers quote the real policy numbers (7 days, COD limit, shipping)", () => {
    const all = TOPICS.flatMap((t) => t.faqs.map((f) => f.q + " " + f.a)).join(" ");
    expect(all).toContain("7 days");
    expect(all).toContain("₹5,000");
    expect(all).toContain("₹1,999");
    expect(all).not.toContain("30 minutes");
  });
});

describe("faq search", () => {
  it("finds cancellation answers and ranks question matches first", () => {
    const r = searchFaqs("cancel order");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].topic.slug).toBe("cancellation");
  });
  it("requires every word to appear", () => {
    expect(searchFaqs("refund zebra")).toEqual([]);
    expect(searchFaqs("")).toEqual([]);
    expect(searchFaqs("   ")).toEqual([]);
  });
  it("is safe with symbols and regex characters", () => {
    expect(() => searchFaqs(".*(" + "a".repeat(5000))).not.toThrow();
    expect(searchFaqs("refund?").length).toBeGreaterThan(0);
  });
});

describe("matchSubject", () => {
  it("maps topic titles and free text onto the contact subjects", () => {
    expect(matchSubject("Cancel an order")).toBe("Cancel / change an order");
    expect(matchSubject("Returns & exchanges")).toBe("Return / exchange");
    expect(matchSubject("Payments & refunds")).toBe("Payment / refund");
    expect(matchSubject("Orders & delivery")).toBe("Shipping issue");
    expect(matchSubject("Order inquiry")).toBe("Order inquiry");
    expect(matchSubject("Products & sizing")).toBe("Product question");
    expect(matchSubject("Account & profile")).toBe("Account help");
    expect(matchSubject("random <script>")).toBe("");
    expect(matchSubject(null)).toBe("");
  });
});

describe("optional phone line", () => {
  it("is off unless a valid number is configured", () => {
    expect(supportConfig({} as any).phone).toBe("");
    expect(supportConfig({ NEXT_PUBLIC_SUPPORT_PHONE: "12345" } as any).phone).toBe("");
    expect(telLink(supportConfig({} as any))).toBe("");
  });
  it("accepts a number with spaces / plus and builds tel: + display text", () => {
    const cfg = supportConfig({ NEXT_PUBLIC_SUPPORT_PHONE: "+91 98450 73921" } as any);
    expect(cfg.phone).toBe("919845073921");
    expect(telLink(cfg)).toBe("tel:+919845073921");
    expect(formatPhone(cfg.phone)).toBe("+91 98450 73921");
    expect(formatPhone("")).toBe("");
    expect(formatPhone("14155550123")).toBe("+14155550123");
  });
});
