import Image from "next/image";
import type { CategoryNode } from "@/data/categories";
import { getCategoryIcon } from "@/lib/category-icons";

type VisitedCategoriesProps = {
  categories: CategoryNode[];
};

export function VisitedCategories({ categories }: VisitedCategoriesProps) {
  const visitedCategories = categories.slice(0, 4);

  return (
    <section aria-labelledby="visited-categories-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-7 sm:py-9">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
              Explora
            </p>
            <h2
              id="visited-categories-title"
              className="mt-1.5 whitespace-nowrap text-lg font-black uppercase tracking-[0.03em] text-foreground sm:text-2xl"
            >
              Categorias mas visitadas
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visitedCategories.map((category) => {
            const Icon = getCategoryIcon(category.iconKey);

            return (
              <article
                key={category.name}
                className="group overflow-hidden border border-black/10 bg-white text-zinc-950 transition-colors hover:border-black/25 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-white/25"
              >
                <div className="relative flex aspect-[1.91/1] w-full items-center justify-center overflow-hidden bg-zinc-100 text-zinc-950 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:group-hover:bg-zinc-800">
                  {category.imageSrc ? (
                    <Image
                      src={category.imageSrc}
                      alt={category.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <Icon aria-hidden="true" className="size-6" />
                  )}
                </div>
                <div className="px-3 py-3 text-center sm:text-left">
                  <h3 className="text-xs font-black uppercase tracking-[0.1em] sm:text-sm">
                    {category.name}
                  </h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
