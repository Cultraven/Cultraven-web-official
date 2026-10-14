/**
 * Which mailbox sends which email.
 *
 * The site can hold TWO sender mailboxes (each its own SMTP login): the Orders mailbox (e.g. orders@cultraven.com) and the
 * Support mailbox (e.g. support@cultraven.com). Every email the site sends belongs to one category below, and each category is
 * sent from the mailbox chosen in Admin → Settings → Email. Anything not chosen uses the category's default; if the chosen
 * mailbox isn't set up (or is switched off), the Orders mailbox is used instead, so no email is ever lost.
 *
 * Pure (no database, no server imports): the admin page and the sender share it.
 */
export const MAIL_PROFILES = ["orders", "support"] as const;
export type MailProfile = (typeof MAIL_PROFILES)[number];
export const PROFILE_LABEL: Record<MailProfile, string> = { orders: "Orders mailbox", support: "Support mailbox" };
export const PROFILE_PLACEHOLDER: Record<MailProfile, string> = { orders: "orders@yourdomain.com", support: "support@yourdomain.com" };
export const isProfile = (v: unknown): v is MailProfile => typeof v === "string" && (MAIL_PROFILES as readonly string[]).includes(v);

export interface MailCategory {
  id: string;
  label: string;
  /** Who receives it */
  audience: string;
  /** What action in the shop or admin sends it */
  when: string;
  /** What the emails look like */
  examples: string;
  defaultProfile: MailProfile;
  /** Matches the `kind` the sender logs for these emails */
  match: RegExp;
  /** One real kind from this category (used to work out which mailbox it uses) */
  sample: string;
}

export const MAIL_CATEGORIES: readonly MailCategory[] = [
  { id: "order-confirmation", label: "Order confirmation", audience: "The customer", defaultProfile: "orders", match: /^order-customer(-resend)?$/, sample: "order-customer",
    when: "Right after an order is placed (Cash on Delivery) or paid (online). Also when you press “Resend confirmation” on an order.", examples: "“Order confirmed” with the PDF receipt attached" },
  { id: "order-updates", label: "Order status updates", audience: "The customer", defaultProfile: "orders", match: /^order-status-/, sample: "order-status-shipped",
    when: "Whenever an order's status changes — confirmed, packed, shipped, out for delivery, delivered — or the customer cancels or asks to return.", examples: "“CR-1A2B3C: Shipped” with the order tracker" },
  { id: "order-alerts", label: "Team alerts: orders", audience: "Your team (the alert addresses below)", defaultProfile: "orders", match: /^(order-admin|admin-)/, sample: "order-admin",
    when: "A new order arrives, or a customer cancels an order or asks for a return.", examples: "“New order CR-1A2B3C — ₹4,047 (COD)”" },
  { id: "support", label: "Contact-form messages", audience: "The customer, and your team", defaultProfile: "support", match: /^support-/, sample: "support-ack",
    when: "Someone sends the Contact us form: they get an acknowledgement and your team gets the message.", examples: "“We got your message — HLP-1A2B3C”" },
  { id: "account", label: "Account & password emails", audience: "The customer", defaultProfile: "support", match: /^(welcome|password-)/, sample: "welcome",
    when: "A customer signs up (welcome), uses “Forgot password” (reset link), or their password changes (security notice).", examples: "“Welcome to CULTRAVEN”, “Reset your CULTRAVEN password”" },
  { id: "staff", label: "Staff & delivery partners", audience: "Staff, delivery partners, your team", defaultProfile: "support", match: /^(staff_|delivery_kyc)/, sample: "staff_account_created",
    when: "A staff or delivery account is created (set-password link), a delivery partner submits their KYC, or you approve / reject it.", examples: "“Your CULTRAVEN Admin account is ready”" },
];

export const categoryOf = (kind: string): MailCategory | null => MAIL_CATEGORIES.find((c) => c.match.test(kind)) ?? null;

/** Saved choices: category id -> mailbox. Unknown ids / mailboxes in old or hand-edited data are ignored. */
export type Routing = Partial<Record<string, MailProfile>>;

export function cleanRouting(raw: unknown): Routing {
  const out: Routing = {};
  if (raw && typeof raw === "object") for (const c of MAIL_CATEGORIES) { const v = (raw as Record<string, unknown>)[c.id]; if (isProfile(v)) out[c.id] = v; }
  return out;
}

/** The mailbox the admin chose for this kind of email (or the default). Unknown kinds go through the Orders mailbox. */
export function chosenProfile(kind: string, routing: Routing): MailProfile {
  const c = categoryOf(kind);
  return (c && routing[c.id]) || c?.defaultProfile || "orders";
}

/**
 * The mailbox that will actually send: the chosen one if it is usable, otherwise the Orders mailbox (flagged as a fallback),
 * otherwise nothing (the email is logged as skipped).
 */
export function pickProfile(kind: string, routing: Routing, usable: ReadonlySet<MailProfile>): { profile: MailProfile; chosen: MailProfile; fellBack: boolean } | null {
  const chosen = chosenProfile(kind, routing);
  if (usable.has(chosen)) return { profile: chosen, chosen, fellBack: false };
  if (chosen !== "orders" && usable.has("orders")) return { profile: "orders", chosen, fellBack: true };
  return null;
}
