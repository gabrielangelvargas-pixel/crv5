"use client";
import { FaMinus, FaPlus, FaRegTrashAlt } from "react-icons/fa";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/orders-repository";
import type { Product } from "@/data/products";
const money = (v: number) => v.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
export function OrderEditor({ order, products, cartVersion }: { order: Order; products: Pick<Product, "id" | "name" | "code" | "variantName" | "stock" | "salePrice" | "offerPrice" | "priceTiers">[]; cartVersion?: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initialItems = () => order.lines.map(l => ({ productId: l.productId, quantity: l.quantity, reserved: l.reserved ?? false }));
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const changed = JSON.stringify(items) !== JSON.stringify(initialItems());
  const price = (id: string, quantity: number) => {
    const p = products.find(p => p.id === id);
    return p ? Math.min(p.salePrice, p.offerPrice ?? p.salePrice, ...p.priceTiers.filter(t => t.minimumQuantity <= quantity).map(t => t.unitPrice)) : order.lines.find(l => l.productId === id)?.unitPrice ?? 0;
  };
  async function save() {
    setBusy(true); setError("");
    try {
      const response = await fetch(cartVersion === undefined ? `/api/orders/${order.id}` : `/api/admin/carts/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ original: order.lines, items, version: cartVersion }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOpen(false); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  }
  if (!open) return <button className="mt-4 border px-4 py-2 font-bold" onClick={() => { setItems(initialItems()); setError(""); setSearch(""); setOpen(true); }}>{cartVersion === undefined ? "Editar pedido" : "Editar carrito"}</button>;
  return <section className="mt-4 border p-4" aria-label={cartVersion === undefined ? "Editar pedido" : "Editar carrito"}>
    <fieldset disabled={busy} className="space-y-4">
      <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b pb-2 text-xs font-bold uppercase text-foreground/60 sm:grid"><span>Producto</span><span className="w-32 text-center">Cantidad</span><span className="w-28 text-center">Reservado</span><span className="w-32 text-right">Subtotal</span></div>
      {items.map(item => { const p = products.find(p => p.id === item.productId); const old = order.lines.find(l => l.productId === item.productId); const name = p?.name ?? old?.name; return <div key={item.productId} className="grid grid-cols-2 gap-3 border-b pb-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
        <div className="col-span-2 min-w-0 sm:col-span-1"><p className="font-bold">{name}</p><p className="mt-1 text-xs text-foreground/60">SKU: {p?.code ?? old?.code}{p?.variantName ? ` · ${p.variantName}` : ""}</p><p className="mt-1 text-xs text-foreground/60">Stock disponible: {p?.stock ?? 0}</p></div>
        <div role="group" aria-label={`Cantidad de ${name}`} className="flex w-32 items-center justify-between border border-black/20">
          <button type="button" disabled={item.quantity <= 1} aria-label={`Restar una unidad de ${name}`} className="flex size-11 items-center justify-center hover:bg-black/5 disabled:opacity-30" onClick={() => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity - 1, reserved: false } : i))}><FaMinus aria-hidden="true" className="size-3" /></button>
          <span aria-live="polite" className="font-bold">{item.quantity}</span>
          <button type="button" disabled={cartVersion === undefined ? item.quantity >= (p?.stock ?? 0) : item.quantity >= 1000000} aria-label={`Sumar una unidad de ${name}`} className="flex size-11 items-center justify-center hover:bg-black/5 disabled:opacity-30" onClick={() => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1, reserved: false } : i))}><FaPlus aria-hidden="true" className="size-3" /></button>
        </div>
        {cartVersion !== undefined ? <label className="flex min-h-11 w-28 items-center gap-2 text-sm sm:justify-center"><input type="checkbox" checked={item.reserved} aria-label={`Reservado: ${name}`} className="size-5 accent-emerald-600" onChange={e => setItems(items.map(i => i.productId === item.productId ? { ...i, reserved: e.target.checked } : i))} />{item.reserved ? "Reservado" : "Pendiente"}</label> : <span className="hidden w-28 sm:block" />}
        <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:w-32"><strong className="text-sm">{money(Math.round(price(item.productId, item.quantity) * 100) * item.quantity / 100)}</strong><button type="button" aria-label={`Eliminar ${name}`} title="Eliminar producto" className="flex size-11 shrink-0 items-center justify-center text-foreground/60 hover:bg-red-50 hover:text-red-600" onClick={() => setItems(items.filter(i => i.productId !== item.productId))}><FaRegTrashAlt aria-hidden="true" className="size-4" /></button></div>
      </div>; })}
      <label className="block">Agregar producto<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, código o variante" className="mt-2 block w-full border p-2" /></label>
      {search.trim() && <ul className="max-h-64 overflow-auto">{products.filter(p => (cartVersion !== undefined || p.stock > 0) && !items.some(i => i.productId === p.id) && `${p.name} ${p.code} ${p.variantName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 30).map(p => <li key={p.id} className="flex items-center justify-between gap-3 border-b py-2"><span>{p.name} · {p.variantName ?? p.code} · Stock {p.stock}</span><button className="border px-3 py-2" onClick={() => { setItems([...items, { productId: p.id, quantity: 1, reserved: false }]); setSearch(""); }}>Agregar</button></li>)}</ul>}
      <p className="font-bold">Total estimado: {money(items.reduce((s, i) => s + Math.round(price(i.productId, i.quantity) * 100) * i.quantity, 0) / 100)}</p>
      <p className="text-sm">Se aplican los precios actuales por variante y cantidad. El stock no se descuenta al editar.</p>
      {cartVersion !== undefined ? <p className="text-sm">Los productos sin stock pueden quedar pendientes de ingreso. Cambiar una cantidad vuelve a dejar esa línea pendiente. Se guardará como actualizado por administración. La aceptación del cliente se habilitará en el próximo paso.</p> : null}
      <div className="flex gap-3"><button className="bg-black px-4 py-2 text-white disabled:opacity-40" disabled={!changed || !items.length || items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1)} onClick={save}>{busy ? "Guardando…" : "Guardar cambios"}</button><button className="border px-4 py-2" onClick={() => setOpen(false)}>Cancelar</button></div>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
  </section>;
}