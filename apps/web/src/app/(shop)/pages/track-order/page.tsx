"use client";
/**
 * Track Order Page — /pages/track-order
 * Allows customers to track their order using Order ID + Phone/Email.
 */
import React, { useState } from "react";
import Link from "next/link";

interface TrackResult {
  orderId: string;
  status: string;
  statusColor: string;
  product: string;
  placedOn: string;
  estimatedDelivery: string;
  courier: string;
  awb: string;
  timeline: { label: string; date: string; done: boolean }[];
}

// Simulated tracking result (replace with real API call)
function mockTrack(orderId: string): TrackResult | null {
  if (!orderId.toLowerCase().startsWith("cr-")) return null;
  return {
    orderId: orderId.toUpperCase(),
    status: "Out for Delivery",
    statusColor: "#C94227",
    product: "RAVEN OVERSIZED TEE — ACID BLACK (Size L)",
    placedOn: "27 Sep 2026",
    estimatedDelivery: "30 Sep 2026",
    courier: "Delhivery",
    awb: "83901237461",
    timeline: [
      { label: "Order Placed", date: "27 Sep, 10:42 AM", done: true },
      { label: "Payment Confirmed", date: "27 Sep, 10:43 AM", done: true },
      { label: "Picked Up by Courier", date: "28 Sep, 2:15 PM", done: true },
      { label: "In Transit", date: "29 Sep, 6:00 AM", done: true },
      { label: "Out for Delivery", date: "30 Sep, 9:30 AM", done: true },
      { label: "Delivered", date: "Estimated 30 Sep", done: false },
    ],
  };
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackResult | null | "not-found">(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ orderId?: string; phone?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!orderId.trim()) e.orderId = "Order ID is required";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1000));
    const res = mockTrack(orderId.trim());
    setResult(res ?? "not-found");
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          backgroundColor: "#172545",
          padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "0.75rem",
          }}
        >
          CULTRAVEN
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(2.5rem,6vw,5rem)",
            fontWeight: 600,
            color: "#F5F1E8",
            lineHeight: 1,
          }}
        >
          Track Your Order
        </h1>
      </div>

      <div
        style={{
          padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,5rem)",
          maxWidth: "640px",
        }}
      >
        {/* Track form */}
        <form onSubmit={handleTrack} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div>
              <label
                htmlFor="track-order-id"
                style={{
                  display: "block",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#172545",
                  marginBottom: "0.5rem",
                }}
              >
                Order ID
              </label>
              <input
                id="track-order-id"
                type="text"
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setErrors((prev) => ({ ...prev, orderId: undefined }));
                }}
                placeholder="e.g. CR-89242"
                aria-describedby={errors.orderId ? "track-order-id-error" : undefined}
                aria-invalid={!!errors.orderId}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  border: `1.5px solid ${errors.orderId ? "#C94227" : "#D9D3C4"}`,
                  backgroundColor: "#FFFFFF",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.9rem",
                  color: "#172545",
                  outline: "none",
                }}
              />
              {errors.orderId && (
                <p id="track-order-id-error" role="alert" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#C94227", marginTop: "0.35rem" }}>
                  {errors.orderId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="track-phone"
                style={{
                  display: "block",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#172545",
                  marginBottom: "0.5rem",
                }}
              >
                Phone Number
              </label>
              <input
                id="track-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="10-digit mobile number"
                aria-describedby={errors.phone ? "track-phone-error" : undefined}
                aria-invalid={!!errors.phone}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  border: `1.5px solid ${errors.phone ? "#C94227" : "#D9D3C4"}`,
                  backgroundColor: "#FFFFFF",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.9rem",
                  color: "#172545",
                  outline: "none",
                }}
              />
              {errors.phone && (
                <p id="track-phone-error" role="alert" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#C94227", marginTop: "0.35rem" }}>
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "1.1rem",
              backgroundColor: "#172545",
              color: "#F5F1E8",
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "0.82rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            {loading ? "TRACKING..." : "TRACK ORDER"}
          </button>
        </form>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.75rem",
            color: "#6B7280",
            marginTop: "1rem",
            lineHeight: 1.6,
          }}
        >
          Your Order ID can be found in your confirmation email or under{" "}
          <Link href="/account/orders" style={{ color: "#172545", fontWeight: 700, textDecoration: "underline" }}>
            My Orders
          </Link>{" "}
          in your account.
        </p>

        {/* Result: Not found */}
        {result === "not-found" && (
          <div
            role="alert"
            style={{
              marginTop: "2rem",
              backgroundColor: "#EAE6DB",
              padding: "1.5rem",
              borderLeft: "3px solid #C94227",
            }}
          >
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#172545",
                marginBottom: "0.5rem",
              }}
            >
              Order not found
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.82rem",
                color: "#4B5563",
                lineHeight: 1.6,
              }}
            >
              We couldn&apos;t find an order with these details. Please double-check your Order ID and phone number. Need help?{" "}
              <a href="/pages/contact" style={{ color: "#C94227", fontWeight: 700, textDecoration: "underline" }}>
                Contact us
              </a>
              .
            </p>
          </div>
        )}

        {/* Result: Found */}
        {result && result !== "not-found" && (
          <div style={{ marginTop: "2.5rem" }}>
            {/* Status card */}
            <div
              style={{
                backgroundColor: "#172545",
                padding: "1.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(245,241,232,0.5)",
                      marginBottom: "4px",
                    }}
                  >
                    Order
                  </p>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "#F5F1E8",
                    }}
                  >
                    {result.orderId}
                  </p>
                </div>
                <span
                  style={{
                    backgroundColor: result.statusColor,
                    color: "#FFFFFF",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "0.62rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "5px 12px",
                  }}
                >
                  {result.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {[
                  { label: "Product", value: result.product },
                  { label: "Placed On", value: result.placedOn },
                  { label: "Est. Delivery", value: result.estimatedDelivery },
                  { label: "Courier", value: `${result.courier} — AWB: ${result.awb}` },
                ].map((r) => (
                  <div key={r.label}>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(245,241,232,0.45)",
                        marginBottom: "3px",
                      }}
                    >
                      {r.label}
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.78rem",
                        color: "rgba(245,241,232,0.85)",
                        lineHeight: 1.5,
                      }}
                    >
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <h2
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#172545",
                marginBottom: "1.25rem",
              }}
            >
              Shipment Timeline
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {result.timeline.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    position: "relative",
                  }}
                >
                  {/* Dot + line */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        backgroundColor: step.done ? "#172545" : "#D9D3C4",
                        border: step.done ? "2px solid #172545" : "2px solid #D9D3C4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "4px",
                      }}
                    >
                      {step.done && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#F5F1E8" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {i < result.timeline.length - 1 && (
                      <div
                        style={{
                          width: "2px",
                          flex: 1,
                          minHeight: "28px",
                          backgroundColor: step.done ? "#172545" : "#D9D3C4",
                          marginBlock: "4px",
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ paddingBottom: i < result.timeline.length - 1 ? "1rem" : 0 }}>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: step.done ? 700 : 500,
                        fontSize: "0.85rem",
                        color: step.done ? "#172545" : "#9CA3AF",
                      }}
                    >
                      {step.label}
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.72rem",
                        color: "#9CA3AF",
                        marginTop: "2px",
                      }}
                    >
                      {step.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
