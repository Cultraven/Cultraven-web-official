"use client";
import { BrandLogo } from "@/components/common/BrandLogo";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/components/admin/admin.css";
import { Button, Field, useApi } from "@/components/admin/ui";

type Me = { firstName: string; lastName: string; email: string; phone?: string; verificationStatus: string; avatarUpdatedAt?: string };

function AvatarSection({ me, onUpdate }: { me: Me; onUpdate: (ts: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ts = me.avatarUpdatedAt ?? "";

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError("");
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const size = 256;
            const canvas = document.createElement("canvas");
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            const s = Math.min(img.width, img.height);
            const x = (img.width - s) / 2, y = (img.height - s) / 2;
            ctx.drawImage(img, x, y, s, s, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.onerror = reject;
          img.src = ev.target!.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/delivery/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Upload failed"); return; }
      onUpdate(d.avatarUpdatedAt);
    } catch { setError("Failed to upload image"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 24px", borderBottom: "1px solid var(--a-border)" }}>
      <div style={{ position: "relative" }}>
        <img
          src={ts ? `/api/delivery/profile/avatar?v=${encodeURIComponent(ts)}` : ""}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex"; }}
          alt="Avatar"
          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--a-border)", display: ts ? "block" : "none" }}
        />
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--a-surface-2)", border: "2px solid var(--a-border)", display: ts ? "none" : "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "var(--a-brand)" }}>
          {me.firstName[0]?.toUpperCase()}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{me.firstName} {me.lastName}</div>
        <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 8 }}>{me.email}</div>
        <button type="button" onClick={() => ref.current?.click()} disabled={loading}
          style={{ fontSize: 12, fontWeight: 700, color: "var(--a-brand-2)", background: "none", border: "1px solid var(--a-border)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
          {loading ? "Uploading…" : "Change photo"}
        </button>
        {error ? <div style={{ fontSize: 11, color: "var(--a-danger)", marginTop: 4 }}>{error}</div> : null}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
    </div>
  );
}

function ChangePasswordSection() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (form.newPassword !== form.confirm) { setError("New passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>Change Password</div>
      {error ? <div role="alert" className="adm-alert adm-alert-error" style={{ marginBottom: 16 }}><div>{error}</div></div> : null}
      {success ? <div role="alert" className="adm-alert adm-alert-success" style={{ marginBottom: 16 }}><div>Password changed successfully.</div></div> : null}
      <form onSubmit={submit} style={{ display: "grid", gap: 14, maxWidth: 400 }}>
        <Field label="Current password" required>
          <input className="adm-input" type="password" value={form.currentPassword} onChange={set("currentPassword")} required autoComplete="current-password" />
        </Field>
        <Field label="New password" required hint="At least 8 characters">
          <input className="adm-input" type="password" value={form.newPassword} onChange={set("newPassword")} required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password" required>
          <input className="adm-input" type="password" value={form.confirm} onChange={set("confirm")} required minLength={8} autoComplete="new-password" />
        </Field>
        <div><Button variant="primary" type="submit" loading={loading}>Update password</Button></div>
      </form>
    </div>
  );
}

export default function DeliveryProfilePage() {
  const { data: me, loading } = useApi<Me>("/api/delivery/me");
  const [avatarTs, setAvatarTs] = useState<string>("");

  useEffect(() => { if (me?.avatarUpdatedAt) setAvatarTs(me.avatarUpdatedAt); }, [me]);

  if (loading || !me) return (
    <div className="adm" style={{ minHeight: "100vh", background: "var(--a-bg)", display: "grid", placeItems: "center" }}>
      <div style={{ color: "var(--a-muted)", fontSize: 14 }}>Loading…</div>
    </div>
  );

  const meWithTs = { ...me, avatarUpdatedAt: avatarTs || me.avatarUpdatedAt };

  return (
    <div className="adm" style={{ minHeight: "100vh", background: "var(--a-bg)" }}>
      <div style={{ background: "var(--a-surface)", borderBottom: "1px solid var(--a-border)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <BrandLogo height={26} />
        <div style={{ fontSize: 12, color: "var(--a-muted)", fontWeight: 700 }}>Delivery Portal</div>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/portal-delivery" style={{ fontSize: 12, fontWeight: 700, color: "var(--a-brand-2)", textDecoration: "none" }}>← Back to orders</Link>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "24px auto", padding: "0 16px 40px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>My Profile</h1>

        <div style={{ background: "var(--a-surface)", border: "1px solid var(--a-border)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <AvatarSection me={meWithTs} onUpdate={setAvatarTs} />
          <div style={{ padding: "16px 24px 0", borderBottom: "1px solid var(--a-border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 16 }}>
              <div><div style={{ fontSize: 11, color: "var(--a-muted)", fontWeight: 700, marginBottom: 2 }}>PHONE</div><div style={{ fontSize: 13 }}>{me.phone ?? "—"}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--a-muted)", fontWeight: 700, marginBottom: 2 }}>VERIFICATION</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: me.verificationStatus === "approved" ? "var(--a-success)" : me.verificationStatus === "pending" ? "var(--a-warn)" : "var(--a-danger)" }}>
                  {me.verificationStatus.charAt(0).toUpperCase() + me.verificationStatus.slice(1)}
                </div>
              </div>
            </div>
          </div>
          <ChangePasswordSection />
        </div>

        {me.verificationStatus !== "approved" && (
          <div style={{ textAlign: "center" }}>
            <Link href="/portal-delivery/register" style={{ fontSize: 13, fontWeight: 700, color: "var(--a-brand-2)" }}>
              {me.verificationStatus === "rejected" ? "Re-submit KYC documents →" : "Complete verification →"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
