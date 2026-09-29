"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaBoxOpen, FaXmark } from "react-icons/fa6";
import type { ProductGroup } from "@/data/products";

type ProductGroupCardProps = { productGroup: ProductGroup };

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

export function ProductGroupCard({ productGroup }: ProductGroupCardProps) {
  const product = productGroup.product;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(product.id);
  const selected = productGroup.variants.find((variant) => variant.id === selectedId) ?? product;
  const hasOffer = selected.offerPrice !== null && selected.offerPrice < selected.salePrice;
  const hasAnyOffer = productGroup.variants.some(
    (variant) => variant.offerPrice !== null && variant.offerPrice < variant.salePrice,
  );
  const titleId = `product-group-title-${productGroup.id}`;

  useEffect(() => {
    if (!isOpen) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
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
          aria-label={`Ver detalles de ${product.name}`}
          className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-600"
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50">
            {hasAnyOffer ? <span className="absolute left-2 top-2 z-10 bg-red-600 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-white">OFF</span> : null}
            {product.imageSrc ? <Image src={product.imageSrc} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" /> : <FaBoxOpen aria-hidden="true" className="size-7" />}
          </div>
          <div className="px-3 py-3">
            <h2 className="text-sm font-black uppercase tracking-[0.06em]">{product.name}</h2>
            {product.description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{product.description}</p> : null}
            <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{formatPrice(product.offerPrice ?? product.salePrice)}</p>
            {productGroup.variants.length > 1 ? <p className="mt-1 text-xs font-semibold text-zinc-500">{productGroup.variants.length} variantes disponibles</p> : null}
          </div>
        </button>
      </article>

      {isOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-2 py-0 md:p-4" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <section aria-labelledby={titleId} aria-modal="true" role="dialog" className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white text-zinc-950 shadow-2xl dark:bg-zinc-950 dark:text-zinc-50" onMouseDown={(event) => event.stopPropagation()}>
            <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
              <div className="relative flex aspect-square min-h-0 items-center justify-center overflow-hidden bg-zinc-100 p-4 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 md:aspect-auto md:min-h-[34rem] md:p-8">
                <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar detalle del producto" title="Cerrar" className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center bg-white/90 text-zinc-700 shadow-sm dark:bg-zinc-950/90 dark:text-zinc-300">
                  <FaXmark aria-hidden="true" className="size-5" />
                </button>
                {selected.imageSrc ? <Image src={selected.imageSrc} alt={selected.name} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-contain" /> : <FaBoxOpen aria-hidden="true" className="size-10" />}
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <h2 id={titleId} className="text-2xl font-black uppercase tracking-[0.04em]">{product.name}</h2>
                  {selected.description ? <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{selected.description}</p> : null}
                </div>

                {productGroup.variants.length > 1 ? (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Variantes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {productGroup.variants.map((variant) => (
                        <button key={variant.id} type="button" onClick={() => setSelectedId(variant.id)} className={`border px-3 py-3 text-left text-sm font-bold uppercase ${selected.id === variant.id ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-black/10 dark:border-white/10"}`}>
                          {variant.variantName ?? variant.code}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <dl className="space-y-3 border-y border-black/10 py-4 text-sm dark:border-white/10">
                  <div className="flex justify-between gap-4"><dt className="text-zinc-500">Código</dt><dd className="font-semibold">{selected.code}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-zinc-500">Stock disponible</dt><dd className="font-semibold">{selected.stock}</dd></div>
                </dl>

                <div>
                  {hasOffer ? <><p className="text-sm text-zinc-400 line-through">{formatPrice(selected.salePrice)}</p><p className="mt-1 text-2xl font-black text-red-600">{formatPrice(selected.offerPrice as number)}</p></> : <p className="text-2xl font-black">{formatPrice(selected.salePrice)}</p>}
                </div>

                {selected.priceTiers.length > 0 ? <div className="border-t border-black/10 pt-4 text-sm dark:border-white/10"><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Precio por cantidad</p><div className="space-y-2">{selected.priceTiers.map((tier) => <div key={tier.minimumQuantity} className="flex justify-between gap-4"><span>Desde {tier.minimumQuantity} unidades</span><strong>{formatPrice(tier.unitPrice)} c/u</strong></div>)}</div></div> : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
