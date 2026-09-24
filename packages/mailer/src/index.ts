import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export function createSmtpMailer(opts: {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
}): Mailer {
  const transport = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    auth: opts.user ? { user: opts.user, pass: opts.pass } : undefined,
  });
  return {
    async send(message) {
      await transport.sendMail({ from: opts.from, ...message });
    },
  };
}
