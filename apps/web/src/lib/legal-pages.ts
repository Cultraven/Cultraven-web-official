/**
 * Loads a policy page (Terms, Privacy, Shipping, Returns) from the database (page.terms, page.privacy, page.shipping, page.returns).
 * If a page has never been saved in the database, the built-in wording (cms/legal-defaults.json, the same text the seed writes) is shown,
 * so a legal page is never blank.
 */
import type { Metadata } from "next";
import { getCmsSection } from "@/lib/cms/server";
import type { PolicyData } from "@/components/legal/PolicyPage";
import defaults from "@/lib/cms/legal-defaults.json";

export type PolicyKey = "page.terms" | "page.privacy" | "page.shipping" | "page.returns";

export async function getPolicy(key: PolicyKey): Promise<PolicyData> {
  const s = await getCmsSection<PolicyData>(key);
  if (s.state === "ok" && s.data?.title) return s.data;
  return (defaults as Record<string, unknown>)[key] as PolicyData;
}

export async function policyMetadata(key: PolicyKey, canonical: string): Promise<Metadata> {
  const d = await getPolicy(key);
  return { title: d.title, description: d.metaDescription || undefined, alternates: { canonical } };
}
