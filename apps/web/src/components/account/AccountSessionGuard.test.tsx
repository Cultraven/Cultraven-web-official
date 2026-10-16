import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountSessionGuard } from "./AccountSessionGuard";

const assign = vi.fn();
const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response);

beforeEach(() => {
  assign.mockReset();
  Object.defineProperty(window, "location", { value: { ...window.location, assign }, writable: true, configurable: true });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const comeBackToTab = () => window.dispatchEvent(new Event("focus"));

describe("AccountSessionGuard", () => {
  it("sends the customer to log in when the tab comes back and the account is gone", async () => {
    vi.stubGlobal("fetch", reply({ signedIn: false }));
    render(<AccountSessionGuard />);
    comeBackToTab();
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/api/auth/expired"));
  });
  it("leaves a signed-in customer alone", async () => {
    const f = reply({ signedIn: true, initial: "J" });
    vi.stubGlobal("fetch", f);
    render(<AccountSessionGuard />);
    comeBackToTab();
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(assign).not.toHaveBeenCalled();
  });
  it("a server error or being offline is not 'signed out'", async () => {
    const bad = reply({}, false);
    vi.stubGlobal("fetch", bad);
    const { unmount } = render(<AccountSessionGuard />);
    comeBackToTab();
    await waitFor(() => expect(bad).toHaveBeenCalled());
    expect(assign).not.toHaveBeenCalled();
    unmount();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(<AccountSessionGuard />);
    comeBackToTab();
    await new Promise((r) => setTimeout(r, 20));
    expect(assign).not.toHaveBeenCalled();
  });
  it("re-checks every two minutes while the page stays open", async () => {
    vi.useFakeTimers();
    const f = reply({ signedIn: false });
    vi.stubGlobal("fetch", f);
    render(<AccountSessionGuard />);
    expect(f).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000 + 50);
    expect(f).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith("/api/auth/expired");
  });
  it("stops checking once the page is closed", async () => {
    vi.useFakeTimers();
    const f = reply({ signedIn: true });
    vi.stubGlobal("fetch", f);
    const { unmount } = render(<AccountSessionGuard />);
    unmount();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    comeBackToTab();
    expect(f).not.toHaveBeenCalled();
  });
});
