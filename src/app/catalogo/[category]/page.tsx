import { CatalogPage } from "@/components/catalog/catalog-page";

type CatalogCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function Page({ params }: CatalogCategoryPageProps) {
  const { category } = await params;

  return <CatalogPage categorySlug={category} />;
}
