import type { Metadata } from "next";
import CollectionClient from "./CollectionClient";

interface Props { params: Promise<{ slug: string }> }

const COLLECTION_META: Record<string, { name: string; description: string; image: string }> = {
  "new-in": { name: "New In", description: "The freshest pieces from CULTRAVEN — new drops, updated silhouettes and limited editions.", image: "https://images.unsplash.com/photo-1512316694639-50ab2ce7b767?w=1400&auto=format&fit=crop&q=85" },
  "street": { name: "Street", description: "A collection built for movement, individuality and everyday rebellion.", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&auto=format&fit=crop&q=85" },
  "bestsellers": { name: "Bestsellers", description: "The ones everyone keeps coming back for — our most loved styles.", image: "https://images.unsplash.com/photo-1600091166860-93a5dbfa01c1?w=1400&auto=format&fit=crop&q=85" },
  "essentials": { name: "Essentials", description: "Clean, heavyweight basics built to outlast every trend.", image: "https://images.unsplash.com/photo-1572491295326-72d829dc7482?w=1400&auto=format&fit=crop&q=85" },
  "all": { name: "All Products", description: "Every piece from CULTRAVEN — filter, sort and discover.", image: "https://images.unsplash.com/photo-1618886487325-f98f121b6192?w=1400&auto=format&fit=crop&q=85" },
};

function getMeta(slug: string) {
  return COLLECTION_META[slug] ?? {
    name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: `Shop the ${slug} collection from CULTRAVEN.`,
    image: "https://images.unsplash.com/photo-1512316694639-50ab2ce7b767?w=1400&auto=format&fit=crop&q=85",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { name, description } = getMeta(slug);
  return {
    title: `${name} | CULTRAVEN`,
    description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { title: `${name} | CULTRAVEN`, description, type: "website" },
  };
}

export function generateStaticParams() {
  return Object.keys(COLLECTION_META).map((slug) => ({ slug }));
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const { name, description, image } = getMeta(slug);
  return <CollectionClient collectionName={name} collectionSlug={slug} description={description} heroImage={image} />;
}
