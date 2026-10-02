"use client";
import { useEffect, useId, useRef, useState } from "react";
import { parseAdjustmentAmount } from "@/lib/cart-adjustments";

type AdjustmentDraft = { description: string; amount: string };
export function AdjustmentModal({ onAdd, onClose }: { onAdd: (item: AdjustmentDraft) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState(false);
  const cents = parseAdjustmentAmount(amount);
  const valid = description.trim().length > 0 && description.trim().length <= 120 && cents !== null;
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={onClose} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto bg-white p-5 text-foreground shadow-2xl backdrop:bg-black/60">
    <form onSubmit={event => { event.preventDefault(); if (!valid || cents === null) return; onAdd({ description: description.trim(), amount: ((discount ? -Math.abs(cents) : cents) / 100).toFixed(2) }); }} className="space-y-4">
      <h2 id={titleId} className="text-xl font-bold">Agregar concepto</h2>
      <label className="block text-sm font-bold">Concepto<input autoFocus required maxLength={120} value={description} onChange={event => setDescription(event.target.value)} placeholder="Ej. redondeo o gasto de envío" className="mt-1 block w-full border border-black/20 p-3 font-normal" /></label>
      <label className="block text-sm font-bold">Importe<input required type="text" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0,00" className="mt-1 block w-full border border-black/20 p-3 font-normal" /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={discount} onChange={event => setDiscount(event.target.checked)} className="size-5 accent-emerald-600" />Descontar del subtotal</label>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="border border-black/20 px-4 py-3 font-bold">Cancelar</button><button type="submit" disabled={!valid} className="bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-40">Agregar</button></div>
    </form>
  </dialog>;
}
