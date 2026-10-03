"use client";
import React, { useState } from "react";
import { Badge, Button, Card, EmptyState, Field, PageHeader, TableSkeleton, useApi, useConfirm, useToast } from "@/components/admin/ui";

type KycDoc = { phone: string; address: string; city: string; state: string; pincode: string; aadhaarNumber: string; panNumber: string; submittedAt: string; selfieDataUrl?: string; aadhaarFrontDataUrl?: string; aadhaarBackDataUrl?: string; panDataUrl?: string } | null;
type Partner = { id: string; fullName: string; email: string; phone: string | null; verificationStatus: string; verificationNote: string | null; createdAt: string; kyc: { phone: string; address: string; city: string; state: string; pincode: string; panNumber: string; submittedAt: string } | null };

const STATUS_TONES: Record<string, "neutral" | "info" | "success" | "danger" | "warn"> = {
  unverified: "neutral", pending: "warn", approved: "success", rejected: "danger",
};

function fmtDate(s: string) {
  return s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function DocImage({ src, label }: { src?: string; label: string }) {
  if (!src) return <div style={{ background: "var(--a-surface-2)", border: "1px dashed var(--a-border)", borderRadius: 6, padding: "12px", textAlign: "center", fontSize: 11, color: "var(--a-muted)" }}>No {label}</div>;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", marginBottom: 4 }}>{label}</div>
      <img src={src} alt={label} style={{ width: "100%", borderRadius: 6, border: "1px solid var(--a-border)", objectFit: "contain", maxHeight: 160 }} />
    </div>
  );
}

function PartnerDrawer({ partner, onClose, onDecision }: { partner: Partner; onClose: () => void; onDecision: () => void }) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [kyc, setKyc] = useState<KycDoc>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [note, setNote] = useState(partner.verificationNote ?? "");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    fetch(`/api/admin/delivery/${partner.id}/verify`)
      .then((r) => r.json())
      .then((d) => { setKyc(d.kyc); })
      .finally(() => setKycLoading(false));
  }, [partner.id]);

  const decide = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !note.trim()) {
      toast("Please enter a rejection reason", "error"); return;
    }
    const label = decision === "approved" ? "Approve" : "Reject";
    const ok = await confirm({ title: `${label} ${partner.fullName}?`, message: decision === "rejected" ? `The rejection reason will be emailed: "${note}"` : "This will grant full delivery portal access.", confirmLabel: label, danger: decision === "rejected" });
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/delivery/${partner.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      const d = await res.json();
      if (!res.ok) { toast(d.error ?? "Failed", "error"); return; }
      toast(`${partner.fullName} ${decision}`, "success");
      onDecision();
      onClose();
    } catch { toast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="adm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--a-surface)", border: "1px solid var(--a-border)", borderRadius: 14, width: "min(640px, 100%)", maxHeight: "92dvh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: "1px solid var(--a-border)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{partner.fullName}</div>
            <div style={{ fontSize: 12, color: "var(--a-muted)" }}>{partner.email}</div>
          </div>
          <Badge tone={STATUS_TONES[partner.verificationStatus] ?? "neutral"}>{partner.verificationStatus}</Badge>
          <button onClick={onClose} style={{ width: 28, height: 28, display: "grid", placeItems: "center", background: "var(--a-surface-2)", border: "1px solid var(--a-border)", borderRadius: 6, cursor: "pointer", fontSize: 16, color: "var(--a-muted)" }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {kycLoading ? <TableSkeleton rows={3} cols={2} /> : !kyc ? (
            <EmptyState title="No KYC submitted" description="This partner hasn't submitted their documents yet." />
          ) : (
            <>
              {/* Basic info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[["Phone", kyc.phone], ["PAN", kyc.panNumber], ["Aadhaar", kyc.aadhaarNumber], ["Submitted", fmtDate(kyc.submittedAt)], ["Address", `${kyc.address}, ${kyc.city}, ${kyc.state} - ${kyc.pincode}`]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Photos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <DocImage src={kyc.selfieDataUrl} label="Selfie" />
                <DocImage src={kyc.aadhaarFrontDataUrl} label="Aadhaar front" />
                <DocImage src={kyc.aadhaarBackDataUrl} label="Aadhaar back" />
                <DocImage src={kyc.panDataUrl} label="PAN card" />
              </div>
            </>
          )}

          {/* Rejection note */}
          <Field label="Note / rejection reason" hint="Required when rejecting; will be emailed to the partner">
            <textarea
              className="adm-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Document image is unclear, please re-upload"
              style={{ resize: "vertical" }}
            />
          </Field>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "14px 24px", borderTop: "1px solid var(--a-border)", background: "var(--a-surface-2)" }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="danger" onClick={() => decide("rejected")} loading={submitting}>Reject</Button>
          <Button variant="primary" onClick={() => decide("approved")} loading={submitting}>Approve ✓</Button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryVerificationPage() {
  const { data, loading, reload } = useApi<{ partners: Partner[] }>("/api/admin/delivery/pending");
  const [selected, setSelected] = useState<Partner | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "unverified">("pending");

  const partners = data?.partners ?? [];
  const shown = filter === "all" ? partners : partners.filter((p) => p.verificationStatus === filter);

  const counts = partners.reduce((acc, p) => { acc[p.verificationStatus] = (acc[p.verificationStatus] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <>
      {selected ? <PartnerDrawer partner={selected} onClose={() => setSelected(null)} onDecision={reload} /> : null}

      <PageHeader eyebrow="Store" title="Delivery Verification" description="Review and approve delivery partner KYC documents.">
        <div />
      </PageHeader>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", "pending", "approved", "rejected", "unverified"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.1s",
              background: filter === f ? "var(--a-brand)" : "var(--a-surface)",
              color: filter === f ? "var(--a-surface)" : "var(--a-text)",
              borderColor: filter === f ? "var(--a-brand)" : "var(--a-border)",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] !== undefined && f !== "all" ? ` (${counts[f]})` : f === "all" ? ` (${partners.length})` : ""}
          </button>
        ))}
      </div>

      <Card pad={false}>
        {loading ? <TableSkeleton rows={5} cols={4} /> : shown.length === 0 ? (
          <EmptyState title={filter === "pending" ? "No pending verifications" : "No partners"} description="Nothing to review right now." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name / Email</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th><span style={{ position: "absolute", left: -9999 }}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.fullName}</div>
                      <div style={{ fontSize: 12, color: "var(--a-muted)" }}>{p.email}</div>
                    </td>
                    <td><Badge tone={STATUS_TONES[p.verificationStatus] ?? "neutral"}>{p.verificationStatus}</Badge></td>
                    <td style={{ fontSize: 12, color: "var(--a-muted)" }}>{p.kyc ? fmtDate(p.kyc.submittedAt) : "—"}</td>
                    <td>
                      <Button size="sm" onClick={() => setSelected(p)}>
                        {p.verificationStatus === "pending" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
