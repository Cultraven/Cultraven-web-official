/**
 * A tiny, safe text format for the policy pages, so the admin can write normal text instead of HTML:
 *   - a blank line starts a new paragraph
 *   - a line starting with "- " (or "• ") is a bullet
 *   - **bold**, *italic*, [link text](/pages/contact), [email us](mailto:support@cultraven.com)
 * Nothing is ever rendered as raw HTML; links are limited to this site, https, mailto and tel.
 */

export type Inline = { t: "text"; v: string } | { t: "b"; v: string } | { t: "i"; v: string } | { t: "a"; v: string; href: string };
export type Block = { t: "p"; lines: Inline[][] } | { t: "ul"; items: Inline[][] };

/** True only for links we are happy to render. */
export function isSafeHref(h: string): boolean {
  const s = h.trim();
  if (s.startsWith("//")) return false;
  return /^(\/|#|https:\/\/|mailto:|tel:)/i.test(s);
}

const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\s][^*\n]*\*|\[[^\]\n]+\]\([^)\s]+\))/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ t: "text", v: text.slice(last, idx) });
    const tok = m[0];
    if (tok.startsWith("**")) out.push({ t: "b", v: tok.slice(2, -2) });
    else if (tok.startsWith("[")) {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (mm && isSafeHref(mm[2])) out.push({ t: "a", v: mm[1], href: mm[2].trim() });
      else out.push({ t: "text", v: mm ? mm[1] : tok });
    } else out.push({ t: "i", v: tok.slice(1, -1) });
    last = idx + tok.length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

const BULLET = /^\s*(?:-|•)\s+(.*)$/;

export function parseRichText(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = String(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => { if (para.length) blocks.push({ t: "p", lines: para.map(parseInline) }); para = []; };
  const flushList = () => { if (list.length) blocks.push({ t: "ul", items: list.map(parseInline) }); list = []; };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const b = line.match(BULLET);
    if (b) { flushPara(); list.push(b[1]); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return blocks;
}
