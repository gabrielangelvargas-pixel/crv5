"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "./cart-provider";
import { getCartUnitPrice } from "@/lib/cart";

export function CheckoutForm({ contact }: { contact: { phone: string; address: string; addresses: { id: string; label: string }[] } }) {
  const { items, products, ready, prepareCheckout, refreshCart, status } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"retiro" | "envio">("retiro");
  const [phone, setPhone] = useState(contact.phone);
  const [addressId, setAddressId] = useState(contact.addresses[0]?.id ?? "");
  const address = contact.addresses.find(entry => entry.id === addressId)?.label ?? "";
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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
      const response = await fetch("/api/cart/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: saved.version, expectedTotalCents: totalCents, delivery: { method, phone, addressId: method === "envio" ? addressId : null, address: method === "envio" ? address : "", notes } }) });
      const data = await response.json();
      if (response.status === 401) { router.push("/login?next=/carrito/confirmar"); return; }
      if (!response.ok) { throw new Error(data.error ?? "No se pudo confirmar el carrito."); }
      refreshCart();
      router.push("/carrito");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo confirmar el carrito."); }
    finally { setSaving(false); }
  }
  if (!ready) return <p role="status">Cargando carrito…</p>;
  if (!lines.length) return <p>Tu carrito está vacío. <Link href="/" className="underline">Elegir productos</Link></p>;
  if (status !== "activo") return <p className="mt-6">Tu carrito ya fue enviado. <Link href="/carrito" className="underline">Ver carrito y modificaciones</Link></p>;
  return <form onSubmit={submit} className="mt-6 space-y-5">
    <ul className="space-y-3">{lines.map((line) => <li key={line.productId} className="flex justify-between gap-3 border-b border-black/10 pb-3 text-sm"><span>{line.quantity} × {line.product.name} · {line.product.variantName ?? line.product.code}</span><strong>{money(Math.round(line.price * 100) * line.quantity / 100)}</strong></li>)}</ul>
    <p className="text-right text-xl font-bold">Total estimado: {money(totalCents / 100)}</p>
    <p className="text-sm text-foreground/70">El carrito se enviará a administración para revisión y conservará sus productos. No genera un pedido ni reserva stock. Después de la revisión podrás seguir comprando o confirmar el pedido para pagar. No hay un mínimo para enviar el carrito.</p>
    <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold">Entrega<select value={method} onChange={(event) => setMethod(event.target.value as "retiro" | "envio")} className="mt-2 w-full border border-black/20 bg-white p-3"><option value="retiro">Retiro</option><option value="envio">Envío</option></select></label>
      <label className="text-sm font-bold">Teléfono de contacto<input required minLength={6} maxLength={30} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full border border-black/20 p-3" /></label>
      {method === "envio" ? <label className="text-sm font-bold sm:col-span-2">Dirección de envío<select required value={addressId} onChange={(event) => setAddressId(event.target.value)} className="mt-2 w-full border border-black/20 bg-white p-3"><option value="">Elegir dirección guardada</option>{contact.addresses.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select>{!contact.addresses.length ? <span className="mt-2 block font-normal">No tenés una dirección guardada. Contactá a administración para cargarla o elegí retiro.</span> : null}</label> : null}
      <label className="text-sm font-bold sm:col-span-2">Observaciones<textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full border border-black/20 p-3" /></label>
    </fieldset>
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? "Confirmando…" : "Confirmar carrito"}</button><Link href="/carrito" className="border border-black/20 px-5 py-3 font-bold">Volver al carrito</Link></div>
  </form>;
}
