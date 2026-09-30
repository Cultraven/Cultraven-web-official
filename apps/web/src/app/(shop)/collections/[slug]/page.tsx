import type { Metadata } from "next";
import CollectionClient from "./CollectionClient";
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

/** Name / description / banner come from the database (shop.collections). Unknown slugs get a label derived from the URL and no banner. */
async function getMeta(slug: string) {
  const section = await getCmsSection<any>("shop.collections");
  const found = liveItems<any>(section.data?.items).find((c) => c.slug === slug);
  if (found) return { name: found.name as string, description: (found.description as string) || "", image: (found.image as string) || "" };
  return {
    name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: "",
    image: "",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { name, description, image } = await getMeta(slug);
  return {
    title: name,
    description: description || undefined,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { title: name, description: description || undefined, type: "website", images: image ? [image] : undefined },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const { name, description, image } = await getMeta(slug);
  return <CollectionClient collectionName={name} collectionSlug={slug} description={description} heroImage={image} />;
}
