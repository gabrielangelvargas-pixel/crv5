"use client";

import { cartPayableCents } from "@/lib/cart-adjustments";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaBoxOpen, FaMinus, FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { useCart } from "./cart-provider";
import { getCartUnitPrice } from "@/lib/cart";

const money = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export function CartContent() {
  const { cartId, prepareCheckout, refreshCart, adjustments, items, products, ready, status, confirmedLines, confirmedTotal, storageError, syncError, setQuantity, removeItem } = useCart();
  const lines = items.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product, unitPrice: confirmedLines?.find(line => line.productId === item.productId)?.unitPrice ?? getCartUnitPrice(product, item.quantity) }] : [];
  });
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  async function respond(action: "continue" | "accept") {
    if (busy) return;
    setBusy(true); setActionError("");
    try {
      const current = await prepareCheckout();
      const response = await fetch("/api/cart/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cartId, version: current.version, action, expectedTotalCents: cartPayableCents(subtotal, adjustments) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      refreshCart();
      router.push(action === "accept" ? `/pedidos?confirmado=${result.orderId}` : "/");
      router.refresh();
    } catch (error) { setActionError(error instanceof Error ? error.message : "No se pudo procesar el carrito."); refreshCart(); }
    finally { setBusy(false); }
  }
  const subtotal = confirmedTotal ?? lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
  return <main className="mx-auto max-w-4xl px-4 py-8 text-foreground">
    <h1 className="text-2xl font-black uppercase">Mi carrito</h1>
    {status === "confirmado" ? <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 p-4">Carrito confirmado y enviado a administración. Conserva sus productos y no genera un pedido.</p> : status === "actualizado" ? <p role="status" className="mt-4 border border-amber-200 bg-amber-50 p-4">Administración revisó tu carrito. Podés seguir comprando o confirmar el pedido para pagar.</p> : null}
    {status !== "activo" ? <p className="mt-2 text-sm">Si modificás los productos, el carrito vuelve a estar activo para revisión.</p> : null}
    {syncError ? <p role="status" className="mt-4 text-sm">La sincronización está pendiente o el carrito cambió desde otro dispositivo. Revisá las cantidades; reintentaremos guardar automáticamente.</p> : null}
    {storageError ? <p role="status" className="mt-4 text-sm">No pudimos guardar el carrito en este navegador. Podés seguir usándolo durante esta visita.</p> : null}
    {!ready ? <p className="mt-6" role="status">Cargando carrito…</p> : lines.length === 0 ? <p className="mt-6">Tu carrito está vacío.</p> : <>
      <ul className="mt-6 space-y-4">{lines.map(({ product, quantity, unitPrice }) =>
        <li key={product.id} className="border border-black/10 bg-white p-3 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden bg-black/[0.03] sm:size-24">
              {product.imageSrc ? <Image src={product.imageSrc} alt={product.name} fill sizes="(min-width: 640px) 96px, 80px" className="object-contain" /> : <FaBoxOpen aria-hidden="true" className="size-7 text-foreground/40" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold leading-snug sm:text-base">{product.name}</h2>
              <p className="mt-1 break-all text-xs text-foreground/60 sm:text-sm">SKU: {product.code}</p>
              {product.variantName ? <p className="mt-1 text-xs text-foreground/60 sm:text-sm">{product.variantName}</p> : null}
              <p className="mt-2 text-sm">{money(unitPrice)} por unidad</p>
              {status !== "activo" ? <p className="mt-1 text-xs font-bold text-foreground/60">{confirmedLines?.find(line => line.productId === product.id)?.reserved ? "Reservado" : "Agregado"}</p> : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3">
            <div className="flex items-center gap-2">
              <div role="group" aria-label={`Cantidad de ${product.name} ${product.code}`} className="flex items-center border border-black/20">
                <button type="button" disabled={quantity <= 1} onClick={() => setQuantity(product.id, quantity - 1)} className="flex size-11 items-center justify-center hover:bg-black/5 disabled:opacity-30" aria-label={`Restar una unidad de ${product.name}`}><FaMinus aria-hidden="true" className="size-3" /></button>
                <span aria-live="polite" aria-atomic="true" className="min-w-9 px-1 text-center font-bold">{quantity}</span>
                <button type="button" disabled={quantity >= product.stock} onClick={() => setQuantity(product.id, quantity + 1)} className="flex size-11 items-center justify-center hover:bg-black/5 disabled:opacity-30" aria-label={`Sumar una unidad de ${product.name}`}><FaPlus aria-hidden="true" className="size-3" /></button>
              </div>
              <button type="button" onClick={() => removeItem(product.id)} className="flex size-11 items-center justify-center text-foreground/60 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${product.name} ${product.code}`} title="Eliminar producto"><FaRegTrashAlt aria-hidden="true" className="size-4" /></button>
            </div>
            <strong className="ml-auto text-base">{money(unitPrice * quantity)}</strong>
          </div>
        </li>)}</ul>
      <p className="mt-6 text-right text-xl font-bold">Subtotal: {money(subtotal)}</p>
      <p className="mt-3 text-sm text-foreground/60">{status === "activo" ? "Agregar productos no reserva stock. Los precios y la disponibilidad se verificarán al confirmar el carrito." : "Las líneas marcadas como Reservado bloquean sus unidades para otros clientes hasta que se libere la reserva."}</p>
      {status === "activo" ? <Link href="/carrito/confirmar" className="mt-5 inline-block bg-emerald-600 px-5 py-3 font-bold text-white">Confirmar carrito</Link> : null}
    </>}
    {confirmedLines?.some(line => line.exhausted) ? <section className="mt-6 border border-red-200 bg-red-50 p-4"><h2 className="font-bold">Productos agotados</h2><ul className="mt-2 space-y-2">{confirmedLines.filter(line => line.exhausted).map(line => <li key={line.productId}>{line.quantity} × {line.name} · SKU: {line.code} · Agotado (no suma al total)</li>)}</ul></section> : null}
    {ready ? <div className="mt-4 space-y-2 border-t border-black/10 pt-4">{adjustments.map((item, index) => <p key={index} className="flex justify-between gap-3"><span>{item.description}</span><strong>{money(item.amountCents / 100)}</strong></p>)}<p className="text-right text-xl font-bold">Total a pagar: {money(cartPayableCents(subtotal, adjustments) / 100)}</p></div> : null}
    {actionError ? <p role="alert" className="mt-4 text-red-700">{actionError}</p> : null}
    <div className="mt-6 flex flex-wrap gap-3">
      {status === "actualizado" ? <button type="button" disabled={busy || !ready || !items.length} onClick={() => void respond("accept")} className="bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-40">{busy ? "Procesando…" : "Confirmar & Pagar"}</button> : null}
      {status === "actualizado" || status === "confirmado" ? <button type="button" disabled={busy || !ready} onClick={() => void respond("continue")} className="border border-black/20 px-4 py-3 font-bold disabled:opacity-40">Seguir comprando</button> : <Link href="/" className="inline-block border border-black/20 px-4 py-3 font-bold">Seguir comprando</Link>}
    </div>
  </main>;
}
