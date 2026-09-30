/**
 * ChatWidget — WhatsApp + Instagram popup + simple RAG chatbot.
 *
 * Per PDF requirement:
 * - Floating button bottom-right
 * - On click: popup with "Chat with us" → Instagram & WhatsApp options
 * - A simple chat tab for FAQ chatbot
 */
"use client";

import React, { useState, useRef, useEffect } from "react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";
const INSTAGRAM_HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "cultraven";

// ── Simple FAQ chatbot knowledge base ────────────────────────────────────────
const FAQ: { patterns: string[]; answer: string }[] = [
  {
    patterns: ["shipping", "delivery", "ship", "deliver", "how long"],
    answer:
      "We offer free shipping on orders above ₹1,999. Standard delivery takes 4–6 business days. Express delivery (₹199 extra) takes 2–3 business days.",
  },
  {
    patterns: ["return", "exchange", "refund", "size wrong", "wrong size"],
    answer:
      "Easy 7-day returns! Items must be unworn with original tags. For exchanges, you have 15 days. Initiate returns from your account dashboard.",
  },
  {
    patterns: ["size", "sizing", "fit", "measurements", "guide"],
    answer:
      "Our tees are OVERSIZED FIT — drop 1-2 sizes from your regular size. M fits chest ~46\", length ~29\". Check our Size Guide page for full measurements.",
  },
  {
    patterns: ["cod", "cash on delivery", "pay on delivery"],
    answer:
      "Yes! COD is available on orders up to ₹5,000 in select pincodes. A ₹49 COD handling charge applies. Check availability at checkout.",
  },
  {
    patterns: ["track", "tracking", "where is my order", "order status"],
    answer:
      'You can track your order from your account dashboard under "My Orders", or use the tracking link sent via SMS and email after dispatch.',
  },
  {
    patterns: ["gsm", "fabric", "material", "cotton", "quality", "weight"],
    answer:
      "All CULTRAVEN tees are made from 260 GSM 100% combed ring-spun cotton — pre-shrunk and garment washed for a premium feel.",
  },
  {
    patterns: ["payment", "upi", "card", "razorpay", "pay", "method"],
    answer:
      "We accept UPI (Google Pay, PhonePe, Paytm), all Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery.",
  },
  {
    patterns: ["cancel", "cancellation"],
    answer:
      "Orders can be cancelled within 30 minutes of placing. After that, please initiate a return after delivery.",
  },
  {
    patterns: ["contact", "email", "phone", "support", "help", "customer care"],
    answer:
      "Our support team is available Mon–Sat, 10 AM – 6 PM IST. Reach us via WhatsApp, Instagram DM, or email at support@cultraven.com.",
  },
];

function getBotAnswer(input: string): string {
  const lower = input.toLowerCase();
  for (const faq of FAQ) {
    if (faq.patterns.some((p) => lower.includes(p))) {
      return faq.answer;
    }
  }
  return "I'd be happy to help! For detailed assistance, please reach us directly on WhatsApp or Instagram DM — our team responds within 1 hour during business hours.";
}

interface Message {
  id: string;
  from: "user" | "bot";
  text: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"channels" | "chat">("channels");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "bot",
      text: "Hi! I'm CULTR, your CULTRAVEN assistant. Ask me anything about sizing, shipping, returns, or our products! 🦅",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && tab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, tab]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: getBotAnswer(text),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom) + 88px)",
          right: "1.25rem",
          zIndex: 9990,
        }}
      >
        {!open && (
          <span
            style={{
              position: "absolute",
              inset: "-4px",
              border: "2px solid var(--color-lava)",
              animation: "chatPulse 2.4s ease-out infinite",
              pointerEvents: "none",
            }}
          />
        )}
        <button
          id="chat-widget-toggle"
          aria-label={open ? "Close support" : "Open chat support"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={{
            height: "52px",
            paddingInline: "1.25rem",
            borderRadius: "0px",
            backgroundColor: "var(--color-navy)",
            color: "var(--color-cream)",
            border: "2px solid var(--color-navy)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            boxShadow: "4px 4px 0px 0px var(--color-lava)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            whiteSpace: "nowrap",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0px 0px var(--color-lava)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(0,0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px 0px var(--color-lava)";
          }}
        >
          {open ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}>CLOSE</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}>NEED HELP?</span>
            </>
          )}
        </button>
      </div>

      {/* ── Popup panel ── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat support"
          style={{
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom) + 152px)",
            right: "1.25rem",
            zIndex: 9989,
            width: "360px",
            maxWidth: "calc(100vw - 2rem)",
            backgroundColor: "var(--color-bone)",
            border: "2px solid var(--color-navy)",
            boxShadow: "6px 6px 0px 0px var(--color-navy)",
            borderRadius: "0px",
            overflow: "hidden",
            animation: "slideUpFade 0.22s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "var(--color-navy)",
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-cream)",
                  marginBottom: "2px",
                }}
              >
                Chat with us
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.7rem",
                  color: "rgba(245,241,232,0.65)",
                }}
              >
                How can we help you today?
              </p>
            </div>

            {/* Tab toggle */}
            <div style={{ display: "flex", gap: "4px" }}>
              {(["channels", "chat"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    backgroundColor: tab === t ? "var(--color-lava)" : "rgba(245,241,232,0.15)",
                    color: "var(--color-cream)",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {t === "channels" ? "Contact" : "Chat"}
                </button>
              ))}
            </div>
          </div>

          {/* Tab: Contact Channels */}
          {tab === "channels" && (
            <div style={{ padding: "1.25rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.75rem",
                  color: "var(--color-smoke)",
                  marginBottom: "1rem",
                  lineHeight: 1.5,
                }}
              >
                Connect with us directly on your preferred platform:
              </p>

              {/* Instagram */}
              <a
                href={`https://www.instagram.com/${INSTAGRAM_HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                id="chat-instagram-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  border: "1.5px solid #E5E7EB",
                  marginBottom: "0.75rem",
                  borderRadius: "3px",
                  textDecoration: "none",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "#E1306C";
                  el.style.backgroundColor = "#FFF5F8";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "#E5E7EB";
                  el.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  {/* Instagram gradient icon */}
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="#FFFFFF" stroke="none" />
                    </svg>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: "var(--color-navy)",
                        marginBottom: "2px",
                      }}
                    >
                      Let&apos;s talk on Instagram
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.7rem",
                        color: "var(--color-smoke)",
                      }}
                    >
                      @{INSTAGRAM_HANDLE}
                    </p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20CULTRAVEN%2C%20I%20need%20help%20with`}
                target="_blank"
                rel="noopener noreferrer"
                id="chat-whatsapp-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "3px",
                  textDecoration: "none",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "#25D366";
                  el.style.backgroundColor = "#F0FFF4";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "#E5E7EB";
                  el.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      backgroundColor: "#25D366",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: "var(--color-navy)",
                        marginBottom: "2px",
                      }}
                    >
                      Let&apos;s talk on WhatsApp
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.7rem",
                        color: "var(--color-smoke)",
                      }}
                    >
                      Typically replies within 1 hour
                    </p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>

              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.68rem",
                  color: "#9CA3AF",
                  textAlign: "center",
                  marginTop: "1rem",
                }}
              >
                Or try our AI assistant →{" "}
                <button
                  onClick={() => setTab("chat")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-navy)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.68rem",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Chat with CULTR
                </button>
              </p>
            </div>
          )}

          {/* Tab: Chat */}
          {tab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "380px" }}>
              {/* Messages */}
              <div
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg.from === "bot" && (
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-navy)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "0.5rem",
                          flexShrink: 0,
                          fontSize: "12px",
                        }}
                      >
                        🦅
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: msg.from === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                        backgroundColor: msg.from === "user" ? "var(--color-navy)" : "var(--color-cream)",
                        color: msg.from === "user" ? "var(--color-cream)" : "var(--color-navy)",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.82rem",
                        lineHeight: 1.55,
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "2.5rem" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "#9CA3AF",
                          animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderTop: "1px solid #E5E7EB",
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about sizing, shipping, returns..."
                  aria-label="Chat message"
                  style={{
                    flex: 1,
                    padding: "0.625rem 0.875rem",
                    border: "1.5px solid #E5E7EB",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.82rem",
                    color: "var(--color-navy)",
                    outline: "none",
                    borderRadius: "3px",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || typing}
                  aria-label="Send message"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "3px",
                    backgroundColor: input.trim() && !typing ? "var(--color-navy)" : "#E5E7EB",
                    border: "none",
                    cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={input.trim() && !typing ? "var(--color-cream)" : "#9CA3AF"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Quick questions */}
              <div
                style={{
                  padding: "0 1rem 0.75rem",
                  display: "flex",
                  gap: "0.4rem",
                  flexWrap: "wrap",
                }}
              >
                {["Shipping?", "Return policy?", "Sizing?", "COD?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                    }}
                    style={{
                      padding: "3px 10px",
                      backgroundColor: "var(--color-stone)",
                      border: "2px solid var(--color-navy)",
                      borderRadius: "0px",
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "var(--color-navy)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </>
  );
}
