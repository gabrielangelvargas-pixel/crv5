import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { getCategoryMetadata } from "@/lib/category-metadata";

type CatalogSubcategoryPageProps = {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
};

export async function generateMetadata({ params }: CatalogSubcategoryPageProps): Promise<Metadata> {
  const { category, subcategory } = await params;
  return getCategoryMetadata([category, subcategory]);
}

export default async function Page({ params }: CatalogSubcategoryPageProps) {
  const { category, subcategory } = await params;

  return <CatalogPage categorySlug={category} subcategorySlug={subcategory} />;
}
