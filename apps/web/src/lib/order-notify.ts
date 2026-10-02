/**
 * "Order placed" emails: the customer gets a confirmation, the admin(s) get an alert.
 * Safe to call more than once per order (verify + webhook both fire for online payments): an atomic
 * flag on the order makes sure each order is announced exactly once. Never throws.
 */
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { getSmtpSettings, sendMail } from "@/lib/mailer";
import { customerOrderEmail, adminOrderEmail, orderStatusEmail, adminCustomerActionEmail, orderNumber, type MailOrder, type StatusEmailInput } from "@/lib/email-templates";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function notifyOrderPlaced(orderId: string): Promise<void> {
  try {
    await connectToDatabase();
    // Claim the announcement atomically — the loser of a race simply returns.
    const o = (await Order.findOneAndUpdate({ _id: orderId, emailNotifiedAt: null }, { $set: { emailNotifiedAt: new Date() } }, { new: true }).lean()) as any;
    if (!o) return;

    const mo: MailOrder = {
      id: String(o._id), createdAt: o.createdAt, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
      items: o.items, subtotalPaise: o.subtotalPaise, discountPaise: o.discountPaise ?? 0, shippingPaise: o.shippingPaise ?? 0,
      codFeePaise: o.codFeePaise ?? 0, totalPaise: o.totalPaise, deliveryAddress: o.deliveryAddress,
    };
    const settings = await getSmtpSettings();
    const jobs: Promise<unknown>[] = [];

    if (mo.deliveryAddress.email) {
      // Attach the PDF receipt; if it can't be built the confirmation still goes out without it.
      let attachments: { filename: string; content: Uint8Array; contentType: string }[] | undefined;
      try { attachments = [{ filename: `CULTRAVEN-receipt-${orderNumber(mo.id)}.pdf`, content: await buildInvoicePdf({ ...mo, razorpayPaymentId: o.razorpayPaymentId }), contentType: "application/pdf" }]; }
      catch (e) { console.error("[order-notify] receipt PDF failed:", e instanceof Error ? e.message : e); }
      const m = customerOrderEmail(mo, siteUrl(), { receiptAttached: !!attachments });
      jobs.push(sendMail({ to: mo.deliveryAddress.email, ...m, kind: "order-customer", orderId: mo.id, replyTo: settings?.fromEmail, attachments }));
    }
    for (const to of settings?.adminEmails ?? []) {
      const m = adminOrderEmail(mo, siteUrl());
      jobs.push(sendMail({ to, ...m, kind: "order-admin", orderId: mo.id }));
    }
    await Promise.allSettled(jobs);
  } catch (e) {
    console.error("[order-notify] failed:", e instanceof Error ? e.message : e);
  }
}

function toMailOrder(o: any): MailOrder {
  return {
    id: String(o._id), createdAt: o.createdAt, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    items: o.items, subtotalPaise: o.subtotalPaise, discountPaise: o.discountPaise ?? 0, shippingPaise: o.shippingPaise ?? 0,
    codFeePaise: o.codFeePaise ?? 0, totalPaise: o.totalPaise, deliveryAddress: o.deliveryAddress,
  };
}

/** Tell the customer their order moved to a new status (admin change, or their own cancel / return request). Never throws. */
export async function notifyStatusChange(orderId: string, info: StatusEmailInput): Promise<void> {
  try {
    await connectToDatabase();
    const o = (await Order.findById(orderId).lean()) as any;
    if (!o?.deliveryAddress?.email) return;
    const settings = await getSmtpSettings();
    const mo = toMailOrder(o);
    // A cancellation email suggests a few things to shop next (bestsellers first), only in-stock ones.
    let picks = info.picks;
    if (info.status === "cancelled" && !picks) {
      try {
        const ids = new Set((o.items ?? []).map((i: any) => String(i.productId)));
        const docs = (await Product.find({ inStock: { $ne: false } }).sort({ isBestseller: -1, createdAt: -1 }).limit(8).select("title slug image images pricePaise").lean()) as any[];
        picks = docs.filter((d) => !ids.has(String(d._id))).slice(0, 4).map((d) => ({ title: d.title, pricePaise: d.pricePaise, image: /^https?:\/\//.test(d.image ?? "") ? d.image : d.image ? `${siteUrl()}${d.image}` : undefined, url: `${siteUrl()}/products/${d.slug}` }));
      } catch { picks = []; }
    }
    const m = orderStatusEmail(mo, siteUrl(), { ...info, picks, courier: info.courier ?? o.courierName, trackingNumber: info.trackingNumber ?? o.trackingNumber, trackingUrl: info.trackingUrl ?? o.trackingUrl });
    await sendMail({ to: mo.deliveryAddress.email!, ...m, kind: `order-status-${info.status}`, orderId: mo.id, replyTo: settings?.fromEmail });
  } catch (e) {
    console.error("[order-notify] status email failed:", e instanceof Error ? e.message : e);
  }
}

/** Alert the admin(s) that a customer cancelled or asked for a return. Never throws. */
export async function notifyAdminCustomerAction(orderId: string, kind: "cancelled" | "cancel_requested" | "return_requested", reason: string): Promise<void> {
  try {
    await connectToDatabase();
    const o = (await Order.findById(orderId).lean()) as any;
    if (!o) return;
    const settings = await getSmtpSettings();
    const m = adminCustomerActionEmail(toMailOrder(o), siteUrl(), kind, reason);
    await Promise.allSettled((settings?.adminEmails ?? []).map((to) => sendMail({ to, ...m, kind: `admin-${kind}`, orderId })));
  } catch (e) {
    console.error("[order-notify] admin alert failed:", e instanceof Error ? e.message : e);
  }
}
