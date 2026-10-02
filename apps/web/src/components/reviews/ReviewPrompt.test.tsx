import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let path = "/";
let signedIn = true;
vi.mock("next/navigation", () => ({ usePathname: () => path }));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));
vi.mock("@/components/account/useAccountSession", () => ({ useAccountSession: () => ({ loaded: true, signedIn, initial: "J", name: "J", avatar: null }) }));

import { ReviewPrompt } from "./ReviewPrompt";

const item = (id: string, title: string) => ({ productId: id, slug: `slug-${id}`, title, image: "/x.jpg", orderNumber: "CR-ABC123", size: "M" });

let calls: { url: string; init?: any }[] = [];
function mockApi(pending: any[], review: { ok: boolean; status?: number; body?: any } = { ok: true }) {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: any) => {
    calls.push({ url, init });
    if (String(url).startsWith("/api/reviews/pending")) return { ok: true, status: 200, json: async () => ({ items: pending }) };
    if (String(url) === "/api/reviews") return { ok: review.ok, status: review.status ?? (review.ok ? 201 : 500), json: async () => review.body ?? {} };
    return { ok: false, status: 404, json: async () => ({}) };
  }));
}
const showPrompt = async () => { await act(async () => { vi.advanceTimersByTime(2400); }); };
/** Wait for the pending-reviews request to finish, then for the short "settle" delay before the card slides in. */
const openPrompt = async () => {
  await waitFor(() => expect(calls.length).toBeGreaterThan(0));
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  await showPrompt();
  return screen.findByTestId("review-prompt");
};

beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); localStorage.clear(); sessionStorage.clear(); path = "/"; signedIn = true; });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("ReviewPrompt", () => {
  it("asks about a delivered item a couple of seconds after the site opens", async () => {
    mockApi([item("p1", "Raven Cargo")]);
    render(<ReviewPrompt />);
    expect(screen.queryByTestId("review-prompt")).toBeNull();
    await waitFor(() => expect(calls.length).toBe(1));
    await showPrompt();
    expect(await screen.findByText("How was your Raven Cargo?")).toBeTruthy();
    expect(screen.getByText(/order CR-ABC123/)).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("does nothing for visitors who aren't signed in (no request at all)", async () => {
    signedIn = false;
    mockApi([item("p1", "Raven Cargo")]);
    render(<ReviewPrompt />);
    await showPrompt();
    expect(calls).toHaveLength(0);
    expect(screen.queryByTestId("review-prompt")).toBeNull();
  });

  it("stays away from checkout, sign-in and admin pages", async () => {
    for (const p of ["/checkout", "/login", "/portal-secure/orders"]) {
      path = p; calls = []; mockApi([item("p1", "Raven Cargo")]);
      const { unmount } = render(<ReviewPrompt />);
      await showPrompt();
      expect(calls).toHaveLength(0);
      unmount();
    }
  });

  it("stays quiet when nothing is waiting", async () => {
    mockApi([]);
    render(<ReviewPrompt />);
    await waitFor(() => expect(calls.length).toBe(1));
    await showPrompt();
    expect(screen.queryByTestId("review-prompt")).toBeNull();
  });

  it("needs a star rating and at least 10 characters before posting", async () => {
    mockApi([item("p1", "Raven Cargo")]);
    render(<ReviewPrompt />);
    await openPrompt();
    fireEvent.click(screen.getByRole("button", { name: "Post review" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/star/i);
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.change(screen.getByLabelText("Your feedback"), { target: { value: "too short" } });
    fireEvent.click(screen.getByRole("button", { name: "Post review" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/10 characters/);
    expect(calls.filter((c) => c.url === "/api/reviews")).toHaveLength(0);
  });

  it("posts the rating + feedback for that product, thanks the customer, then asks about the next item", async () => {
    mockApi([item("p1", "Raven Cargo"), item("p2", "Dharma Hoodie")]);
    render(<ReviewPrompt />);
    await openPrompt(); await screen.findByText("How was your Raven Cargo?");
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText("Review title (optional)"), { target: { value: "Fire" } });
    fireEvent.change(screen.getByLabelText("Your feedback"), { target: { value: "Heavy cotton and a great oversized fit." } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Post review" })); });
    const post = calls.find((c) => c.url === "/api/reviews")!;
    expect(JSON.parse(post.init.body)).toEqual({ slug: "slug-p1", rating: 5, title: "Fire", comment: "Heavy cotton and a great oversized fit." });
    expect(await screen.findByText("Thank you!")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("cv-review-dismissed")!)["p1"]).toBeGreaterThan(Date.now()); // never asked about it again
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(await screen.findByText("How was your Dharma Hoodie?")).toBeTruthy();
  });

  it("'Maybe later' closes it and remembers, so a new visit doesn't nag", async () => {
    mockApi([item("p1", "Raven Cargo")]);
    const { unmount } = render(<ReviewPrompt />);
    await openPrompt();
    fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(screen.queryByTestId("review-prompt")).toBeNull();
    unmount();
    sessionStorage.clear(); // a brand-new visit
    mockApi([item("p1", "Raven Cargo")]);
    render(<ReviewPrompt />);
    await waitFor(() => expect(calls.length).toBe(1));
    await showPrompt();
    expect(screen.queryByTestId("review-prompt")).toBeNull();
  });

  it("appears at most once per browser session", async () => {
    mockApi([item("p1", "Raven Cargo")]);
    const first = render(<ReviewPrompt />);
    await openPrompt();
    first.unmount();
    mockApi([item("p1", "Raven Cargo")]);
    render(<ReviewPrompt />);
    await showPrompt();
    expect(calls).toHaveLength(0);
  });

  it("Escape closes it (ask later)", async () => {
    mockApi([item("p1", "Raven Cargo")]);
    render(<ReviewPrompt />);
    await openPrompt();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("review-prompt")).toBeNull();
  });

  it("shows the server's message when saving fails and lets the customer retry", async () => {
    mockApi([item("p1", "Raven Cargo")], { ok: false, status: 403, body: { error: "Only customers who bought this product can review it" } });
    render(<ReviewPrompt />);
    await openPrompt();
    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    fireEvent.change(screen.getByLabelText("Your feedback"), { target: { value: "Decent quality for the price." } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Post review" })); });
    expect((await screen.findByRole("alert")).textContent).toMatch(/Only customers who bought/);
    expect(screen.getByRole("button", { name: "Post review" })).toBeTruthy();
  });

  it("treats 'already reviewed' (409) as done instead of an error", async () => {
    mockApi([item("p1", "Raven Cargo")], { ok: false, status: 409, body: { error: "You have already reviewed this product" } });
    render(<ReviewPrompt />);
    await openPrompt();
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText("Your feedback"), { target: { value: "Loved it, great fabric." } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Post review" })); });
    expect(await screen.findByText("Thank you!")).toBeTruthy();
  });
});
