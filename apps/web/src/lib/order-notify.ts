/**
 * "Order placed" emails: the customer gets a confirmation, the admin(s) get an alert.
 * Safe to call more than once per order (verify + webhook both fire for online payments): an atomic
 * flag on the order makes sure each order is announced exactly once. Never throws.
 */
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getSmtpSettings, sendMail } from "@/lib/mailer";
import { customerOrderEmail, adminOrderEmail, type MailOrder } from "@/lib/email-templates";

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
      const m = customerOrderEmail(mo, siteUrl());
      jobs.push(sendMail({ to: mo.deliveryAddress.email, ...m, kind: "order-customer", orderId: mo.id, replyTo: settings?.fromEmail }));
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
