"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/orders-repository";
import type { Product } from "@/data/products";
const money = (v: number) => v.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
export function OrderEditor({ order, products }: { order: Order; products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(order.lines.map(l => ({ productId: l.productId, quantity: l.quantity })));
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const changed = JSON.stringify(items) !== JSON.stringify(order.lines.map(l => ({ productId: l.productId, quantity: l.quantity })));
  const price = (id: string, quantity: number) => {
    const p = products.find(p => p.id === id);
    return p ? Math.min(p.salePrice, p.offerPrice ?? p.salePrice, ...p.priceTiers.filter(t => t.minimumQuantity <= quantity).map(t => t.unitPrice)) : order.lines.find(l => l.productId === id)?.unitPrice ?? 0;
  };
  async function save() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ original: order.lines, items }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOpen(false); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  }
  if (!open) return <button className="mt-4 border px-4 py-2 font-bold" onClick={() => { setItems(order.lines.map(l => ({ productId: l.productId, quantity: l.quantity }))); setError(""); setSearch(""); setOpen(true); }}>Editar pedido</button>;
  return <section className="mt-4 border p-4" aria-label="Editar pedido">
    <fieldset disabled={busy} className="space-y-4">
      {items.map(item => { const p = products.find(p => p.id === item.productId); const old = order.lines.find(l => l.productId === item.productId); return <div key={item.productId} className="flex flex-wrap items-center gap-3 border-b pb-3">
        <span className="min-w-40 flex-1">{p?.name ?? old?.name} · {p?.variantName ?? old?.variant ?? p?.code ?? old?.code}</span>
        <label>Cantidad <input aria-label={`Cantidad de ${p?.name ?? old?.name}`} type="number" min="1" max={p?.stock ?? undefined} value={item.quantity} className="ml-2 w-20 border p-2" onChange={e => setItems(items.map(i => i.productId === item.productId ? { ...i, quantity: Number(e.target.value) } : i))} /></label>
        <strong>{money(Math.round(price(item.productId, item.quantity) * 100) * item.quantity / 100)}</strong>
        <button className="underline" onClick={() => setItems(items.filter(i => i.productId !== item.productId))}>Quitar</button>
      </div>; })}
      <label className="block">Agregar producto<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, código o variante" className="mt-2 block w-full border p-2" /></label>
      {search.trim() && <ul className="max-h-64 overflow-auto">{products.filter(p => p.stock > 0 && !items.some(i => i.productId === p.id) && `${p.name} ${p.code} ${p.variantName ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 30).map(p => <li key={p.id} className="flex items-center justify-between gap-3 border-b py-2"><span>{p.name} · {p.variantName ?? p.code} · Stock {p.stock}</span><button className="border px-3 py-2" onClick={() => { setItems([...items, { productId: p.id, quantity: 1 }]); setSearch(""); }}>Agregar</button></li>)}</ul>}
      <p className="font-bold">Total estimado: {money(items.reduce((s, i) => s + Math.round(price(i.productId, i.quantity) * 100) * i.quantity, 0) / 100)}</p>
      <p className="text-sm">Se aplican los precios actuales por variante y cantidad. El stock no se descuenta al editar.</p>
      <div className="flex gap-3"><button className="bg-black px-4 py-2 text-white disabled:opacity-40" disabled={!changed || !items.length || items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1)} onClick={save}>{busy ? "Guardando…" : "Guardar cambios"}</button><button className="border px-4 py-2" onClick={() => setOpen(false)}>Cancelar</button></div>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
  </section>;
}