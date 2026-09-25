import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

function formatTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = formatTitle(slug);
  return {
    title: `${name} Capsule Drop | CULTRAVEN`,
    description: `Shop the ${name} capsule drop from CULTRAVEN. Gen Z oversized apparel, acid washes, and mythic graphic silhouettes.`,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collectionName = formatTitle(slug);

  return (
    <ComingSoon
      page={`${collectionName} Drop`}
      description={`The ${collectionName} drop capsule is unlocking soon. Heavyweight cottons, acid washes, and exclusive graphic artworks.`}
    />
  );
}
