/** Emails for a new drop-alert sign-up: thank the visitor and tell the team. Never throws (email trouble must never lose a sign-up). */
import { connectToDatabase } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { getSmtpSettings, sendMail } from "@/lib/mailer";
import { notifyAdminEmail, notifyWelcomeEmail } from "@/lib/email-templates";
import { supportConfig } from "@/lib/support";
import { siteUrl } from "@/lib/site-url";

export async function notifyNewSubscriber(input: { email: string; interest?: string; page?: string; notifyPerson?: boolean }): Promise<void> {
  try {
    await connectToDatabase();
    const settings = await getSmtpSettings();
    const total = Number(await NewsletterSubscriber.countDocuments({ status: { $ne: "unsubscribed" } })) || 0;
    const jobs: Promise<unknown>[] = [];
    // Team alert goes to the admin alert addresses, falling back to the public support address.
    const team = settings?.adminEmails?.length ? settings.adminEmails : [supportConfig().email];
    const a = notifyAdminEmail({ email: input.email, interest: input.interest, page: input.page, total, siteUrl: siteUrl() });
    for (const to of team) jobs.push(sendMail({ to, ...a, kind: "notify-admin", replyTo: input.email }));
    if (input.notifyPerson !== false) {
      const w = notifyWelcomeEmail({ interest: input.interest, siteUrl: siteUrl() });
      jobs.push(sendMail({ to: input.email, ...w, kind: "notify-welcome" }));
    }
    await Promise.allSettled(jobs);
  } catch (e) {
    console.error("[subscriber-notify] failed:", e instanceof Error ? e.message : e);
  }
}
