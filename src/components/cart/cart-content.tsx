"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { getCartUnitPrice } from "@/lib/cart";

const money = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export function CartContent() {
  const { items, products, ready, storageError, syncError, setQuantity, removeItem } = useCart();
  const lines = items.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product, unitPrice: getCartUnitPrice(product, item.quantity) }] : [];
  });
  return <main className="mx-auto max-w-4xl px-4 py-8 text-foreground">
    <h1 className="text-2xl font-black uppercase">Mi carrito</h1>
    {syncError ? <p role="status" className="mt-4 text-sm">La sincronización está pendiente o el carrito cambió desde otro dispositivo. Revisá las cantidades; reintentaremos guardar automáticamente.</p> : null}
    {storageError ? <p role="status" className="mt-4 text-sm">No pudimos guardar el carrito en este navegador. Podés seguir usándolo durante esta visita.</p> : null}
    {!ready ? <p className="mt-6" role="status">Cargando carrito…</p> : lines.length === 0 ? <p className="mt-6">Tu carrito está vacío.</p> : <>
      <ul className="mt-6 space-y-4">{lines.map(({ product, quantity, unitPrice }) =>
        <li key={product.id} className="flex flex-wrap items-center justify-between gap-4 border border-black/10 p-4 dark:border-white/10">
          <div className="min-w-40 flex-1"><h2 className="font-bold">{product.name}</h2><p className="text-sm">{product.variantName ?? product.code}</p><p className="mt-2 text-sm">{money(unitPrice)} por unidad</p></div>
          <label className="text-sm">Cantidad<input aria-label={`Cantidad de ${product.name} ${product.variantName ?? product.code}`} type="number" min={1} max={product.stock} step={1} value={quantity} onChange={(event) => setQuantity(product.id, Number(event.target.value))} className="ml-2 w-20 border border-black/20 bg-transparent px-2 py-2 dark:border-white/20" /></label>
          <strong>{money(unitPrice * quantity)}</strong>
          <button type="button" onClick={() => removeItem(product.id)} className="text-sm underline" aria-label={`Eliminar ${product.name} ${product.variantName ?? product.code}`}>Eliminar</button>
        </li>)}</ul>
      <p className="mt-6 text-right text-xl font-bold">Total: {money(lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0))}</p>
      <p className="mt-3 text-sm text-foreground/60">El carrito no reserva stock. Los precios y la disponibilidad se verificarán al confirmar el pedido.</p>
      <Link href="/pedido/confirmar" className="mt-5 inline-block bg-emerald-600 px-5 py-3 font-bold text-white">Continuar con el pedido</Link>
    </>}
    <Link href="/" className="mt-6 inline-block border border-black/20 px-4 py-3 font-bold dark:border-white/20">Seguir comprando</Link>
  </main>;
}
