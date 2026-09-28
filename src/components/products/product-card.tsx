"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaBoxOpen, FaXmark } from "react-icons/fa6";
import type { Product } from "@/data/products";

type ProductCardProps = {
  product: Product;
};

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function getCategoryLabel(product: Product) {
  return [product.category, product.subcategory, product.childCategory]
    .filter(Boolean)
    .join(" / ");
}

export function ProductCard({ product }: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasOffer =
    product.offerPrice !== null && product.offerPrice < product.salePrice;
  const titleId = `product-title-${product.id}`;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [isOpen]);

  return (
    <>
      <article className="overflow-hidden border border-black/10 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-600"
          aria-label={`Ver detalles de ${product.name}`}
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50">
            {hasOffer ? (
              <span className="absolute left-2 top-2 z-10 bg-red-600 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-white">
                OFF
              </span>
            ) : null}
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
              {getCategoryLabel(product)}
            </p>
            <h2 className="mt-1 text-sm font-black uppercase tracking-[0.06em]">
              {product.name}
            </h2>
            {product.description ? (
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {product.description}
              </p>
            ) : null}
            {hasOffer ? (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xs text-zinc-400 line-through">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-sm font-black text-red-600">
                  {formatPrice(product.offerPrice as number)}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {formatPrice(product.salePrice)}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500">Stock: {product.stock}</p>
          </div>
        </button>
      </article>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            role="dialog"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white text-zinc-950 shadow-2xl dark:bg-zinc-950 dark:text-zinc-50"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                Detalle del producto
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar detalle del producto"
                title="Cerrar"
                className="flex size-9 items-center justify-center text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                <FaXmark aria-hidden="true" className="size-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 md:aspect-auto md:min-h-80">
                {product.imageSrc ? (
                  <Image
                    src={product.imageSrc}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <FaBoxOpen aria-hidden="true" className="size-10" />
                )}
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                    {getCategoryLabel(product)}
                  </p>
                  <h2 id={titleId} className="mt-2 text-2xl font-black uppercase tracking-[0.04em]">
                    {product.name}
                  </h2>
                </div>

                {product.description ? (
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {product.description}
                  </p>
                ) : null}

                <dl className="space-y-3 border-y border-black/10 py-4 text-sm dark:border-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-zinc-500">Código</dt>
                    <dd className="font-semibold">{product.code}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-zinc-500">Stock disponible</dt>
                    <dd className="font-semibold">{product.stock}</dd>
                  </div>
                </dl>

                <div>
                  {hasOffer ? (
                    <>
                      <p className="text-sm text-zinc-400 line-through">
                        {formatPrice(product.salePrice)}
                      </p>
                      <p className="mt-1 text-2xl font-black text-red-600">
                        {formatPrice(product.offerPrice as number)}
                      </p>
                      <span className="mt-2 inline-block bg-red-600 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-white">
                        Precio oferta
                      </span>
                    </>
                  ) : (
                    <p className="text-2xl font-black">{formatPrice(product.salePrice)}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
