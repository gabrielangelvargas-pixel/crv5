import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { getCategoryMetadata } from "@/lib/category-metadata";

type CatalogCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateMetadata({ params }: CatalogCategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  return getCategoryMetadata([category]);
}

export default async function Page({ params }: CatalogCategoryPageProps) {
  const { category } = await params;

  return <CatalogPage categorySlug={category} />;
}
