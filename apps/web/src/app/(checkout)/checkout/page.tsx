"use client";
/**
 * Checkout — /checkout (whole bag) and /checkout?mode=buy-now (COP IT NOW: one item, bag untouched).
 *
 * Signed-in only (middleware sends visitors to login/register and brings them back here).
 *   1. Address   — pick a saved address or add a new one (optionally saved to the address book)
 *   2. Review    — choose payment (Cash on Delivery now; online when Razorpay keys are added) and confirm
 * The server re-prices everything from the catalogue and refuses sold-out items; this page only displays estimates.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useBuyNowStore } from "@/store/buyNow";
import { validateCoupon } from "@/lib/promotion-service";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE, COD_MAX_LIMIT } from "@/lib/constants";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"];

interface Addr { id: string; label: string; name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }
interface Draft { label: "Home" | "Work" | "Other"; name: string; phone: string; pincode: string; line1: string; line2: string; city: string; state: string; save: boolean }
const EMPTY: Draft = { label: "Home", name: "", phone: "", pincode: "", line1: "", line2: "", city: "", state: "", save: true };

function validate(d: Draft): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.name.trim().length < 2) e.name = "Enter the receiver's name";
  if (!/^[6-9]\d{9}$/.test(d.phone)) e.phone = "Enter a valid 10-digit mobile number";
  if (!/^[1-9]\d{5}$/.test(d.pincode)) e.pincode = "Enter a 6-digit pincode";
  if (d.line1.trim().length < 5) e.line1 = "Enter house no., building and street";
  if (d.city.trim().length < 2) e.city = "Required";
  if (!d.state) e.state = "Select a state";
  return e;
}

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
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const idemKey = useRef<string>("");
  const placed = useRef(false);

  // Preselect the default saved address; prefill the new-address form with the account name.
  useEffect(() => {
    if (addresses === null || me === null) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    setSelectedId((cur) => (cur === "new" && def ? def.id : cur));
    setDraft((d) => (d.name ? d : { ...d, name: [me.firstName, me.lastName].filter(Boolean).join(" ") }));
  }, [addresses, me]);

  const chosen: Addr | null = selectedId === "new" ? null : addresses?.find((a) => a.id === selectedId) ?? null;

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

  const setD = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft((d) => ({ ...d, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const onPincode = async (v: string) => {
    const pin = v.replace(/\D/g, "").slice(0, 6);
    setD("pincode", pin);
    if (/^[1-9]\d{5}$/.test(pin)) {
      try {
        const r = await fetch(`/api/pincode/${pin}`);
        const j = await r.json();
        if (j.city && j.state) setDraft((d) => (d.pincode === pin ? { ...d, city: d.city || j.city, state: d.state || (STATES.find((s) => s.toLowerCase() === String(j.state).toLowerCase()) ?? d.state) } : d));
      } catch { /* the shopper can type them */ }
    }
  };

  const continueToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId === "new") {
      const errs = validate(draft);
      if (Object.keys(errs).length) { setErrors(errs); return; }
    } else if (!chosen) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** The address that will be shipped to (saved one, or the validated draft). */
  const shipTo = chosen
    ? { name: chosen.name, phone: chosen.phone, line1: chosen.line1, line2: chosen.line2, city: chosen.city, state: chosen.state, pincode: chosen.pincode }
    : { name: draft.name.trim(), phone: draft.phone, line1: draft.line1.trim(), line2: draft.line2.trim(), city: draft.city.trim(), state: draft.state, pincode: draft.pincode };

  const placeOrder = async () => {
    if (placing || placed.current) return;
    setPlacing(true);
    setError("");
    if (!idemKey.current) idemKey.current = crypto.randomUUID();
    try {
      // Save a new address to the book first (best-effort — never blocks the order).
      if (selectedId === "new" && draft.save) {
        fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: draft.label, name: shipTo.name, line1: shipTo.line1, line2: shipTo.line2, city: shipTo.city, state: shipTo.state, pincode: shipTo.pincode, phone: shipTo.phone, isDefault: (addresses?.length ?? 0) === 0 }) }).catch(() => {});
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
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not place your order. Please try again.");

      if (method === "cod") {
        placed.current = true;
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
          } catch (e: any) { setError(e.message); setPlacing(false); }
        },
        modal: { ondismiss: () => { setPlacing(false); setError("Payment cancelled. You can try again."); } },
      });
      rz.open();
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setPlacing(false);
    }
  };

  const ready = buyNow !== null && items.length > 0 && me !== null && addresses !== null;

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
                  {addresses!.map((a) => (
                    <label key={a.id} className={`co-addr ${selectedId === a.id ? "on" : ""}`}>
                      <input type="radio" name="addr" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} />
                      <div>
                        <b>{a.name} <em>{a.label}</em>{a.isDefault ? <em className="def">Default</em> : null}</b>
                        <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}</p>
                        <small>Phone: {a.phone}</small>
                      </div>
                    </label>
                  ))}
                  <label className={`co-addr ${selectedId === "new" ? "on" : ""}`}>
                    <input type="radio" name="addr" checked={selectedId === "new"} onChange={() => setSelectedId("new")} />
                    <div><b>+ Add a new address</b></div>
                  </label>
                </div>
              ) : null}

              {selectedId === "new" ? (
                <div className="co-card">
                  <div className="co-grid">
                    <div className="co-f"><label htmlFor="co-name">Full name</label><input id="co-name" autoComplete="name" value={draft.name} onChange={(e) => setD("name", e.target.value)} aria-invalid={!!errors.name} />{errors.name ? <em>{errors.name}</em> : null}</div>
                    <div className="co-f"><label htmlFor="co-phone">Mobile number</label><input id="co-phone" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" value={draft.phone} onChange={(e) => setD("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} aria-invalid={!!errors.phone} />{errors.phone ? <em>{errors.phone}</em> : null}</div>
                    <div className="co-f"><label htmlFor="co-pin">Pincode</label><input id="co-pin" inputMode="numeric" autoComplete="postal-code" placeholder="6 digits" value={draft.pincode} onChange={(e) => onPincode(e.target.value)} aria-invalid={!!errors.pincode} />{errors.pincode ? <em>{errors.pincode}</em> : null}</div>
                    <div className="co-f"><label htmlFor="co-city">City / District</label><input id="co-city" autoComplete="address-level2" value={draft.city} onChange={(e) => setD("city", e.target.value)} aria-invalid={!!errors.city} />{errors.city ? <em>{errors.city}</em> : null}</div>
                    <div className="co-f"><label htmlFor="co-state">State</label>
                      <select id="co-state" autoComplete="address-level1" value={draft.state} onChange={(e) => setD("state", e.target.value)} aria-invalid={!!errors.state}>
                        <option value="">Select state</option>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>{errors.state ? <em>{errors.state}</em> : null}
                    </div>
                    <div className="co-f"><label htmlFor="co-type">Address type</label>
                      <select id="co-type" value={draft.label} onChange={(e) => setD("label", e.target.value as Draft["label"])}><option>Home</option><option>Work</option><option>Other</option></select>
                    </div>
                    <div className="co-f full"><label htmlFor="co-l1">House no., building, street</label><input id="co-l1" autoComplete="address-line1" value={draft.line1} onChange={(e) => setD("line1", e.target.value)} aria-invalid={!!errors.line1} />{errors.line1 ? <em>{errors.line1}</em> : null}</div>
                    <div className="co-f full"><label htmlFor="co-l2">Landmark / area <small>(optional)</small></label><input id="co-l2" autoComplete="address-line2" value={draft.line2} onChange={(e) => setD("line2", e.target.value)} /></div>
                  </div>
                  <label className="co-check"><input type="checkbox" checked={draft.save} onChange={(e) => setD("save", e.target.checked)} /> Save this address to my account</label>
                </div>
              ) : null}

              <button type="submit" className="cv-btn cv-btn-navy co-cta">Deliver to this address</button>
            </form>
          ) : (
            <div>
              <h1 className="co-h">Review &amp; place your order</h1>

              <section className="co-card">
                <div className="co-row"><h2>Delivering to</h2><button type="button" className="co-link" onClick={() => setStep(1)}>Change</button></div>
                <p className="co-addr-txt"><b>{shipTo.name}</b><br />{shipTo.line1}{shipTo.line2 ? `, ${shipTo.line2}` : ""}<br />{shipTo.city}, {shipTo.state} {shipTo.pincode}<br />Phone: {shipTo.phone}</p>
                <p className="co-sub" style={{ margin: 0 }}>Order updates go to <b>{me?.email}</b></p>
              </section>

              <section className="co-card">
                <h2>Payment</h2>
                <div className="co-pay" role="radiogroup" aria-label="Payment method">
                  <label className={`co-addr ${method === "cod" ? "on" : ""} ${!codAllowed ? "off" : ""}`}>
                    <input type="radio" name="pay" checked={method === "cod"} disabled={!codAllowed} onChange={() => setMethod("cod")} />
                    <div><b>Cash on Delivery</b><p>{codAllowed ? `Pay in cash when your order arrives. ${fmt(COD_FEE)} handling fee.` : `Not available above ${fmt(COD_MAX_LIMIT)}.`}</p></div>
                  </label>
                  <label className={`co-addr ${method === "razorpay" ? "on" : ""} ${!online ? "off" : ""}`}>
                    <input type="radio" name="pay" checked={method === "razorpay"} disabled={!online} onChange={() => setMethod("razorpay")} />
                    <div><b>UPI / Cards / Netbanking {!online ? <em>Coming soon</em> : null}</b><p>Secure online payment via Razorpay.</p></div>
                  </label>
                </div>
              </section>

              {error ? <p role="alert" className="co-error">{error}</p> : null}

              <button type="button" onClick={placeOrder} disabled={placing} className="cv-btn cv-btn-navy co-cta" id="checkout-place-order-btn">
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
