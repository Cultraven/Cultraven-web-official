import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.privacy). */
export async function generateMetadata() {
  return policyMetadata("page.privacy", "/pages/privacy");
}

export default async function PrivacyPage() {
  return <PolicyPage data={await getPolicy("page.privacy")} />;
}
