import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactCards, OrderHelp, ORDER_ISSUES } from "./HelpParts";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={typeof href === "string" ? href : String(href)} {...rest}>{children}</a> }));

const order = { id: "6abfd92ecceeeac697798644", number: "CR-798644", status: "processing", canCancel: { ok: true, mode: "direct" }, canReturn: { ok: false } };

function mockFetch(ok: boolean, body: unknown = { order }) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, status: ok ? 200 : 401, json: async () => body })));
}
beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("ContactCards", () => {
  it("shows WhatsApp, email, contact form and FAQs with the order number pre-filled", () => {
    render(<ContactCards orderNumber="CR-1A2B3C" subject="Return / exchange" />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.startsWith("https://wa.me/") && h.includes("CR-1A2B3C"))).toBe(true);
    expect(hrefs.some((h) => h.startsWith("mailto:") && h.includes("CR-1A2B3C"))).toBe(true);
    expect(hrefs).toContain("/pages/contact?subject=Return+%2F+exchange&order=CR-1A2B3C");
    expect(hrefs).toContain("/help/faq");
    expect(screen.queryByText("Call us")).toBeNull(); // no phone configured -> no Call us card
  });
  it("adds a Call us card when a support phone is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_PHONE", "919845073921");
    render(<ContactCards />);
    expect(screen.getByText("Call us")).toBeTruthy();
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "tel:+919845073921")).toBe(true);
  });
  it("uses a custom WhatsApp message when given", () => {
    render(<ContactCards waMessage="Hi CULTRAVEN, my item arrived damaged (order CR-798644)." />);
    const wa = screen.getAllByRole("link").find((a) => (a.getAttribute("href") ?? "").startsWith("https://wa.me/"))!;
    expect(decodeURIComponent(wa.getAttribute("href")!)).toContain("my item arrived damaged (order CR-798644)");
  });
});

describe("OrderHelp", () => {
  it("shows the order, its status and direct actions", async () => {
    mockFetch(true);
    render(<OrderHelp orderId={order.id} orderNumber={order.number} />);
    await screen.findByText(/Help with order CR-798644/);
    expect(screen.getByText("Order placed")).toBeTruthy();
    expect(screen.getByText("Track order").getAttribute("href")).toBe(`/account/orders/${order.id}`);
    expect(screen.getByText("Cancel order").getAttribute("href")).toBe(`/account/orders/${order.id}?action=cancel`);
    expect(screen.queryByText("Return / exchange")).toBeNull(); // not eligible yet
    expect(screen.getByText("Download receipt").getAttribute("href")).toBe(`/api/orders/${order.id}/invoice`);
  });

  it("asks the customer view of the order (works when also signed in as admin)", async () => {
    mockFetch(true);
    render(<OrderHelp orderId={order.id} orderNumber={order.number} />);
    await screen.findByText(/Help with order/);
    expect((fetch as any).mock.calls[0][0]).toBe(`/api/orders/${order.id}?view=customer`);
  });

  it("clicking an issue reveals ALL contact options with that issue pre-filled; clicking again hides them", async () => {
    mockFetch(true);
    render(<OrderHelp orderId={order.id} orderNumber={order.number} />);
    await screen.findByText(/Help with order/);
    expect(screen.queryByRole("region", { name: /Contact options/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Damaged / wrong item" }));
    const panel = screen.getByRole("region", { name: "Contact options for Damaged / wrong item" });
    expect(panel).toBeTruthy();
    const hrefs = Array.from(panel.querySelectorAll("a")).map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.startsWith("https://wa.me/") && decodeURIComponent(h).includes("my item arrived damaged / wrong (order CR-798644)"))).toBe(true);
    expect(hrefs.some((h) => h.startsWith("mailto:"))).toBe(true);
    expect(hrefs.some((h) => h.startsWith("/pages/contact?") && h.includes("order=CR-798644") && h.includes("subject=Return"))).toBe(true);
    expect(hrefs).toContain("/help/faq");
    expect(screen.getByRole("button", { name: "Damaged / wrong item" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Damaged / wrong item" }));
    expect(screen.queryByRole("region", { name: /Contact options/ })).toBeNull();
  });

  it("every issue button opens the panel, and the close (×) button hides it", async () => {
    mockFetch(true);
    render(<OrderHelp orderId={order.id} orderNumber={order.number} />);
    await screen.findByText(/Help with order/);
    for (const i of ORDER_ISSUES) {
      fireEvent.click(screen.getByRole("button", { name: i.label }));
      expect(screen.getByRole("region", { name: `Contact options for ${i.label}` })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("button", { name: "Close contact options" }));
    expect(screen.queryByRole("region", { name: /Contact options/ })).toBeNull();
  });

  it("switching issues swaps the panel (only one open at a time)", async () => {
    mockFetch(true);
    render(<OrderHelp orderId={order.id} orderNumber={order.number} />);
    await screen.findByText(/Help with order/);
    fireEvent.click(screen.getByRole("button", { name: "Payment / refund" }));
    fireEvent.click(screen.getByRole("button", { name: "Other issue" }));
    expect(screen.getAllByRole("region", { name: /Contact options/ })).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Contact options for Other issue" })).toBeTruthy();
  });

  it("when signed out it offers Sign in and WhatsApp instead of order details", async () => {
    mockFetch(false, { error: "Unauthorized" });
    render(<OrderHelp orderId={order.id} orderNumber={order.number} />);
    await waitFor(() => expect(screen.getByText("Sign in")).toBeTruthy());
    expect(screen.getByText("Sign in").getAttribute("href")).toContain("/login?redirect=");
    expect(screen.getByText("WhatsApp us")).toBeTruthy();
    expect(screen.queryByText("Track order")).toBeNull();
  });
});
