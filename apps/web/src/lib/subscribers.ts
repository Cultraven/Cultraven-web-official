/**
 * Helpers for the subscriber list (Admin -> Subscribers) and the public sign-up.
 * Kept out of the route files because Next route files may only export route handlers.
 */
import { z } from "zod";
import { stripControlChars } from "@/lib/sanitize";

export type SubscriberStatus = "subscribed" | "unsubscribed";

/** What a visitor may send along with the email: where they were and what they asked to hear about. */
export const interestField = z
  .string()
  .max(200)
  .transform((v) => stripControlChars(v).replace(/\s+/g, " ").trim().slice(0, 60))
  .optional();

/** A site path only ("/collections/hoodies"): anything else is dropped rather than stored. */
export const pageField = z
  .string()
  .max(300)
  .transform((v) => { const p = stripControlChars(v).trim().split(/[?#]/)[0]; return /^\/(?!\/)[A-Za-z0-9\-._~/%]*$/.test(p) ? p.slice(0, 120) : ""; })
  .optional();

export interface SubscriberRow { id: string; email: string; status: SubscriberStatus; interest: string; page: string; source: string; note: string; at: string }

export function toRow(d: any): SubscriberRow {
  return {
    id: String(d._id),
    email: String(d.email ?? ""),
    status: d.status === "unsubscribed" ? "unsubscribed" : "subscribed",
    interest: String(d.interest ?? ""),
    page: String(d.page ?? ""),
    source: String(d.source ?? "website"),
    note: String(d.note ?? ""),
    at: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? ""),
  };
}

/** Spreadsheet programs run a cell that starts with = + - @ as a formula: a hostile "email" must never do that when the team opens the export. */
export function csvCell(v: unknown): string {
  let s = String(v ?? "").replace(/[\r\n]+/g, " ");
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: SubscriberRow[]): string {
  const head = ["Email", "Status", "Interested in", "Signed up on page", "Source", "Note", "Signed up (UTC)"];
  const lines = rows.map((r) => [r.email, r.status, r.interest, r.page, r.source, r.note, r.at].map(csvCell).join(","));
  return "﻿" + [head.join(","), ...lines].join("\r\n") + "\r\n";
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
