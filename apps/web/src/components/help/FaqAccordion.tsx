"use client";
/**
 * FAQ accordion: hover a question to preview the answer, click to keep it open (click again to close).
 * Works with touch (tap), keyboard (Enter / Space on the question) and screen readers (aria-expanded / aria-controls).
 * Hover is only used on devices that can really hover; `hover={false}` (or ?faq=click on the Help Center) makes it click-only.
 */
import React, { useCallback, useEffect, useId, useReducer, useRef } from "react";
import "@/styles/help.css";
import { FAQ_INITIAL, HOVER_CLOSE_DELAY_MS, HOVER_OPEN_DELAY_MS, faqReducer, isFaqOpen } from "@/lib/faq-state";
import type { Faq, Topic } from "@/lib/support";

export type FaqItem = Faq & { topic?: Topic };

/** True only on devices with a real hovering pointer (mouse / trackpad), not phones and tablets. */
export function canHover(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function Item({ item, showTopic, hover, forceOpen }: { item: FaqItem; showTopic?: boolean; hover: boolean; forceOpen?: boolean }) {
  const [state, dispatch] = useReducer(faqReducer, FAQ_INITIAL);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  useEffect(() => clear, []);

  const onEnter = useCallback(() => {
    if (!hover || !canHover()) return;
    clear();
    timer.current = setTimeout(() => dispatch("enter"), HOVER_OPEN_DELAY_MS);
  }, [hover]);
  const onLeave = useCallback(() => {
    if (!hover || !canHover()) { dispatch("leave"); return; }
    clear();
    timer.current = setTimeout(() => dispatch("leave"), HOVER_CLOSE_DELAY_MS);
  }, [hover]);
  const onClick = () => { clear(); dispatch("click"); };

  const open = isFaqOpen(state, forceOpen);
  return (
    <div className="faq-item" data-open={open ? "true" : "false"} data-mode={state.mode} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <h3 className="faq-h">
        <button type="button" className="faq-q" aria-expanded={open} aria-controls={`${id}-a`} id={`${id}-q`} onClick={onClick}>
          <span>
            {showTopic && item.topic ? <span className="hc-from" style={{ display: "block" }}>{item.topic.title}</span> : null}
            {item.q}
          </span>
          <span className="faq-sign" aria-hidden="true" />
        </button>
      </h3>
      <div className="faq-panel" id={`${id}-a`} role="region" aria-labelledby={`${id}-q`}>
        <div className="faq-panel-inner"><div className="ans">{item.a}</div></div>
      </div>
    </div>
  );
}

export function FaqAccordion({ items, from, hover = true, forceOpen = false }: { items: FaqItem[]; from?: boolean; hover?: boolean; forceOpen?: boolean }) {
  return (
    <div className="hc-faq faq-list" data-hover={hover ? "on" : "off"}>
      {items.map((f, i) => <Item key={`${f.q}-${i}`} item={f} showTopic={from} hover={hover} forceOpen={forceOpen} />)}
    </div>
  );
}
