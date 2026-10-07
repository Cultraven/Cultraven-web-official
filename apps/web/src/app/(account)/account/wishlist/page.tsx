"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "@/components/common/CmsImage";
import { useWishlistStore } from "@/store/wishlist";

const inr = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export default function WishlistPage() {
  // persisted in the browser — render after mount so server and client HTML match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const list = mounted ? items : [];

  return (
    <>
      <header className="acct-head">
        <span className="acct-eyebrow">My account</span>
        <h1 className="acct-title">Wishlist</h1>
        <p className="acct-sub">{mounted ? `${list.length} saved piece${list.length === 1 ? "" : "s"}` : "Your saved pieces"}. Tap the heart on any product to add it here.</p>
      </header>

      {mounted && list.length === 0 ? (
        <div className="acct-card">
          <div className="acct-empty">
            <div className="acct-empty-ic">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
            </div>
            <h3>Your wishlist is empty</h3>
            <p>Save the items you love and come back when you&apos;re ready.</p>
            <Link href="/collections/all" className="cv-btn cv-btn-navy">
              Explore new arrivals
              <svg className="cv-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="acct-wish-grid">
          {list.map((p) => (
            <article key={p.id} className="acct-wish">
              <div className="acct-wish-img">
                <button type="button" className="acct-wish-x" onClick={() => remove(p.id)} aria-label={`Remove ${p.title} from wishlist`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
                <Link href={p.href}><Image src={p.image} alt={p.title} fill sizes="(max-width: 600px) 50vw, 240px" style={{ objectFit: "cover" }} /></Link>
              </div>
              <div className="acct-wish-b">
                <b>{p.title}</b>
                <span style={{ color: "var(--color-navy)", fontWeight: 800 }}>{inr(p.pricePaise)}{p.mrpPaise && p.mrpPaise > p.pricePaise ? <s style={{ color: "var(--color-smoke)", fontWeight: 600, marginLeft: 8, fontSize: "0.8rem" }}>{inr(p.mrpPaise)}</s> : null}</span>
                <Link href={p.href} className="cv-btn cv-btn-navy cv-btn-sm cv-btn-block" style={{ marginTop: 6 }}>View product</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
