import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));

import { PolicyPage } from "./PolicyPage";
import defaults from "@/lib/cms/legal-defaults.json";

afterEach(() => cleanup());

describe("PolicyPage", () => {
  it("shows the title, the update date, numbered sections and a table of contents that links to each one", () => {
    const { container } = render(<PolicyPage data={(defaults as any)["page.terms"]} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Terms & Conditions");
    expect(screen.getByText(/Last updated/)).toBeTruthy();
    const heads = [...container.querySelectorAll(".lg-sec h2")].map((h) => h.textContent);
    expect(heads[0]).toBe("1. Who we are");
    expect(heads.length).toBeGreaterThanOrEqual(10);
    const toc = [...container.querySelectorAll(".lg-toc a")].map((a) => a.getAttribute("href"));
    expect(toc[0]).toBe("#sec-1");
    expect(container.querySelector("#sec-3")).not.toBeNull();
  });
  it("renders formatting as real bold text and bullet lists, with no stray asterisks", () => {
    const { container } = render(<PolicyPage data={(defaults as any)["page.privacy"]} />);
    expect(container.querySelectorAll(".lg-rt ul li").length).toBeGreaterThan(10);
    expect(container.querySelectorAll(".lg-rt strong").length).toBeGreaterThan(5);
    expect(container.textContent).not.toMatch(/\*\*/);
  });
  it("keeps contact links working: email, phone and on-site pages", () => {
    const { container } = render(<PolicyPage data={(defaults as any)["page.terms"]} />);
    const hrefs = [...container.querySelectorAll(".lg-rt a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("mailto:support@cultraven.com");
    expect(hrefs).toContain("tel:+918962212605");
    expect(hrefs).toContain("/pages/shipping");
  });
  it("hides a section the admin switched off, and shows the steps, do/don't lists and highlights of the returns page", () => {
    const d: any = structuredClone((defaults as any)["page.returns"]);
    d.sections[0].active = false;
    const { container } = render(<PolicyPage data={d} />);
    expect(container.textContent).not.toContain(d.sections[0].heading + "Refunds");
    expect([...container.querySelectorAll(".lg-sec h2")].map((h) => h.textContent)).not.toContain(d.sections[0].heading);
    expect(container.querySelectorAll(".lg-step").length).toBe(4);
    expect(container.querySelectorAll(".lg-col").length).toBe(2);
    expect(container.querySelector('.lg-col[data-tone="bad"] li')?.textContent).toMatch(/worn|washed/i);
    expect(container.querySelectorAll(".lg-hl").length).toBe(3);
  });
  it("does not render an unsafe contact link", () => {
    const d: any = structuredClone((defaults as any)["page.shipping"]);
    d.contactHref = "javascript:alert(1)";
    const { container } = render(<PolicyPage data={d} />);
    expect(container.querySelector(".lg-contact a")).toBeNull();
  });
  it("a page with only one section has no table of contents and still reads full width", () => {
    const { container } = render(<PolicyPage data={{ title: "Short", sections: [{ heading: "Only", body: "Just this." }] }} />);
    expect(container.querySelector(".lg-toc")).toBeNull();
    expect(container.querySelector(".lg-doc-solo")).not.toBeNull();
  });
});
