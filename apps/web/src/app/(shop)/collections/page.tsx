import { redirect } from "next/navigation";

export const dynamic = "force-static";

/** There is no separate "all collections" page: send visitors (and Google) to the full shop. */
export default function CollectionsPage() {
  redirect("/collections/all");
}
