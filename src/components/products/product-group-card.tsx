"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaBoxOpen, FaXmark } from "react-icons/fa6";
import type { ProductGroup } from "@/data/products";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { getCartUnitPrice } from "@/lib/cart";

type ProductGroupCardProps = { productGroup: ProductGroup };

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

export function ProductGroupCard({ productGroup }: ProductGroupCardProps) {
  const { items, addItem, ready } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const product = productGroup.product;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(product.id);
  const modalHistoryRef = useRef(false);
  const modalUrlRef = useRef("");
  const selected = productGroup.variants.find((variant) => variant.id === selectedId) ?? product;
  const inCart = items.find((item) => item.productId === selected.id)?.quantity ?? 0;
  const remaining = Math.max(0, Math.floor(selected.stock) - inCart);
  const validQuantity = Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= remaining;
  const unitPrice = getCartUnitPrice(selected, inCart + (validQuantity ? quantity : 0));
  const hasOffer = selected.offerPrice !== null && selected.offerPrice < selected.salePrice;
  const hasAnyOffer = productGroup.variants.some(
    (variant) => variant.offerPrice !== null && variant.offerPrice < variant.salePrice,
  );
  const titleId = `product-group-title-${productGroup.id}`;

  function openModal() {
    modalUrlRef.current = window.location.href;
    window.history.pushState({ crv4ProductModal: true }, "", modalUrlRef.current);
    modalHistoryRef.current = true;
    setIsOpen(true);
  }

  function closeModal() {
    if (modalHistoryRef.current) {
      modalHistoryRef.current = false;
      window.history.back();
    }
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const closeWithBrowserBack = () => {
      if (!modalHistoryRef.current) return;
      modalHistoryRef.current = false;
      setIsOpen(false);
      window.history.pushState({ crv4ProductModal: false }, "", modalUrlRef.current);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeWithEscape);
    window.addEventListener("popstate", closeWithBrowserBack);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeWithEscape);
      window.removeEventListener("popstate", closeWithBrowserBack);
    };
  }, [isOpen]);

  return (
    <>
      <article className="overflow-hidden border border-black/10 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50">
        <button
          type="button"
          onClick={openModal}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-2 py-0 md:p-4" role="presentation" onMouseDown={closeModal}>
          <section aria-labelledby={titleId} aria-modal="true" role="dialog" className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white text-zinc-950 shadow-2xl dark:bg-zinc-950 dark:text-zinc-50 md:h-[36rem] md:overflow-hidden" onMouseDown={(event) => event.stopPropagation()}>
            <div className="grid md:h-full md:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
              <div className="relative flex aspect-square min-h-0 items-center justify-center overflow-hidden bg-zinc-100 p-4 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 md:aspect-auto md:h-full md:p-8">
                <button type="button" onClick={closeModal} aria-label="Cerrar detalle del producto" title="Cerrar" className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center bg-white/90 text-zinc-700 shadow-sm dark:bg-zinc-950/90 dark:text-zinc-300">
                  <FaXmark aria-hidden="true" className="size-5" />
                </button>
                {selected.imageSrc ? <Image src={selected.imageSrc} alt={selected.name} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-contain" /> : <FaBoxOpen aria-hidden="true" className="size-10" />}
              </div>
              <div className="space-y-5 p-5 sm:p-6 md:overflow-y-auto">
                <div>
                  <h2 id={titleId} className="text-xl font-black uppercase tracking-[0.04em]">{product.name}</h2>
                </div>

                {productGroup.variants.length > 1 ? (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Variantes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {productGroup.variants.map((variant) => (
                        <button key={variant.id} type="button" onClick={() => { setSelectedId(variant.id); setQuantity(1); setMessage(""); }} className={`border px-3 py-3 text-left text-sm font-bold uppercase ${selected.id === variant.id ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-black/10 dark:border-white/10"}`}>
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

                <form className="space-y-3" onSubmit={(event) => {
                  event.preventDefault();
                  if (!ready || !validQuantity) return;
                  addItem(selected.id, quantity);
                  setMessage(`${quantity} unidades de ${selected.variantName ?? selected.name} agregadas al carrito.`);
                }}>
                  <label className="block text-sm font-bold">Cantidad
                    <input type="number" min={1} max={remaining} step={1} required disabled={!ready || remaining === 0} value={quantity} onChange={(event) => { setQuantity(Number(event.target.value)); setMessage(""); }} className="ml-3 w-24 border border-black/20 bg-transparent px-3 py-2 dark:border-white/20" />
                  </label>
                  {inCart > 0 ? <p className="text-sm">Ya tenés {inCart} unidades de esta variante en el carrito.</p> : null}
                  {validQuantity ? <p className="text-sm">Precio aplicado: <strong>{formatPrice(unitPrice)} c/u</strong></p> : null}
                  <button type="submit" disabled={!ready || !validQuantity} className="w-full bg-emerald-500 px-4 py-3 font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">{remaining === 0 ? selected.stock === 0 ? "Sin stock" : "Stock disponible ya agregado" : "Agregar al carrito"}</button>
                  <p role="status" aria-live="polite" className="text-sm">{message}</p>
                  <Link href="/carrito" className="inline-block text-sm font-bold underline">Ver carrito</Link>
                </form>

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
