"use client";
/**
 * "How was your <product>?" — once an order has been delivered, the next time the customer opens the website
 * (any page except payment / sign-in / admin) a small card asks for a star rating and a few words.
 * The review is saved in the database and shows for everyone on that product's page.
 * It appears at most once per browser session, never for items already reviewed, and "Later" / "Don't ask" are remembered.
 */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/styles/review-prompt.css";
import { useAccountSession } from "@/components/account/useAccountSession";
import { LATER_DAYS, SKIP_DAYS, nextToAsk, promptAllowedOn, withDismissal, type DismissMap, type PendingItem } from "@/lib/review-pending";

const STORE_KEY = "cv-review-dismissed";
const SESSION_KEY = "cv-review-shown";
const SHOW_DELAY_MS = 2200;

function readMap(): DismissMap {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") as DismissMap; } catch { return {}; }
}
function saveMap(m: DismissMap) { try { localStorage.setItem(STORE_KEY, JSON.stringify(m)); } catch { /* private mode */ } }

const LABELS = ["", "Not good", "Could be better", "It's okay", "Really good", "Love it"];

export function ReviewPrompt() {
  const pathname = usePathname() ?? "";
  const account = useAccountSession();
  const [queue, setQueue] = useState<PendingItem[]>([]);
  const [item, setItem] = useState<PendingItem | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const asked = useRef(false);

  // Fetch what's waiting for a review once per session, for a signed-in customer on an allowed page.
  useEffect(() => {
    if (!account.signedIn || asked.current || !promptAllowedOn(pathname)) return;
    try { if (sessionStorage.getItem(SESSION_KEY)) return; } catch { /* ignore */ }
    asked.current = true;
    const ac = new AbortController();
    fetch("/api/reviews/pending", { cache: "no-store", signal: ac.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        const items: PendingItem[] = Array.isArray(d.items) ? d.items : [];
        const first = nextToAsk(items, readMap());
        if (!first) return;
        setQueue(items);
        const t = setTimeout(() => { setItem(first); try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ } }, SHOW_DELAY_MS);
        ac.signal.addEventListener("abort", () => clearTimeout(t));
      })
      .catch(() => {});
    return () => ac.abort();
  }, [account.signedIn, pathname]);

  const reset = () => { setRating(0); setHoverStar(0); setTitle(""); setComment(""); setErr(""); setDone(false); };
  const showNext = (afterId: string, map: DismissMap) => {
    const rest = queue.filter((q) => q.productId !== afterId);
    setQueue(rest);
    const n = nextToAsk(rest, map);
    reset();
    setItem(n);
  };

  const snooze = (days: number) => {
    if (!item) return;
    const m = withDismissal(readMap(), item.productId, days);
    saveMap(m);
    setItem(null); reset();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || busy) return;
    if (!rating) { setErr("Tap a star to rate it."); return; }
    if (comment.trim().length < 10) { setErr("Please write at least 10 characters about the fit, fabric or quality."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: item.slug, rating, title: title.trim(), comment: comment.trim() }) });
      const d = await r.json().catch(() => ({}));
      // 409 = already reviewed elsewhere: treat as done so we stop asking
      if (!r.ok && r.status !== 409) throw new Error(d.error || `HTTP ${r.status}`);
      setDone(true);
      const m = withDismissal(readMap(), item.productId, SKIP_DAYS);
      saveMap(m);
      setTimeout(() => showNext(item.productId, m), 1800);
    } catch (e: any) {
      setErr(e.message || "Couldn't save your review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!item) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape" && !busy) snooze(LATER_DAYS); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [item, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;
  const shown = hoverStar || rating;
  const remaining = queue.filter((q) => q.productId !== item.productId).length;

  return (
    <aside className="rp" role="dialog" aria-modal="false" aria-labelledby="rp-title" data-testid="review-prompt">
      <button type="button" className="rp-x" onClick={() => snooze(LATER_DAYS)} aria-label="Close — ask me later">×</button>
      {done ? (
        <div className="rp-done" role="status">
          <b>Thank you!</b>
          <span>Your review is live on the {item.title} page for everyone to see.</span>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="rp-eyebrow">Delivered · order {item.orderNumber}</p>
          <div className="rp-prod">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.image ? <img src={item.image} alt="" width={56} height={70} /> : null}
            <h2 id="rp-title">How was your {item.title}?</h2>
          </div>

          <div className="rp-stars" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHoverStar(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => { setRating(n); setErr(""); }} onMouseEnter={() => setHoverStar(n)} className={shown >= n ? "on" : ""}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill={shown >= n ? "var(--color-lava)" : "none"} stroke="var(--color-navy)" strokeWidth="1.8" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </button>
            ))}
            <span className="rp-label" aria-live="polite">{LABELS[shown]}</span>
          </div>

          <input className="rp-in" aria-label="Review title (optional)" placeholder="Title (optional)" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="rp-in" aria-label="Your feedback" placeholder="Fit, fabric, quality — help others decide" rows={3} maxLength={1000} required minLength={10} value={comment} onChange={(e) => { setComment(e.target.value); setErr(""); }} />
          {err ? <p role="alert" className="rp-err">{err}</p> : null}

          <div className="rp-actions">
            <button type="submit" className="cv-btn cv-btn-navy cv-btn-sm" disabled={busy}>{busy ? "Posting…" : "Post review"}</button>
            <button type="button" className="rp-link" onClick={() => snooze(LATER_DAYS)}>Maybe later</button>
            <button type="button" className="rp-link" onClick={() => snooze(SKIP_DAYS)}>Don&apos;t ask for this</button>
          </div>
          <p className="rp-foot">{remaining > 0 ? `${remaining} more item${remaining > 1 ? "s" : ""} waiting · ` : ""}Public on <Link href={`/products/${item.slug}#reviews`}>the product page</Link>, with your first name and last initial.</p>
        </form>
      )}
    </aside>
  );
}
