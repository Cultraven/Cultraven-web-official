"use client";
/**
 * /account/profile — edit details, change password, profile photo, log out, delete account.
 * Server validation is authoritative (/api/account/*); the checks here only give instant feedback.
 */
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarCard } from "./AvatarCard";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { notifyAccountChanged } from "./useAccountSession";
import { passwordProblem, phoneProblem } from "@/lib/profile-rules";
import "./profile.css";

export interface ProfileInitial { firstName: string; lastName: string; email: string; phone: string; avatar: string | null; letter: string }

/** Module-level (not nested in the page) so inputs keep focus while typing. */
function Field({ id, label, err, hint, full, children }: { id: string; label: string; err?: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`acct-field${full ? " full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !err ? <small>{hint}</small> : null}
      {err ? <em id={`${id}-err`} role="alert">{err}</em> : null}
    </div>
  );
}

const firstIssue = (issues: unknown): Record<string, string> =>
  Object.fromEntries(Object.entries((issues as Record<string, string[]>) ?? {}).map(([k, v]) => [k, v?.[0] ?? ""]).filter(([, v]) => v));

export default function ProfileClient({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const [flash, setFlash] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = (tone: "ok" | "bad", text: string) => {
    setFlash({ tone, text });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  };

  const photoChanged = () => { notifyAccountChanged(); router.refresh(); };

  // ── details ──
  const [d, setD] = useState({ firstName: initial.firstName, lastName: initial.lastName, phone: initial.phone });
  const [hasPhone, setHasPhone] = useState(!!initial.phone); // once a number is saved it can't be removed
  const [dErr, setDErr] = useState<Record<string, string>>({});
  const [dBusy, setDBusy] = useState(false);
  const setDF = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => { setD((x) => ({ ...x, [k]: e.target.value })); setDErr((x) => ({ ...x, [k]: "" })); };

  const saveDetails = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!d.firstName.trim()) e.firstName = "First name is required";
    else if (d.firstName.trim().length > 50) e.firstName = "First name must be 50 characters or fewer";
    if (!d.lastName.trim()) e.lastName = "Last name is required";
    else if (d.lastName.trim().length > 50) e.lastName = "Last name must be 50 characters or fewer";
    const pp = phoneProblem(d.phone);
    if (pp) e.phone = pp;
    else if (hasPhone && !d.phone.trim()) e.phone = "Mobile number is required";
    setDErr(e);
    if (Object.keys(e).length) return;
    setDBusy(true);
    try {
      const res = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: d.firstName, lastName: d.lastName, phone: d.phone }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j.issues) setDErr(firstIssue(j.issues)); else say("bad", j.error || "Could not save your details.");
      } else {
        setD({ firstName: j.profile.firstName, lastName: j.profile.lastName, phone: j.profile.phone });
        setHasPhone(!!j.profile.phone);
        say("ok", "Your details were saved.");
        notifyAccountChanged();
        router.refresh(); // refreshes the sidebar name
      }
    } catch { say("bad", "Network error. Nothing was saved."); }
    setDBusy(false);
  };

  // ── password ──
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pErr, setPErr] = useState<Record<string, string>>({});
  const [pBusy, setPBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const setPF = (k: keyof typeof pw) => (e: React.ChangeEvent<HTMLInputElement>) => { setPw((x) => ({ ...x, [k]: e.target.value })); setPErr((x) => ({ ...x, [k]: "" })); };

  const savePassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!pw.currentPassword) e.currentPassword = "Enter your current password";
    const np = passwordProblem(pw.newPassword);
    if (np) e.newPassword = np;
    else if (pw.newPassword === pw.currentPassword) e.newPassword = "Choose a password different from your current one";
    if (pw.confirm !== pw.newPassword) e.confirm = "Passwords do not match";
    setPErr(e);
    if (Object.keys(e).length) return;
    setPBusy(true);
    try {
      const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j.issues) setPErr(firstIssue(j.issues)); else say("bad", j.error || "Could not change your password.");
      } else {
        setPw({ currentPassword: "", newPassword: "", confirm: "" });
        say("ok", "Your password was changed.");
      }
    } catch { say("bad", "Network error. Your password was not changed."); }
    setPBusy(false);
  };

  // ── logout / delete ──
  const [loggingOut, setLoggingOut] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* the cookie is cleared server-side; navigate regardless */ }
    window.location.assign("/");
  };

  return (
    <>
      <header className="acct-head">
        <span className="acct-eyebrow">My account</span>
        <h1 className="acct-title">Profile</h1>
        <p className="acct-sub">Your photo, contact details and password.</p>
      </header>

      <div className="pf-stack">
        {flash ? <p className={`pf-flash ${flash.tone === "ok" ? "is-ok" : "is-bad"}`} role={flash.tone === "ok" ? "status" : "alert"}>{flash.text}</p> : null}

        <AvatarCard letter={initial.letter} initialUrl={initial.avatar} onChanged={photoChanged} />

        <form className="acct-card" onSubmit={saveDetails} noValidate aria-labelledby="pf-details-h">
          <div className="acct-card-h"><h3 id="pf-details-h">Your details</h3></div>
          <div className="acct-card-b">
            <div className="acct-form">
              <Field id="pf-first" label="First name" err={dErr.firstName}>
                <input id="pf-first" value={d.firstName} onChange={setDF("firstName")} autoComplete="given-name" maxLength={50} aria-invalid={dErr.firstName ? true : undefined} />
              </Field>
              <Field id="pf-last" label="Last name" err={dErr.lastName}>
                <input id="pf-last" value={d.lastName} onChange={setDF("lastName")} autoComplete="family-name" maxLength={50} aria-invalid={dErr.lastName ? true : undefined} />
              </Field>
              <Field id="pf-phone" label={hasPhone ? "Mobile number" : "Mobile number (please add yours)"} err={dErr.phone} hint="10 digits, starting 6 to 9">
                <input id="pf-phone" type="tel" inputMode="numeric" value={d.phone} onChange={setDF("phone")} autoComplete="tel-national" maxLength={14} aria-invalid={dErr.phone ? true : undefined} />
              </Field>
              <Field id="pf-email" label="Email" hint="Your login email can't be changed here.">
                <input id="pf-email" type="email" value={initial.email} readOnly aria-readonly="true" autoComplete="email" />
              </Field>
            </div>
            <div className="pf-form-actions">
              <button type="submit" className="cv-btn cv-btn-navy cv-btn-sm" disabled={dBusy}>{dBusy ? "Saving…" : "Save details"}</button>
            </div>
          </div>
        </form>

        <form className="acct-card" onSubmit={savePassword} noValidate aria-labelledby="pf-pass-h">
          <div className="acct-card-h"><h3 id="pf-pass-h">Change password</h3></div>
          <div className="acct-card-b">
            <div className="acct-form">
              <Field id="pf-cur" label="Current password" err={pErr.currentPassword} full>
                <input id="pf-cur" type={showPw ? "text" : "password"} value={pw.currentPassword} onChange={setPF("currentPassword")} autoComplete="current-password" maxLength={128} aria-invalid={pErr.currentPassword ? true : undefined} />
              </Field>
              <Field id="pf-new" label="New password" err={pErr.newPassword} hint="At least 8 characters with an uppercase letter, a lowercase letter and a number.">
                <input id="pf-new" type={showPw ? "text" : "password"} value={pw.newPassword} onChange={setPF("newPassword")} autoComplete="new-password" maxLength={128} aria-invalid={pErr.newPassword ? true : undefined} />
              </Field>
              <Field id="pf-conf" label="Confirm new password" err={pErr.confirm}>
                <input id="pf-conf" type={showPw ? "text" : "password"} value={pw.confirm} onChange={setPF("confirm")} autoComplete="new-password" maxLength={128} aria-invalid={pErr.confirm ? true : undefined} />
              </Field>
              <label className="pf-pw-toggle full"><input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} /> Show passwords</label>
            </div>
            <div className="pf-form-actions">
              <button type="submit" className="cv-btn cv-btn-navy cv-btn-sm" disabled={pBusy}>{pBusy ? "Updating…" : "Update password"}</button>
            </div>
          </div>
        </form>

        <section className="acct-card" aria-labelledby="pf-sess-h">
          <div className="acct-card-h"><h3 id="pf-sess-h">Session</h3></div>
          <div className="acct-card-b pf-row">
            <p>Signed in as <b>{initial.email}</b>. Log out on this device when you&apos;re done.</p>
            <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={logout} disabled={loggingOut} data-testid="pf-logout">{loggingOut ? "Logging out…" : "Log out"}</button>
          </div>
        </section>

        <section className="acct-card pf-danger" aria-labelledby="pf-danger-h">
          <div className="acct-card-h"><h3 id="pf-danger-h">Danger zone</h3></div>
          <div className="acct-card-b pf-row">
            <p>Delete your account and sign out for good. Your order history is kept by us for accounting. You can register again later with the same email.</p>
            <button type="button" className="cv-btn cv-btn-danger cv-btn-sm" onClick={() => setDelOpen(true)} data-testid="pf-delete-open">Delete my account</button>
          </div>
        </section>
      </div>

      {delOpen ? <DeleteAccountModal onClose={() => setDelOpen(false)} /> : null}
    </>
  );
}
