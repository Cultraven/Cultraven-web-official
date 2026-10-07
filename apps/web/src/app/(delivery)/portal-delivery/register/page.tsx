"use client";
import { BrandLogo } from "@/components/common/BrandLogo";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "@/components/admin/admin.css";
import { Button, Field } from "@/components/admin/ui";

const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;

function resizeImage(file: File, maxPx = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUpload({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--a-text)" }}>
        {label}{required ? <span style={{ color: "var(--a-danger)" }}> *</span> : <span style={{ color: "var(--a-muted)", fontWeight: 400 }}> (optional)</span>}
      </div>
      <div
        onClick={() => ref.current?.click()}
        style={{ border: "2px dashed var(--a-border-strong)", borderRadius: 8, padding: "12px", textAlign: "center", cursor: "pointer", background: value ? "var(--a-surface)" : "var(--a-surface-2)", minHeight: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--a-brand-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--a-border-strong)")}
      >
        {loading ? (
          <span style={{ fontSize: 12, color: "var(--a-muted)" }}>Processing…</span>
        ) : value ? (
          <img src={value} alt={label} style={{ maxHeight: 80, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }} />
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--a-faint)" }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span style={{ fontSize: 12, color: "var(--a-muted)" }}>Click to upload photo</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
      {value ? (
        <button type="button" onClick={() => onChange("")} style={{ fontSize: 11, color: "var(--a-danger)", background: "none", border: "none", cursor: "pointer", padding: "2px 0", marginTop: 2 }}>Remove</button>
      ) : null}
    </div>
  );
}

export default function DeliveryRegisterPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    phone: "", address: "", city: "", state: "", pincode: "",
    aadhaarNumber: "", panNumber: "",
    selfieDataUrl: "", aadhaarFrontDataUrl: "", aadhaarBackDataUrl: "", panDataUrl: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    fetch("/api/delivery/me").then((r) => r.json()).then((d) => {
      if (d.error) { router.replace("/portal-delivery-access"); return; }
      setMe(d);
      // Pre-fill existing KYC if any
      fetch("/api/delivery/register").then((r) => r.json()).then((kd) => {
        if (kd.kyc) {
          setForm((f) => ({
            ...f,
            phone: kd.kyc.phone ?? "",
            address: kd.kyc.address ?? "",
            city: kd.kyc.city ?? "",
            state: kd.kyc.state ?? "",
            pincode: kd.kyc.pincode ?? "",
            panNumber: kd.kyc.panNumber ?? "",
          }));
        }
      });
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.aadhaarNumber.length !== 12) { setError("Aadhaar number must be 12 digits"); return; }
    if (!PAN_RE.test(form.panNumber.toUpperCase())) { setError("PAN must be in the format ABCDE1234F"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/delivery/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, panNumber: form.panNumber.toUpperCase() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Submission failed"); return; }
      setSuccess(true);
      setTimeout(() => router.replace("/portal-delivery"), 2500);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  if (!me) return <div className="adm" style={{ minHeight: "100vh", background: "var(--a-bg)", display: "grid", placeItems: "center" }}><div style={{ color: "var(--a-muted)", fontSize: 14 }}>Loading…</div></div>;

  if (success) return (
    <div className="adm" style={{ minHeight: "100vh", background: "var(--a-bg)", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Documents submitted!</h2>
        <p style={{ fontSize: 14, color: "var(--a-muted)", lineHeight: 1.6 }}>Your KYC is under review. You'll receive an email once it's verified. Redirecting…</p>
      </div>
    </div>
  );

  return (
    <div className="adm" style={{ minHeight: "100vh", background: "var(--a-bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--a-surface)", borderBottom: "2px solid var(--a-border)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <BrandLogo height={26} />
        <div style={{ fontSize: 12, color: "var(--a-muted)", fontWeight: 700 }}>Delivery Portal</div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 40px" }}>
        {/* Status banner for rejected */}
        {me.verificationStatus === "rejected" && me.verificationNote ? (
          <div role="alert" className="adm-alert adm-alert-error" style={{ marginBottom: 20 }}>
            <div><b>Verification rejected.</b> Reason: {me.verificationNote}<br /><span style={{ fontSize: 12 }}>Please correct the issue and re-submit.</span></div>
          </div>
        ) : null}

        <div style={{ background: "var(--a-surface)", border: "1px solid var(--a-border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--a-border)", background: "var(--a-surface-2)" }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>Complete Your Verification</h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--a-muted)", lineHeight: 1.5 }}>
              Hi {me.firstName}! Submit your KYC documents to get full access to the Delivery Portal. All information is kept confidential.
            </p>
          </div>

          <form onSubmit={submit} style={{ padding: "24px" }}>
            {error ? <div role="alert" className="adm-alert adm-alert-error" style={{ marginBottom: 20 }}><div>{error}</div></div> : null}

            {/* Section 1 — Contact */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--a-muted)", marginBottom: 12 }}>Contact & Address</div>
              <div style={{ display: "grid", gap: 14 }}>
                <Field label="Mobile number" required>
                  <input className="adm-input" value={form.phone} onChange={set("phone")} required pattern="\d{10}" placeholder="10-digit number" inputMode="tel" maxLength={10} />
                </Field>
                <Field label="Full address" required>
                  <input className="adm-input" value={form.address} onChange={set("address")} required placeholder="House / building, street" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 12 }}>
                  <Field label="City" required>
                    <input className="adm-input" value={form.city} onChange={set("city")} required placeholder="Mumbai" />
                  </Field>
                  <Field label="State" required>
                    <input className="adm-input" value={form.state} onChange={set("state")} required placeholder="Maharashtra" />
                  </Field>
                  <Field label="Pincode" required>
                    <input className="adm-input" value={form.pincode} onChange={set("pincode")} required pattern="\d{6}" placeholder="400001" inputMode="numeric" maxLength={6} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Section 2 — IDs */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--a-muted)", marginBottom: 12 }}>Identity Documents</div>
              <div style={{ display: "grid", gap: 14 }}>
                <Field label="Aadhaar number (12 digits)" required hint="Your 12-digit Aadhaar number — never stored visibly">
                  <input className="adm-input" value={form.aadhaarNumber} onChange={set("aadhaarNumber")} required pattern="\d{12}" placeholder="XXXXXXXXXXXX" inputMode="numeric" maxLength={12} type="password" autoComplete="off" />
                </Field>
                <Field label="PAN number" required hint="e.g. ABCDE1234F">
                  <input className="adm-input" value={form.panNumber} onChange={(e) => setForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))} required placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: "uppercase", letterSpacing: "0.1em" }} />
                </Field>
              </div>
            </div>

            {/* Section 3 — Photo uploads */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--a-muted)", marginBottom: 12 }}>Photo Uploads</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <ImageUpload label="Your selfie" required value={form.selfieDataUrl} onChange={(v) => setForm((f) => ({ ...f, selfieDataUrl: v }))} />
                <ImageUpload label="Aadhaar (front)" required value={form.aadhaarFrontDataUrl} onChange={(v) => setForm((f) => ({ ...f, aadhaarFrontDataUrl: v }))} />
                <ImageUpload label="Aadhaar (back)" value={form.aadhaarBackDataUrl} onChange={(v) => setForm((f) => ({ ...f, aadhaarBackDataUrl: v }))} />
                <ImageUpload label="PAN card" required value={form.panDataUrl} onChange={(v) => setForm((f) => ({ ...f, panDataUrl: v }))} />
              </div>
              <p style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 8, lineHeight: 1.5 }}>Images are resized automatically. Max 500 KB each. JPEG, PNG or WebP accepted.</p>
            </div>

            <Button variant="primary" type="submit" loading={loading} style={{ width: "100%", height: 44 }}>
              {loading ? "Submitting…" : "Submit for verification"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
