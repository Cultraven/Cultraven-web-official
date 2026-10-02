"use client";
/**
 * Customer reviews for one product. Everything comes from MongoDB via /api/reviews.
 * Only signed-in customers who bought the product see the form (the server enforces it too).
 */
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Review { id: string; name: string; rating: number; title: string; comment: string; size: string; createdAt: string }
interface Data { count: number; rating: number; signedIn: boolean; canReview: boolean; hasReviewed: boolean; reviews: Review[] }

const date = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-label={`${value} out of 5`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < Math.round(value) ? "var(--color-lava)" : "none"} stroke="var(--color-navy)" strokeWidth="1.8" strokeLinejoin="miter" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

export function ProductReviews({ slug, onSummary }: { slug: string; onSummary?: (rating: number, count: number) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setData(d);
      onSummary?.(d.rating, d.count);
    } catch (e: any) {
      setError(e.message);
    }
  }, [slug, onSummary]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!rating) { setFormError("Please pick a star rating."); return; }
    if (comment.trim().length < 10) { setFormError("Please write at least 10 characters."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, rating, title, comment }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setRating(0); setTitle(""); setComment("");
      await load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="reviews" className="rv">
      <h2 className="rv-h">Customer reviews</h2>

      {error ? <p role="alert" className="rv-msg">Couldn&apos;t load reviews right now. Please refresh.</p> : null}

      {data && data.count > 0 ? (
        <div className="rv-sum">
          <b className="rv-big">{data.rating.toFixed(1)}</b>
          <div>
            <Stars value={data.rating} size={18} />
            <p className="rv-based">Based on {data.count} review{data.count === 1 ? "" : "s"}</p>
          </div>
        </div>
      ) : null}

      {data && data.canReview ? (
        <form onSubmit={submit} className="rv-form" id="write-review" noValidate>
          <h3>You bought this — how is it?</h3>
          <div className="rv-pick" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className={rating >= n ? "on" : ""}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill={rating >= n ? "var(--color-lava)" : "none"} stroke="var(--color-navy)" strokeWidth="1.8" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </button>
            ))}
          </div>
          <input aria-label="Review title (optional)" placeholder="Title (optional)" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea aria-label="Your review" placeholder="Fit, fabric, quality — tell others what you think" rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
          {formError ? <p role="alert" className="rv-err">{formError}</p> : null}
          <button type="submit" disabled={busy} className="cv-btn cv-btn-navy">{busy ? "Posting…" : "Post review"}</button>
        </form>
      ) : data && data.hasReviewed ? (
        <p className="rv-note">Thanks — you&apos;ve reviewed this product.</p>
      ) : data && !data.signedIn ? (
        <p className="rv-note">Bought this? <Link href={`/login?next=${encodeURIComponent(`/products/${slug}#reviews`)}`}>Sign in</Link> to share your feedback.</p>
      ) : data ? (
        <p className="rv-note">Reviews are from verified buyers. Order this piece to leave yours.</p>
      ) : null}

      {data && data.count === 0 ? <p className="rv-msg">No reviews yet — be the first after your order arrives.</p> : null}

      <div className="rv-list">
        {data?.reviews.map((r) => (
          <article key={r.id} className="rv-card">
            <div className="rv-top"><Stars value={r.rating} size={14} /><small>{date(r.createdAt)}</small></div>
            {r.title ? <h4>{r.title}</h4> : null}
            <p>{r.comment}</p>
            <small className="rv-by"><b>{r.name}</b> · Verified purchase{r.size ? ` · ${r.size}` : ""}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
