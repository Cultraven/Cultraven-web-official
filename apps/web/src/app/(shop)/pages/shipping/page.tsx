import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.shipping). */
export async function generateMetadata() {
  return policyMetadata("page.shipping", "/pages/shipping");
}

export default async function ShippingPage() {
  return <PolicyPage data={await getPolicy("page.shipping")} />;
}
