"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useCart } from "./cart-provider";
import { getCartUnitPrice } from "@/lib/cart";

export function CheckoutForm({ contact }: { contact: { phone: string; address: string } }) {
  const { items, products, ready, prepareCheckout, completeOrder } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"retiro" | "envio">("retiro");
  const [phone, setPhone] = useState(contact.phone);
  const [address, setAddress] = useState(contact.address);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const key = useRef<string | null>(null);
  const lines = items.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product, price: getCartUnitPrice(product, item.quantity) }] : [];
  });
  const totalCents = lines.reduce((sum, line) => sum + Math.round(line.price * 100) * line.quantity, 0);
  const money = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try {
      const snapshot = JSON.stringify(items);
      const saved = await prepareCheckout();
      if (JSON.stringify(saved.items) !== snapshot) throw new Error("El carrito cambió. Revisá las cantidades antes de confirmar.");
      key.current ??= crypto.randomUUID();
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: key.current, version: saved.version, expectedTotalCents: totalCents, delivery: { method, phone, address: method === "envio" ? address : "", notes } }) });
      const data = await response.json();
      if (response.status === 401) { router.push("/login?next=/pedido/confirmar"); return; }
      if (!response.ok) { if (response.status === 409) key.current = null; throw new Error(data.error ?? "No se pudo confirmar el pedido."); }
      completeOrder();
      router.push(`/pedidos?confirmado=${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo confirmar el pedido."); }
    finally { setSaving(false); }
  }
  if (!ready) return <p role="status">Cargando carrito…</p>;
  if (!lines.length) return <p>Tu carrito está vacío. <Link href="/" className="underline">Elegir productos</Link></p>;
  return <form onSubmit={submit} className="mt-6 space-y-5">
    <ul className="space-y-3">{lines.map((line) => <li key={line.productId} className="flex justify-between gap-3 border-b border-black/10 pb-3 text-sm"><span>{line.quantity} × {line.product.name} · {line.product.variantName ?? line.product.code}</span><strong>{money(Math.round(line.price * 100) * line.quantity / 100)}</strong></li>)}</ul>
    <p className="text-right text-xl font-bold">Total estimado: {money(totalCents / 100)}</p>
    <p className="text-sm text-foreground/70">Revisaremos el pedido y te confirmaremos el importe total antes del pago. El stock se descuenta al cerrar la venta después de recibir el pago. Podés alcanzar los $70.000 en varios pedidos.</p>
    <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold">Entrega<select value={method} onChange={(event) => setMethod(event.target.value as "retiro" | "envio")} className="mt-2 w-full border border-black/20 bg-white p-3"><option value="retiro">Retiro</option><option value="envio">Envío</option></select></label>
      <label className="text-sm font-bold">Teléfono de contacto<input required minLength={6} maxLength={30} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full border border-black/20 p-3" /></label>
      {method === "envio" ? <label className="text-sm font-bold sm:col-span-2">Dirección, localidad y provincia<input required minLength={5} maxLength={500} value={address} onChange={(event) => setAddress(event.target.value)} className="mt-2 w-full border border-black/20 p-3" /></label> : null}
      <label className="text-sm font-bold sm:col-span-2">Observaciones<textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full border border-black/20 p-3" /></label>
    </fieldset>
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? "Confirmando…" : "Confirmar pedido"}</button><Link href="/carrito" className="border border-black/20 px-5 py-3 font-bold">Volver al carrito</Link></div>
  </form>;
}
