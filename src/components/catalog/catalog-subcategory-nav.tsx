"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type CatalogCategoryOption = {
  name: string;
  slug: string;
};

type CatalogSubcategoryNavProps = {
  categorySlug: string;
  subcategories: CatalogCategoryOption[];
  subcategorySlug?: string;
};

type CatalogChildCategoryNavProps = {
  categorySlug: string;
  subcategorySlug: string;
  childCategories: CatalogCategoryOption[];
  childCategorySlug?: string;
};

export function CatalogSubcategoryNav({
  categorySlug,
  subcategories,
  subcategorySlug,
}: CatalogSubcategoryNavProps) {
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      behavior: "instant",
      block: "nearest",
      inline: "center",
    });
  }, [subcategorySlug]);

  return (
    <div className="scrollbar-none -mx-6 mb-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
      <div className="flex gap-2">
        <Link
          ref={!subcategorySlug ? activeItemRef : undefined}
          href={`/catalogo/${categorySlug}`}
          replace
          className={`shrink-0 border px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] ${
            subcategorySlug
              ? "border-black/10 bg-white text-foreground/65 dark:border-white/10 dark:bg-zinc-950"
              : "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
          }`}
        >
          Todo
        </Link>
        {subcategories.map((subcategory) => {
          const isActive = subcategory.slug === subcategorySlug;

          return (
            <Link
              key={subcategory.slug}
              ref={isActive ? activeItemRef : undefined}
              href={`/catalogo/${categorySlug}/${subcategory.slug}`}
              replace
              className={`shrink-0 border px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] ${
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-black/10 bg-white text-foreground/65 dark:border-white/10 dark:bg-zinc-950"
              }`}
            >
              {subcategory.name}
            </Link>
          );
        })}
        <div aria-hidden="true" className="w-6 shrink-0 sm:hidden" />
      </div>
    </div>
  );
}

export function CatalogChildCategoryNav({
  categorySlug,
  subcategorySlug,
  childCategories,
  childCategorySlug,
}: CatalogChildCategoryNavProps) {
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      behavior: "instant",
      block: "nearest",
      inline: "center",
    });
  }, [childCategorySlug]);

  return (
    <div className="scrollbar-none -mx-6 mb-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
      <div className="flex gap-2">
        <Link
          ref={!childCategorySlug ? activeItemRef : undefined}
          href={`/catalogo/${categorySlug}/${subcategorySlug}`}
          replace
          className={`shrink-0 border px-3.5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] ${
            childCategorySlug
              ? "border-black/10 bg-white text-foreground/65 dark:border-white/10 dark:bg-zinc-950"
              : "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
          }`}
        >
          Todo
        </Link>
        {childCategories.map((childCategory) => {
          const isActive = childCategory.slug === childCategorySlug;

          return (
            <Link
              key={childCategory.slug}
              ref={isActive ? activeItemRef : undefined}
              href={`/catalogo/${categorySlug}/${subcategorySlug}/${childCategory.slug}`}
              replace
              className={`shrink-0 border px-3.5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] ${
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-black/10 bg-white text-foreground/65 dark:border-white/10 dark:bg-zinc-950"
              }`}
            >
              {childCategory.name}
            </Link>
          );
        })}
        <div aria-hidden="true" className="w-6 shrink-0 sm:hidden" />
      </div>
    </div>
  );
}
