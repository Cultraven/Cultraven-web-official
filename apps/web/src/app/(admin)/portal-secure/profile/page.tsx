"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Field, PageHeader, useApi, useToast } from "@/components/admin/ui";

type Me = { role: string; name: string; userId: string; avatarUpdatedAt?: string | null };

function AvatarSection({ me, onUpdate }: { me: Me; onUpdate: (ts: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const ts = me.avatarUpdatedAt ?? "";
  const isSuperEnv = me.userId === "env-admin";

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
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
            const ox = (img.width - s) / 2, oy = (img.height - s) / 2;
            ctx.drawImage(img, ox, oy, s, s, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.onerror = reject;
          img.src = ev.target!.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const d = await res.json();
      if (!res.ok) { toast(d.error ?? "Upload failed", "error"); return; }
      toast("Profile photo updated", "success");
      onUpdate(d.avatarUpdatedAt);
    } catch { toast("Failed to upload image", "error"); }
    finally { setLoading(false); }
  };

  const remove = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/profile/avatar", { method: "DELETE" });
      toast("Photo removed", "success");
      onUpdate("");
    } catch { toast("Failed to remove photo", "error"); }
    finally { setLoading(false); }
  };

  return (
    <Card pad>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>Profile Photo</div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={ts ? `/api/admin/profile/avatar?v=${encodeURIComponent(ts)}` : ""}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex"; }}
            alt="Profile"
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--a-border)", display: ts ? "block" : "none" }}
          />
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--a-brand)", border: "2px solid var(--a-border)", display: ts ? "none" : "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff" }}>
            {me.name[0]?.toUpperCase() ?? "A"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{me.name}</div>
          <div style={{ fontSize: 12, color: "var(--a-muted)", marginBottom: 12 }}>{me.role === "superadmin" ? "Super Admin" : "Admin"}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => ref.current?.click()} disabled={loading}
              style={{ fontSize: 12, fontWeight: 700, color: "var(--a-brand-2)", background: "var(--a-surface-2)", border: "1px solid var(--a-border)", borderRadius: 6, padding: "5px 14px", cursor: "pointer" }}>
              {loading ? "Uploading…" : "Change photo"}
            </button>
            {ts ? <button type="button" onClick={remove} disabled={loading} style={{ fontSize: 12, color: "var(--a-danger)", background: "none", border: "none", cursor: "pointer" }}>Remove</button> : null}
          </div>
        </div>
        <input ref={ref} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
      </div>
      {isSuperEnv ? (
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--a-muted)", lineHeight: 1.5 }}>
          Note: Your password is managed via environment variables (<code>ADMIN_PASSWORD</code>) and cannot be changed here.
        </p>
      ) : null}
    </Card>
  );
}

function ChangePasswordSection({ isSuperEnv }: { isSuperEnv: boolean }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isSuperEnv) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast("Passwords do not match", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const d = await res.json();
      if (!res.ok) { toast(d.error ?? "Failed", "error"); return; }
      toast("Password changed", "success");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch { toast("Network error", "error"); }
    finally { setLoading(false); }
  };

  return (
    <Card pad>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>Change Password</div>
      <form onSubmit={submit} style={{ display: "grid", gap: 14, maxWidth: 420 }}>
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
    </Card>
  );
}

export default function AdminProfilePage() {
  const { data: me, loading } = useApi<Me>("/api/admin/me");
  const [avatarTs, setAvatarTs] = useState<string>("");

  useEffect(() => { if (me?.avatarUpdatedAt) setAvatarTs(me.avatarUpdatedAt); }, [me]);

  if (loading || !me) return null;

  const meWithTs = { ...me, avatarUpdatedAt: avatarTs || me.avatarUpdatedAt || "" };

  return (
    <>
      <PageHeader eyebrow="Settings" title="My Profile" description="Update your profile photo and password." >
        <div />
      </PageHeader>
      <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
        <AvatarSection me={meWithTs as Me} onUpdate={setAvatarTs} />
        <ChangePasswordSection isSuperEnv={me.userId === "env-admin"} />
      </div>
    </>
  );
}
