"use client";
/**
 * Checkout — /checkout (whole bag) and /checkout?mode=buy-now (COP IT NOW: one item, bag untouched).
 *
 * Signed-in only (middleware sends visitors to login/register and brings them back here).
 *   1. Address   — pick a saved address (or fix/edit it) or add a new one (optionally saved to the address book)
 *   2. Review    — choose payment (Cash on Delivery now; online when Razorpay keys are added) and confirm
 *
 * Validation is layered: this page runs the same rules as the server (lib/address-validation) inline and blocks Continue /
 * Place Order; the server (create-order zod schema) re-validates everything, re-prices from the catalogue and refuses sold-out
 * items, and answers 503 to online payment until Razorpay is configured. This page only ever displays estimates.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useBuyNowStore } from "@/store/buyNow";
import { validateCoupon } from "@/lib/promotion-service";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE, COD_MAX_LIMIT } from "@/lib/constants";
import { canonicalState, firstAddressError, validateAddress, type AddressValues } from "@/lib/address-validation";
import { AddressFields } from "@/components/address/AddressFields";
import { useAddressDraft, type AddressDraft, type AddressLabel } from "@/components/address/useAddressDraft";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const MAX_SAVED = 10;

interface Addr { id: string; label: string; name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }
const asLabel = (l: string): AddressLabel => (l === "Work" || l === "Other" ? l : "Home");

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-script")) return resolve();
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window"));
    document.head.appendChild(s);
  });
}

export default function CheckoutPage() {
  const router = useRouter();

  // ── What is being bought ──
  const { items: bagItems, couponCode: bagCoupon } = useCartStore();
  const buyNowItem = useBuyNowStore((s) => s.item);
  const [buyNow, setBuyNow] = useState<boolean | null>(null); // null until the URL is read on the client
  useEffect(() => {
    const isBuyNow = new URLSearchParams(window.location.search).get("mode") === "buy-now";
    if (!isBuyNow) useBuyNowStore.getState().clear(); // a stale express item must never leak into a bag checkout
    setBuyNow(isBuyNow);
  }, []);
  const items = buyNow ? (buyNowItem ? [buyNowItem] : []) : bagItems;
  const couponCode = buyNow ? null : bagCoupon;
  useEffect(() => {
    if (buyNow === null) return;
    if (items.length === 0) router.replace(buyNow ? "/collections/all" : "/cart");
  }, [buyNow, items.length, router]);

  // ── Account, addresses, payment options ──
  const [me, setMe] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [addresses, setAddresses] = useState<Addr[] | null>(null);
  const [online, setOnline] = useState(false);
  useEffect(() => {
    const ac = new AbortController();
    const get = (u: string) => fetch(u, { cache: "no-store", signal: ac.signal }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    get("/api/account/me").then((d) => setMe(d?.me ?? { email: "", firstName: "", lastName: "" }));
    get("/api/account/addresses").then((d) => setAddresses(d?.addresses ?? []));
    get("/api/payments/config").then((d) => setOnline(!!d?.online));
    return () => ac.abort();
  }, []);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveToBook, setSaveToBook] = useState(true);
  const [summary, setSummary] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const idemKey = useRef<string>("");
  const placed = useRef(false);
  const inflight = useRef(false); // synchronous guard: two clicks in one tick can't both pass `placing`
  const savedKey = useRef("");
  const stash = useRef<AddressDraft | null>(null); // a half-typed new address survives a detour to "Edit"

  const form = useAddressDraft();
  const fullName = me ? [me.firstName, me.lastName].filter(Boolean).join(" ") : "";

  /** Every saved address is re-checked against today's rules: old data that fails is flagged and can't be shipped to until fixed. */
  const savedCheck = useMemo(() => {
    const m = new Map<string, ReturnType<typeof validateAddress>>();
    for (const a of addresses ?? []) m.set(a.id, validateAddress(a));
    return m;
  }, [addresses]);

  // Preselect the default saved address (first one that is valid); prefill the new-address form with the account name.
  const prefilled = useRef(false);
  useEffect(() => {
    if (addresses === null || me === null || prefilled.current) return;
    prefilled.current = true;
    const ordered = [...addresses.filter((a) => a.isDefault), ...addresses.filter((a) => !a.isDefault)];
    const firstValid = ordered.find((a) => validateAddress(a).ok);
    if (firstValid) setSelectedId(firstValid.id);
    if (fullName) form.setField("name", fullName);
  }, [addresses, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosen: Addr | null = selectedId === "new" ? null : addresses?.find((a) => a.id === selectedId) ?? null;
  const showForm = selectedId === "new" || editingId !== null;

  /** The validated, normalised address that will be shipped to — null until it passes every rule. */
  const newCheck = useMemo(() => validateAddress(form.draft), [form.draft]);
  const shipTo: AddressValues | null = useMemo(() => {
    if (selectedId === "new") return newCheck.ok ? newCheck.value : null;
    if (editingId) return null;
    const c = chosen ? savedCheck.get(chosen.id) : null;
    return c?.ok ? c.value : null;
  }, [selectedId, editingId, newCheck, chosen, savedCheck]);

  useEffect(() => { if (step === 2 && !shipTo) setStep(1); }, [step, shipTo]);

  // ── Totals (display only — the server recomputes) ──
  const t = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
    const promo = validateCoupon(couponCode, subtotal);
    const discount = promo.isValid ? promo.discountPaise : 0;
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const cod = method === "cod" ? COD_FEE : 0;
    return { subtotal, discount, shipping, cod, total: subtotal - discount + shipping + cod };
  }, [items, couponCode, method]);
  const codAllowed = t.subtotal - t.discount + t.shipping + COD_FEE <= COD_MAX_LIMIT;
  useEffect(() => { if (!codAllowed && method === "cod" && online) setMethod("razorpay"); }, [codAllowed, method, online]);
  useEffect(() => { if (!online && method === "razorpay") setMethod("cod"); }, [online, method]); // online can't be chosen while Razorpay isn't configured

  // ── Address step ──
  const pickSaved = (id: string) => {
    if (editingId) { setEditingId(null); form.reset(stash.current ?? { name: fullName }); }
    setSelectedId(id); setSummary("");
  };
  const pickNew = () => {
    if (editingId) { setEditingId(null); form.reset(stash.current ?? { name: fullName }); }
    setSelectedId("new"); setSummary("");
  };
  const openEdit = (a: Addr) => {
    if (selectedId === "new" && !editingId) stash.current = { ...form.draft };
    setEditingId(a.id); setSelectedId(a.id); setSummary("");
    form.reset({ label: asLabel(a.label), name: a.name, phone: a.phone, pincode: a.pincode, city: a.city, state: canonicalState(a.state, a.pincode) ?? "", line1: a.line1, line2: a.line2 });
    form.showAllErrors();
    requestAnimationFrame(() => document.getElementById("co-name")?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };
  const cancelEdit = () => {
    setEditingId(null); setSummary("");
    form.reset(stash.current ?? { name: fullName });
    const ordered = [...(addresses ?? []).filter((a) => a.isDefault), ...(addresses ?? []).filter((a) => !a.isDefault)];
    const firstValid = ordered.find((a) => validateAddress(a).ok);
    setSelectedId(firstValid?.id ?? "new");
  };

  const saveEdit = async () => {
    const a = addresses?.find((x) => x.id === editingId);
    if (!a || savingEdit) return;
    const r = form.validateAll();
    if (!r.ok) { setSummary(`Please fix ${Object.keys(r.errors).length === 1 ? "the highlighted field" : "the highlighted fields"} to continue.`); return; }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/account/addresses/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: form.draft.label, name: r.value.name, phone: r.value.phone, pincode: r.value.pincode, city: r.value.city, state: r.value.state, line1: r.value.line1, line2: r.value.line2, isDefault: a.isDefault }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        form.setServerErrors(data.issues);
        setSummary(typeof data.error === "string" ? data.error : "Could not save the address. Please try again.");
        return;
      }
      const updated = data.address as Addr;
      setAddresses((list) => (list ?? []).map((x) => (x.id === updated.id ? updated : x)));
      setEditingId(null); setSelectedId(updated.id); setSummary("");
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSummary("Network error — your changes were not saved. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const continueToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSummary("");
    if (editingId) { void saveEdit(); return; }
    if (selectedId === "new") {
      const r = form.validateAll();
      if (!r.ok) { setSummary(`Please fix ${Object.keys(r.errors).length === 1 ? "the highlighted field" : "the highlighted fields"} to continue.`); return; }
    } else {
      if (!chosen) { setSummary("Choose a delivery address or add a new one."); return; }
      const c = savedCheck.get(chosen.id);
      if (!c || !c.ok) { setSummary(`This saved address needs fixing${c && !c.ok ? ` (${firstAddressError(c.errors)})` : ""}. Tap Edit to correct it.`); return; }
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Place order ──
  const ready = buyNow !== null && items.length > 0 && me !== null && addresses !== null;
  const blocker = useMemo(() => {
    if (!ready) return "Still loading — one moment.";
    if (items.length === 0 || items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) return "Your bag is empty — add something before checking out.";
    if (!shipTo) return "Add a valid delivery address first.";
    if (!me?.email) return "We couldn't load your account details. Please refresh the page.";
    if (method === "razorpay" && !online) return "Online payment isn't available yet — please choose Cash on Delivery.";
    if (method === "cod" && !codAllowed) return online ? "Cash on Delivery isn't available for this order value — please pay online." : `Cash on Delivery isn't available above ${fmt(COD_MAX_LIMIT)}, and online payment isn't available yet.`;
    return "";
  }, [ready, items, shipTo, me, method, online, codAllowed]);

  const placeOrder = async () => {
    if (inflight.current || placed.current) return;
    if (blocker || !shipTo) { setError(blocker || "Add a valid delivery address first."); return; }
    inflight.current = true;
    setPlacing(true);
    setError("");
    if (!idemKey.current) idemKey.current = crypto.randomUUID();
    const done = () => { inflight.current = false; setPlacing(false); };
    try {
      // Save a new address to the book first (best-effort — never blocks the order; never duplicated on retry).
      const key = JSON.stringify(shipTo);
      if (selectedId === "new" && saveToBook && savedKey.current !== key && (addresses?.length ?? 0) < MAX_SAVED) {
        savedKey.current = key;
        fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: form.draft.label, name: shipTo.name, line1: shipTo.line1, line2: shipTo.line2, city: shipTo.city, state: shipTo.state, pincode: shipTo.pincode, phone: shipTo.phone, isDefault: (addresses?.length ?? 0) === 0 }) }).catch(() => {});
      }
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity, size: i.size || "Free Size", color: i.color || "Default" })),
          name: shipTo.name,
          email: me?.email ?? "",
          phone: shipTo.phone,
          address: { line1: shipTo.line1, line2: shipTo.line2, city: shipTo.city, state: shipTo.state, pincode: shipTo.pincode },
          paymentMethod: method,
          couponCode: couponCode || undefined,
          idempotencyKey: idemKey.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Could not place your order. Please try again.";
        // The server's address/contact rules rejected it: go back to the form with the reason (it's authoritative).
        if (res.status === 422 && data.issues && Object.keys(data.issues).some((k) => /^(name|phone|address)/.test(k))) {
          done();
          setStep(1);
          if (selectedId === "new" || editingId) form.setServerErrors(data.issues);
          setSummary(selectedId === "new" ? msg : `${msg} Tap Edit on the address to fix it.`);
          return;
        }
        throw new Error(msg);
      }

      if (method === "cod") {
        placed.current = true; // stay "in flight" — the page navigates away
        router.replace(`/order-success?orderId=${data.orderId}`);
        return;
      }

      await loadRazorpayScript();
      const rz = new (window as any).Razorpay({
        key: data.keyId, amount: data.amount, currency: data.currency, name: "CULTRAVEN", description: "Order payment", order_id: data.orderId,
        prefill: { name: shipTo.name, email: me?.email, contact: shipTo.phone },
        theme: { color: "#172554" },
        handler: async (r: any) => {
          try {
            const v = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ razorpay_order_id: r.razorpay_order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature }) });
            if (!v.ok) throw new Error("We couldn't verify your payment. If money was deducted it will be refunded or the order confirmed shortly.");
            placed.current = true;
            router.replace(`/order-success?orderId=${data.dbOrderId}`);
          } catch (e: any) { setError(e.message); done(); }
        },
        modal: { ondismiss: () => { done(); setError("Payment cancelled. You can try again."); } },
      });
      rz.open();
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      done();
    }
  };

  return (
    <div className="co">
      <header className="co-top">
        <Link href="/" className="co-brand">CULTRAVEN</Link>
        <span className="co-secure">{buyNow ? "COP IT NOW · EXPRESS CHECKOUT" : "SECURE CHECKOUT"}</span>
      </header>

      <div className="co-layout checkout-layout">
        <main className="co-main">
          <ol className="co-steps" aria-label="Checkout steps">
            <li className={step === 1 ? "on" : "done"}><span>1</span> Address</li>
            <li className={step === 2 ? "on" : ""}><span>2</span> Review &amp; pay</li>
          </ol>

          {!ready ? (
            <div className="co-card"><div className="skel" style={{ height: 120 }} /></div>
          ) : step === 1 ? (
            <form onSubmit={continueToReview} noValidate>
              <h1 className="co-h">Where should we deliver?</h1>
              <p className="co-sub">Signed in as <b>{me?.email}</b></p>

              {addresses!.length > 0 ? (
                <div className="co-addrs" role="radiogroup" aria-label="Saved addresses">
                  {addresses!.map((a) => {
                    const chk = savedCheck.get(a.id);
                    const bad = !!chk && !chk.ok;
                    return (
                      <div key={a.id} className={`co-addr ${selectedId === a.id && !editingId ? "on" : ""} ${bad ? "af-bad" : ""} ${editingId === a.id ? "af-editing" : ""}`}>
                        <label className="af-addr-pick">
                          <input type="radio" name="addr" checked={selectedId === a.id} disabled={bad} onChange={() => pickSaved(a.id)} />
                          <div>
                            <b>{a.name} <em>{a.label}</em>{a.isDefault ? <em className="def">Default</em> : null}</b>
                            <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}</p>
                            <small>Phone: {a.phone}</small>
                            {bad && chk && !chk.ok ? <small className="af-bad-msg">Needs fixing: {firstAddressError(chk.errors)}</small> : null}
                          </div>
                        </label>
                        <button type="button" className={`co-link af-edit ${bad ? "is-fix" : ""}`} onClick={() => openEdit(a)} aria-label={`${bad ? "Fix" : "Edit"} address for ${a.name}`}>{bad ? "Fix" : "Edit"}</button>
                      </div>
                    );
                  })}
                  <label className={`co-addr ${selectedId === "new" ? "on" : ""}`}>
                    <input type="radio" name="addr" checked={selectedId === "new"} onChange={pickNew} />
                    <div><b>+ Add a new address</b></div>
                  </label>
                </div>
              ) : null}

              {showForm ? (
                <div className="co-card">
                  {editingId ? <div className="co-row"><h2>Edit address</h2><button type="button" className="co-link" onClick={cancelEdit}>Cancel</button></div> : null}
                  <AddressFields f={form} idPrefix="co" disabled={savingEdit} />
                  {selectedId === "new" && !editingId ? (
                    (addresses?.length ?? 0) >= MAX_SAVED ? (
                      <p className="co-fine">Your address book is full ({MAX_SAVED} saved) — this address will be used for this order only.</p>
                    ) : (
                      <label className="co-check"><input type="checkbox" checked={saveToBook} onChange={(e) => setSaveToBook(e.target.checked)} /> Save this address to my account</label>
                    )
                  ) : null}
                </div>
              ) : null}

              {summary ? <p role="alert" className="af-summary" style={{ marginBottom: "1rem" }}>{summary}</p> : null}

              <button type="submit" className="cv-btn cv-btn-navy co-cta" disabled={savingEdit}>
                {editingId ? (savingEdit ? "SAVING…" : "Save & deliver to this address") : "Deliver to this address"}
              </button>
            </form>
          ) : (
            <div>
              <h1 className="co-h">Review &amp; place your order</h1>

              {shipTo ? (
                <section className="co-card">
                  <div className="co-row"><h2>Delivering to</h2><button type="button" className="co-link" onClick={() => setStep(1)} disabled={placing}>Change</button></div>
                  <p className="co-addr-txt"><b>{shipTo.name}</b><br />{shipTo.line1}{shipTo.line2 ? `, ${shipTo.line2}` : ""}<br />{shipTo.city}, {shipTo.state} {shipTo.pincode}<br />Phone: {shipTo.phone}</p>
                  <p className="co-sub" style={{ margin: 0 }}>Order updates go to <b>{me?.email}</b></p>
                </section>
              ) : null}

              <section className="co-card">
                <h2>Payment</h2>
                <div className="co-pay" role="radiogroup" aria-label="Payment method">
                  <label className={`co-addr ${method === "cod" ? "on" : ""} ${!codAllowed ? "off" : ""}`}>
                    <input type="radio" name="pay" checked={method === "cod"} disabled={!codAllowed || placing} onChange={() => setMethod("cod")} />
                    <div><b>Cash on Delivery</b><p>{codAllowed ? `Pay in cash when your order arrives. ${fmt(COD_FEE)} handling fee.` : `Not available above ${fmt(COD_MAX_LIMIT)}.`}</p></div>
                  </label>
                  <label className={`co-addr ${method === "razorpay" ? "on" : ""} ${!online ? "off" : ""}`}>
                    <input type="radio" name="pay" checked={method === "razorpay"} disabled={!online || placing} onChange={() => setMethod("razorpay")} />
                    <div><b>UPI / Cards / Netbanking {!online ? <em>Coming soon</em> : null}</b><p>Secure online payment via Razorpay.</p></div>
                  </label>
                </div>
              </section>

              {error ? <p role="alert" className="co-error">{error}</p> : null}
              {blocker && !placing ? <p role="status" className="co-fine" style={{ marginBottom: "0.5rem" }}>{blocker}</p> : null}

              <button type="button" onClick={placeOrder} disabled={placing || !!blocker} className="cv-btn cv-btn-navy co-cta" id="checkout-place-order-btn">
                {placing ? "PLACING YOUR ORDER…" : method === "cod" ? `PLACE ORDER · PAY ${fmt(t.total)} ON DELIVERY` : `PAY ${fmt(t.total)}`}
              </button>
              <p className="co-fine">By placing your order you agree to our <Link href="/pages/terms">Terms</Link> and <Link href="/pages/returns">7-day return policy</Link>.</p>
            </div>
          )}
        </main>

        <aside className="co-side">
          <h2 className="co-side-h">Order summary</h2>
          <div className="co-items">
            {items.map((item) => (
              <div key={item.sku} className="co-item">
                <div className="co-thumb"><Image src={item.image} alt="" fill sizes="64px" style={{ objectFit: "cover" }} /><span>{item.quantity}</span></div>
                <div><b>{item.title}</b><small>{[item.size, item.color].filter(Boolean).join(" · ")}</small></div>
                <b>{fmt(item.pricePaise * item.quantity)}</b>
              </div>
            ))}
          </div>
          <dl className="co-tot">
            <div><dt>Subtotal</dt><dd>{fmt(t.subtotal)}</dd></div>
            {t.discount > 0 ? <div><dt>Discount ({couponCode})</dt><dd>−{fmt(t.discount)}</dd></div> : null}
            <div><dt>Shipping</dt><dd>{t.shipping === 0 ? "FREE" : fmt(t.shipping)}</dd></div>
            {t.cod > 0 ? <div><dt>COD fee</dt><dd>{fmt(t.cod)}</dd></div> : null}
            <div className="grand"><dt>Total</dt><dd>{fmt(t.total)}</dd></div>
          </dl>
          <p className="co-fine" style={{ textAlign: "right" }}>Inclusive of all taxes</p>
        </aside>
      </div>
    </div>
  );
}
