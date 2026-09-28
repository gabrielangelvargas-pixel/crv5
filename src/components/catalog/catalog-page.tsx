import Image from "next/image";
import { notFound } from "next/navigation";
import { FaImage } from "react-icons/fa6";
import {
  CatalogChildCategoryNav,
  CatalogSubcategoryNav,
} from "@/components/catalog/catalog-subcategory-nav";
import { CategoryViewTracker } from "@/components/catalog/category-view-tracker";
import { getCategoryTree } from "@/lib/categories-repository";
import type { CategoryNode } from "@/data/categories";
import { getProducts } from "@/lib/products-repository";
import { ProductCard } from "@/components/products/product-card";

type CatalogPageProps = {
  categorySlug: string;
  subcategorySlug?: string;
  childCategorySlug?: string;
};

export async function CatalogPage({
  categorySlug,
  subcategorySlug,
  childCategorySlug,
}: CatalogPageProps) {
  const categories = await getCategoryTree();
  const allProducts = await getProducts();
  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug,
  );

  if (!selectedCategory) {
    notFound();
  }

  const selectedSubcategory = subcategorySlug
    ? selectedCategory.subcategories.find(
        (subcategory) => subcategory.slug === subcategorySlug,
      )
    : null;

  if (subcategorySlug && !selectedSubcategory) {
    notFound();
  }

  const subcategories = selectedCategory.subcategories;

  const childCategories = selectedSubcategory?.subcategories ?? [];

  const selectedChildCategory = childCategorySlug
    ? childCategories.find((childCategory) => childCategory.slug === childCategorySlug)
    : null;

  if (childCategorySlug && !selectedChildCategory) {
    notFound();
  }

  const activeCategory = selectedChildCategory ?? selectedSubcategory ?? selectedCategory;
  const categoryIds = new Set<string>();
  const collectCategoryIds = (category: CategoryNode) => {
    categoryIds.add(category.id);
    for (const child of category.subcategories) {
      collectCategoryIds(child);
    }
  };
  collectCategoryIds(activeCategory);
  const categoryProducts = allProducts.filter((product) => categoryIds.has(product.categoryId));

  const selectedCover = selectedSubcategory ?? selectedCategory;
  const trackedCategory = selectedChildCategory ?? selectedSubcategory ?? selectedCategory;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background text-foreground">
      <CategoryViewTracker categoryId={trackedCategory.id} />
      <section className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 overflow-hidden bg-white shadow-sm ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/10">
          <div className="relative flex aspect-[2.5/1] min-h-32 items-center justify-center overflow-hidden bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50">
            {selectedCover?.coverImageSrc ? (
              <Image
                src={selectedCover.coverImageSrc}
                alt={`Portada ${selectedCover.name}`}
                fill
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-foreground/45">
                <FaImage aria-hidden="true" className="size-7" />
              </div>
            )}
          </div>
          <footer className="bg-zinc-950 px-4 py-3 text-white">
            <h1 className="text-lg font-black uppercase tracking-[0.08em] sm:text-2xl">
              {selectedCover.name}
            </h1>
          </footer>
        </div>

        <div className="px-3 sm:px-0">
          <CatalogSubcategoryNav
            categorySlug={categorySlug}
            subcategories={subcategories}
            {...(subcategorySlug ? { subcategorySlug } : {})}
          />
          {subcategorySlug && childCategories.length > 0 ? (
            <CatalogChildCategoryNav
              categorySlug={categorySlug}
              subcategorySlug={subcategorySlug}
              childCategories={childCategories}
              {...(childCategorySlug ? { childCategorySlug } : {})}
            />
          ) : null}
        </div>

        <p className="mb-4 px-3 text-sm text-foreground/60 sm:px-0">
          {categoryProducts.length} productos encontrados
        </p>

        <div className="grid grid-cols-2 gap-3 px-3 sm:px-0 lg:grid-cols-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
