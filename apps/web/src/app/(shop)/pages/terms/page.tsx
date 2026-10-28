import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.terms). */
export async function generateMetadata() {
  return policyMetadata("page.terms", "/pages/terms");
}

export default async function TermsPage() {
  return <PolicyPage data={await getPolicy("page.terms")} />;
}
