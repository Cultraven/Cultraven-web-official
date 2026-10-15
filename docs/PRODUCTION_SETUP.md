# CULTRAVEN — Production setup checklist (email, password reset, support)

Written for the shop owner. Do the steps in order; each one says how to check it worked.
Last checked against the live site: 15 Oct 2026.

## Where things stand today

| Area | Live status |
|---|---|
| Website, checkout, admin, Razorpay/COD | Working (health check: database connected, no required setting missing) |
| Email sending | Working. Both mailboxes (Orders and Support) are saved on the live site, and the login for each was checked on 15 Oct 2026. |
| Support mailbox (support@cultraven.com) | Set up — contact-form, account and staff emails are sent from it. Step 2 is only needed again if you change its password. |
| Email authentication (SPF, DKIM, DMARC) | **Missing — this is why some emails don't reach the inbox.** Do Step 1 first. |
| Support phone 8962212605 | Live in emails, receipt, Help Center, chat/WhatsApp and the Contact page |
| Password reset, welcome email, password-changed email | Live |

> "Sent" in Admin → Settings → Email → Recent emails only means Google accepted the message. Without Step 1, Gmail/Outlook may put it in Spam or drop it.

---

## Step 1 — Make emails trusted (DNS records) · ~15 minutes · do this first

Your domain's DNS is served by **nebula.dns-parking.com / aurora.dns-parking.com**. Records must be added **where those nameservers are managed**
(if you bought the domain on Hostinger: hPanel → Domains → your domain → **DNS / Nameservers → DNS records**; if you bought it elsewhere, log in to the
company that lists those nameservers). Adding records anywhere else has no effect.

Your inbound mail record (`MX 1 SMTP.GOOGLE.com`) is fine — leave it.

### 1a. SPF — who may send as cultraven.com
Add a record:

| Type | Name / Host | Value |
|---|---|---|
| TXT | `@` (the domain itself) | `v=spf1 include:_spf.google.com ~all` |

Only **one** SPF record may exist. There is none today, so just add it. (If you ever see two, merge them into one.)

### 1b. DKIM — the signature that proves an email is really yours
1. Open **admin.google.com** (signed in as your Google Workspace admin).
2. **Apps → Google Workspace → Gmail → Authenticate email**.
3. Choose the domain **cultraven.com**, click **Generate new record** (keep 2048-bit and the prefix `google`).
4. Google shows a **DNS Host name** (`google._domainkey`) and a long **TXT record value**. Add it at your DNS:

| Type | Name / Host | Value |
|---|---|---|
| TXT | `google._domainkey` | *(the long value from Google — paste all of it)* |

5. Wait 10–30 minutes, go back to the same Google page and click **Start authentication**. It should say "Authenticating email".

### 1c. DMARC — what to do with mail that fails the checks

| Type | Name / Host | Value |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:support@cultraven.com` |

`p=none` means "watch only" — it can't block anything. After 2–4 weeks of clean reports you can change `p=none` to `p=quarantine`.

### Check it worked
- **Admin → Settings → Email → "Will your emails reach the inbox?" → Check again.** All three rows should say **Set up**.
  (DNS changes can take a few minutes up to a few hours.)
- Send a test email (Step 2d) to your Gmail, open it, click ⋮ → **Show original**. You should see **SPF: PASS, DKIM: PASS, DMARC: PASS**.

---

## Step 2 — Set up the Support mailbox · ~10 minutes

### 2a. Create a Google App Password for support@cultraven.com
(Use a **new** one — do not reuse any password that was ever pasted into a chat or document.)
1. Sign in to Google as **support@cultraven.com** → **Manage your Google Account → Security**.
2. Make sure **2-Step Verification** is on.
3. Search for **App passwords** → create one named `CULTRAVEN website` → copy the 16 letters.
   (If "App passwords" doesn't appear, 2-Step Verification isn't enabled for that account — turn it on in the same Security page. If it is blocked, a Workspace admin must allow it at admin.google.com → Security → Authentication → 2-step verification.)

### 2b. Save it in the admin
**Admin → Settings → Email → Your mailboxes → Support mailbox tab:**

| Field | Value |
|---|---|
| Quick fill | Gmail |
| SMTP host / Port | `smtp.gmail.com` / `465` |
| Use SSL | ON |
| Username | `support@cultraven.com` |
| Password | the 16-letter App Password |
| From name | `CULTRAVEN Support` |
| From email | `support@cultraven.com` |
| Use this mailbox | ON |

Click **Save Support mailbox**.

### 2c. Choose which mailbox sends what
**Which mailbox sends what** (same page). The defaults are sensible — leave them unless you want a change:

| Email | Sent from |
|---|---|
| Order confirmation, order status updates, new-order/cancel/return alerts to your team | Orders mailbox |
| Contact-form messages, welcome / password-reset / password-changed, staff & delivery-partner emails | Support mailbox |

Each row shows **Right now: <address>** — that is the address actually being used — and how many were sent in the last 30 days.
Also check **Who receives the team alerts** (currently support@cultraven.com and jiteshbawaskar05@gmail.com).

### 2d. Test each mailbox
In each mailbox tab, type your Gmail address under **Send a test email from this mailbox** → **Send test**. It should arrive from the right name and address.
If it fails the page explains why (wrong App Password, wrong port, etc.), including Google's own reply.
Saving also tries the login straight away: you see **Saved, and the login to smtp.gmail.com works** or **Saved — but the mail server refused the login**. The page refuses your admin sign-in password and any Gmail password that is not a 16-letter App Password.

---

## Step 3 — Production settings on Vercel (check, don't change unless noted)

Vercel → your project → **Settings → Environment Variables → Production**. After changing any value, **Redeploy** (Deployments → ⋯ → Redeploy).

**Required — already OK** (the live health check reports none missing):
`MONGODB_URI`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_TOKEN`, `NEXT_PUBLIC_SITE_URL`

- `NEXT_PUBLIC_SITE_URL` must be exactly `https://cultraven.com` (no trailing slash). Every link in every email is built from it.
  (If it is ever missing or wrong, the site now falls back to https://cultraven.com instead of localhost.)
- `SESSION_SECRET` should be a long random string. Changing it signs everybody out.

**Payments** (see `docs/Razorpay_Setup_Guide_Cultraven.pdf`): `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Without them Cash on Delivery keeps working and online payment shows "not available".

**Optional — set only if you want to change the default:**

| Variable | Default (used if you don't set it) |
|---|---|
| `NEXT_PUBLIC_SUPPORT_HOURS` | `Mon–Sat, 10 AM – 7 PM IST` — see "Decide" below |
| `NEXT_PUBLIC_SUPPORT_PHONE` / `NEXT_PUBLIC_WHATSAPP_NUMBER` | 918962212605 (leave unset) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | support@cultraven.com |
| `INVOICE_SELLER_*` | the registered business details in the code (leave unset) |

**Do not set `SMTP_*` variables.** Mail settings live in the admin (Step 2). The environment is only an old fallback and would just confuse things.

**MongoDB Atlas → Network Access** must allow Vercel (`0.0.0.0/0`) — it already works today.

The new database collection for reset links is created automatically the first time it is used; nothing to set up.

---

## Step 4 — 15-minute smoke test on the live site (after Steps 1–2)

Use a Gmail "plus" address so one inbox can play a new customer: `yourname+test1@gmail.com`.

1. **Sign up** at cultraven.com/register with that address → within a minute a **Welcome to CULTRAVEN** email is in the **Inbox** (not Spam), from "CULTRAVEN Support". Its logo shows, "Start shopping" opens the shop.
2. **Forgot password** (cultraven.com/forgot-password) → **Reset your CULTRAVEN password** arrives → the button opens a "New password" page → choose a password → **Your CULTRAVEN password was changed** arrives → sign in works.
3. **Place a Cash on Delivery order** (under ₹5,000) with the same address → **Order confirmed** arrives from "CULTRAVEN <orders@…>" with the **PDF receipt attached**; your alert addresses get **New order**.
4. In **Admin → Orders**, move that order to Confirmed → Shipped (add a courier and tracking number) → Delivered. Each change sends an email with the vertical tracker.
5. Send a message through **Contact us** → the customer gets "We got your message", your team gets the message.
6. Open the **PDF receipt**: check the logo, GSTIN, address, +91 89622 12605 and the amount in words.
7. Open **Admin → Settings → Email → Recent emails**: every row says **sent**, with the right **Sent from** address.
8. Look at the emails on a phone and a laptop.
9. **Clean up:** delete the test order (Admin → Orders) and the test account (sign in as it → My account → Delete account).

If anything in 1–3 lands in Spam, Step 1 isn't finished yet — re-run the check card.

---

## Troubleshooting

| What you see | Likely cause | Fix |
|---|---|---|
| Log says **sent**, customer never sees it | Spam folder; DNS records missing | Step 1; ask them to check Spam |
| Test email: "mail server rejected the username or password" | Wrong or revoked App Password, or 2-Step Verification off | Make a new App Password (2a) |
| Test email: "Could not connect" | Wrong host/port or SSL switch | `smtp.gmail.com`, `465`, SSL **ON** |
| Reset or order email links open `localhost` | `NEXT_PUBLIC_SITE_URL` wrong | Set it to `https://cultraven.com` and redeploy |
| "Which mailbox sends what" says *covered by Orders* | Support mailbox not saved, or paused | Step 2b |
| Delivery check says DNS lookup failed | Temporary DNS outage | Press **Check again** in a minute |
| Reset link says "expired or already used" | Links last 30 minutes and work once; asking again cancels the older link | Use **Forgot password** again and click the newest email |
| Site error after a deploy | Bad release | Vercel → Deployments → pick the last good one → **Promote to Production** |

## Things only you can decide

- **Business hours.** Emails and the Help Center use `Mon–Sat, 10 AM – 7 PM IST` (the code default); the Contact page's "Business hours" box says **10 AM – 6 PM**. Pick the real hours, set `NEXT_PUBLIC_SUPPORT_HOURS` on Vercel, and ask to have the Contact page box read from it.
- **Registered legal / trade name** from the GST certificate (page 1) — the receipt currently prints "CULTRAVEN" as the seller.
- **Revoke every App Password that was ever pasted into a chat** (Google Account → Security → App passwords) and use the new ones from Step 2a. If the Orders mailbox's was one of them, create a new one and update it in the admin (Orders mailbox tab → Password → Save).

## How password reset works (for reference)
- Customers and delivery partners can use **Forgot password** on the site. A single-use link (valid 30 minutes) is emailed. Only a scrambled copy of the link is stored.
- **Admin and super-admin passwords** are changed from the admin panel, not by email, so a stolen mailbox can't take over the admin.
- New staff accounts get a **set-your-password link** (valid 48 hours) — never a password by email.
- Changing a password signs the account out on other devices and sends a "password changed" notice.
