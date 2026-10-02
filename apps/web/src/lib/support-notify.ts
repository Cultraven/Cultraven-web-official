/** Emails for a Contact us message: alert the team (all admin addresses) and acknowledge the customer. Never throws. */
import { connectToDatabase } from "@/lib/db";
import { SupportMessage, supportRef } from "@/lib/models/SupportMessage";
import { getSmtpSettings, sendMail } from "@/lib/mailer";
import { supportAdminEmail, supportAckEmail } from "@/lib/email-templates";
import { supportConfig } from "@/lib/support";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function notifySupportMessage(id: string): Promise<void> {
  try {
    await connectToDatabase();
    const d = (await SupportMessage.findById(id).lean()) as any;
    if (!d) return;
    const settings = await getSmtpSettings();
    const mail = { ref: supportRef(id), name: d.name, email: d.email, phone: d.phone, subject: d.subject, message: d.message, orderRef: d.orderRef };
    const jobs: Promise<unknown>[] = [];
    // Team alert goes to the admin alert addresses, falling back to the public support address.
    const team = settings?.adminEmails?.length ? settings.adminEmails : [supportConfig().email];
    const a = supportAdminEmail(mail, siteUrl());
    for (const to of team) jobs.push(sendMail({ to, ...a, kind: "support-admin", replyTo: d.email }));
    const c = supportAckEmail(mail, siteUrl(), supportConfig().hours);
    jobs.push(sendMail({ to: d.email, ...c, kind: "support-ack", replyTo: settings?.fromEmail }));
    await Promise.allSettled(jobs);
  } catch (e) {
    console.error("[support-notify] failed:", e instanceof Error ? e.message : e);
  }
}
