import Image from "next/image";
import { notFound } from "next/navigation";
import { FaBoxOpen, FaImage } from "react-icons/fa6";
import {
  CatalogChildCategoryNav,
  CatalogSubcategoryNav,
} from "@/components/catalog/catalog-subcategory-nav";
import { getCategoryTree } from "@/lib/categories-repository";
import { mockProducts } from "@/data/mock-products";
import { toSlug } from "@/lib/slug";

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
  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug,
  );

  if (!selectedCategory) {
    notFound();
  }

  const categoryProducts = mockProducts.filter(
    (product) => toSlug(product.category) === categorySlug,
  );

  const selectedSubcategory = subcategorySlug
    ? selectedCategory.subcategories.find(
        (subcategory) => subcategory.slug === subcategorySlug,
      )
    : null;

  if (subcategorySlug && !selectedSubcategory) {
    notFound();
  }

  const subcategories = selectedCategory.subcategories;

  const subcategoryProducts = subcategorySlug
    ? categoryProducts.filter(
        (product) => toSlug(product.subcategory) === subcategorySlug,
      )
    : categoryProducts;

  const childCategories = selectedSubcategory?.subcategories ?? [];

  const selectedChildCategory = childCategorySlug
    ? childCategories.find((childCategory) => childCategory.slug === childCategorySlug)
    : null;

  if (childCategorySlug && !selectedChildCategory) {
    notFound();
  }

  const products = childCategorySlug
    ? subcategoryProducts.filter(
        (product) => toSlug(product.childCategory ?? "") === childCategorySlug,
      )
    : subcategoryProducts;

  const selectedCover = selectedSubcategory ?? selectedCategory;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background text-foreground">
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
          {products.length} productos encontrados
        </p>

        <div className="grid grid-cols-2 gap-3 px-3 sm:px-0 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden border border-black/10 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50">
                {product.imageSrc ? (
                  <Image
                    src={product.imageSrc}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <FaBoxOpen aria-hidden="true" className="size-7" />
                )}
              </div>
              <div className="px-3 py-3">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {product.childCategory
                    ? `${product.subcategory} / ${product.childCategory}`
                    : product.subcategory}
                </p>
                <h2 className="mt-1 text-sm font-black uppercase tracking-[0.06em]">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  ${product.wholesalePrice.toLocaleString("es-AR")}
                </p>
                <p className="mt-1 text-xs text-zinc-500">Stock: {product.stock}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
