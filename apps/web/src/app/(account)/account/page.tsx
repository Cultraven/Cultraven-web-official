import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Address } from "@/lib/models/Address";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const tone = (s: string) => (s === "delivered" ? "is-ok" : s === "cancelled" || s === "returned" ? "is-bad" : s === "shipped" ? "is-info" : "is-warn");
const date = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AccountDashboard() {
  const me = await getCurrentCustomer();

  let orders: any[] = [];
  let orderCount = 0;
  let spent = 0;
  let inProgress = 0;
  let address: any = null;
  let failed = false;
  if (me) {
    try {
      await connectToDatabase();
      const [recent, agg, addr] = await Promise.all([
        Order.find({ userId: me.userId }).sort({ createdAt: -1 }).limit(3).select("razorpayOrderId totalPaise fulfillmentStatus createdAt items.image items.title items.quantity").lean(),
        Order.aggregate([
          { $match: { userId: me.userId } },
          { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalPaise", 0] } }, open: { $sum: { $cond: [{ $in: ["$fulfillmentStatus", ["processing", "confirmed", "shipped"]] }, 1, 0] } } } },
        ]),
        Address.findOne({ userId: me.userId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      ]);
      orders = recent as any[];
      orderCount = agg[0]?.count ?? 0;
      spent = agg[0]?.spent ?? 0;
      inProgress = agg[0]?.open ?? 0;
      address = addr;
    } catch (e) {
      failed = true;
      console.error("[account] dashboard load failed:", e instanceof Error ? e.message : e);
    }
  }

  const first = me?.firstName || "there";

  return (
    <>
      <div className="acct-hero">
        <span className="acct-eyebrow">My account</span>
        <h2>Welcome back, {first}.</h2>
        <p>Track your orders, keep your addresses ready for one-click checkout and save the pieces you love.</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <Link href="/collections/all" className="cv-btn cv-btn-lava cv-btn-sm">
            Keep shopping
            <svg className="cv-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
          <Link href="/account/orders" className="cv-btn cv-btn-ghost-light cv-btn-sm">View orders</Link>
        </div>
      </div>

      {failed ? <p role="alert" style={{ marginBottom: "1.5rem", color: "#b42318", fontWeight: 700 }}>We couldn&apos;t load your latest details right now. Please refresh in a moment.</p> : null}

      <div className="acct-stats">
        <div className="acct-stat"><b>{orderCount}</b><span>Orders placed</span></div>
        <div className="acct-stat"><b>{inProgress}</b><span>On the way</span></div>
        <div className="acct-stat"><b>{inr(spent)}</b><span>Total spent</span></div>
      </div>

      <div className="acct-two">
        <section className="acct-card">
          <div className="acct-card-h">
            <h3>Recent orders</h3>
            <Link href="/account/orders" className="acct-link">View all</Link>
          </div>
          <div className="acct-card-b">
            {orders.length === 0 ? (
              <div className="acct-empty" style={{ padding: "1.5rem 0.5rem" }}>
                <div className="acct-empty-ic">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 01-8 0" /></svg>
                </div>
                <h3>No orders yet</h3>
                <p>When you place an order it shows up here, with live status.</p>
                <Link href="/collections/all" className="cv-btn cv-btn-navy cv-btn-sm">Start shopping</Link>
              </div>
            ) : (
              orders.map((o) => (
                <div key={String(o._id)} className="acct-order">
                  <div className="acct-thumbs">
                    {(o.items ?? []).slice(0, 3).map((it: any, i: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} className="acct-thumb" src={it.image} alt="" loading="lazy" />
                    ))}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <b>Order {o.razorpayOrderId ?? String(o._id).slice(-6).toUpperCase()}</b>
                    <small>{date(o.createdAt)} · {(o.items ?? []).reduce((n: number, it: any) => n + (it.quantity ?? 1), 0)} item(s)</small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <b>{inr(o.totalPaise)}</b>
                    <div style={{ marginTop: 6 }}><span className={`acct-chip ${tone(o.fulfillmentStatus)}`}>{o.fulfillmentStatus}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="acct-card">
          <div className="acct-card-h">
            <h3>Delivery address</h3>
            <Link href="/account/addresses" className="acct-link">{address ? "Manage" : "Add"}</Link>
          </div>
          <div className="acct-card-b">
            {address ? (
              <p style={{ color: "var(--color-navy)", lineHeight: 1.65, fontSize: "0.92rem" }}>
                <b>{address.name}</b><br />
                {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
                {address.city}, {address.state} {address.pincode}<br />
                <span style={{ color: "var(--color-smoke)" }}>{address.phone}</span>
              </p>
            ) : (
              <p style={{ color: "var(--color-smoke)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                You haven&apos;t saved an address yet. Add one for faster checkout.
              </p>
            )}
            <div style={{ marginTop: "1.25rem" }}>
              <Link href="/account/addresses" className="cv-btn cv-btn-outline cv-btn-sm">{address ? "Edit addresses" : "Add an address"}</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
