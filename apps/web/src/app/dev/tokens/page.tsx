import React from "react";
import Link from "next/link";

export default function TokensPreview() {
  return (
    <div className="min-h-screen bg-[var(--color-stone)] text-[var(--color-raven)] p-8 pb-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-16">
        
        <header className="border-b-2 border-[var(--color-raven)] pb-4">
          <h1 className="font-heading text-6xl uppercase tracking-[-0.01em]">Design Tokens</h1>
          <p className="text-[var(--color-smoke)] mt-2">CULTRAVEN Redesign Component Library</p>
        </header>

        {/* Colors */}
        <section>
          <h2 className="font-heading text-3xl uppercase mb-6">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Stone", var: "--color-stone" },
              { name: "Bone", var: "--color-bone" },
              { name: "Raven", var: "--color-raven" },
              { name: "Lava", var: "--color-lava" },
              { name: "Olive", var: "--color-olive" },
              { name: "Smoke", var: "--color-smoke" },
              { name: "Line", var: "--color-line" },
            ].map((c) => (
              <div key={c.name} className="border-2 border-[var(--color-raven)] flex flex-col bg-[var(--color-bone)]">
                <div style={{ backgroundColor: `var(${c.var})` }} className="h-24 w-full border-b-2 border-[var(--color-raven)]" />
                <div className="p-3">
                  <p className="font-heading text-xl uppercase">{c.name}</p>
                  <p className="text-xs font-mono">{c.var}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="font-heading text-3xl uppercase mb-6">Typography</h2>
          <div className="space-y-8 bg-[var(--color-bone)] border-2 border-[var(--color-raven)] p-6">
            <div>
              <p className="text-xs font-mono text-[var(--color-smoke)] mb-2">Display (Archivo)</p>
              <h1 className="font-heading text-[clamp(2.75rem,9vw,7.5rem)] uppercase leading-[0.9] tracking-[-0.01em]">Not made to blend in.</h1>
            </div>
            <div>
              <p className="text-xs font-mono text-[var(--color-smoke)] mb-2">Body (Hanken Grotesk)</p>
              <p className="text-base max-w-[65ch] leading-relaxed">
                CULTRAVEN is an Indian streetwear brand for those who don't dress to fit in — they create their own identity. Oversized heavyweights, acid washes, mythic graphics.
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-[var(--color-smoke)] mb-2">Devanagari (Noto Sans Devanagari)</p>
              <p className="font-deva text-2xl font-semibold uppercase tracking-wide">
                धर्म
              </p>
            </div>
          </div>
        </section>

        {/* Stamps */}
        <section>
          <h2 className="font-heading text-3xl uppercase mb-6">Stamps</h2>
          <div className="flex flex-wrap gap-6 bg-[var(--color-bone)] border-2 border-[var(--color-raven)] p-8">
            <span className="bg-[var(--color-lava)] text-[var(--color-raven)] border-2 border-[var(--color-raven)] px-2 py-1 font-heading text-sm uppercase tracking-[0.04em] font-bold shadow-[2px_2px_0px_0px_var(--color-raven)] -rotate-3">
              LIVE - 48 PIECES LEFT
            </span>
            <span className="bg-[var(--color-bone)] text-[var(--color-raven)] border-2 border-[var(--color-raven)] px-2 py-1 font-heading text-sm uppercase tracking-[0.04em] font-bold shadow-[2px_2px_0px_0px_var(--color-raven)] rotate-2">
              NEW
            </span>
            <span className="bg-[var(--color-olive)] text-[var(--color-bone)] border-2 border-[var(--color-raven)] px-2 py-1 font-heading text-sm uppercase tracking-[0.04em] font-bold shadow-[2px_2px_0px_0px_var(--color-raven)] -rotate-1">
              LOW STOCK
            </span>
            <span className="bg-[var(--color-smoke)] text-[var(--color-bone)] border-2 border-[var(--color-raven)] px-2 py-1 font-heading text-sm uppercase tracking-[0.04em] font-bold shadow-[2px_2px_0px_0px_var(--color-raven)] rotate-3">
              SOLD OUT
            </span>
          </div>
        </section>

        {/* Buttons & UI */}
        <section>
          <h2 className="font-heading text-3xl uppercase mb-6">Buttons & Chips</h2>
          <div className="flex flex-wrap items-center gap-6 bg-[var(--color-bone)] border-2 border-[var(--color-raven)] p-8">
            <button className="bg-[var(--color-lava)] text-[var(--color-raven)] font-bold uppercase tracking-wider px-6 py-3 border-2 border-[var(--color-raven)] shadow-[4px_4px_0px_0px_var(--color-raven)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_var(--color-raven)] transition-all">
              Shop Drop 02
            </button>
            
            <button className="bg-[var(--color-raven)] text-[var(--color-bone)] font-bold uppercase tracking-wider px-6 py-3 border-2 border-[var(--color-raven)] shadow-[4px_4px_0px_0px_var(--color-raven)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_var(--color-raven)] transition-all">
              Secondary Action
            </button>

            <div className="flex gap-2">
              {['S', 'M', 'L', 'XL'].map((s) => (
                <button key={s} className="w-10 h-10 rounded-full border-2 border-[var(--color-raven)] font-bold flex items-center justify-center hover:bg-[var(--color-raven)] hover:text-[var(--color-bone)] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Card Anatomy */}
        <section>
          <h2 className="font-heading text-3xl uppercase mb-6">Card Anatomy</h2>
          <div className="max-w-xs">
            <article className="bg-[var(--color-bone)] border-2 border-[var(--color-raven)] shadow-[4px_4px_0px_0px_var(--color-raven)] flex flex-col relative">
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-[var(--color-bone)] text-[var(--color-raven)] border-2 border-[var(--color-raven)] px-2 py-1 font-heading text-xs uppercase tracking-[0.04em] font-bold shadow-[2px_2px_0px_0px_var(--color-raven)] -rotate-2 inline-block">
                  NEW
                </span>
              </div>
              <div className="absolute top-3 right-3 z-10">
                <button className="w-10 h-10 rounded-full border-2 border-[var(--color-raven)] bg-[var(--color-bone)] flex items-center justify-center shadow-[2px_2px_0px_0px_var(--color-raven)] hover:bg-[var(--color-raven)] hover:text-[var(--color-bone)] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
              <div className="aspect-[4/5] bg-[var(--color-line)] border-b-2 border-[var(--color-raven)] relative flex items-center justify-center">
                 <span className="text-[var(--color-smoke)] font-mono text-xs" data-todo="real-photo">4:5 Asset</span>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-heading text-xl uppercase leading-none">Dharma Heavyweight Tee</h3>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold text-sm">
                  <span>₹1,899</span>
                  <span className="text-[var(--color-smoke)] line-through text-xs">₹2,499</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#1C1C1C] border border-[var(--color-raven)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--color-bone)] border border-[var(--color-raven)]" />
                  </div>
                  <div className="flex gap-1 text-[10px] font-mono font-bold">
                    <span>S</span><span>M</span><span>L</span><span>XL</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

      </div>
    </div>
  );
}
