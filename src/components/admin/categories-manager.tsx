"use client";

import { useState, type FormEvent } from "react";
import { FaPen, FaPlus, FaXmark } from "react-icons/fa6";
import type { AdminCategory } from "@/lib/admin-categories-repository";

type Props = { initialCategories: AdminCategory[] };
type FormState = { id?: string; parentId: string | null; name: string; description: string; slug: string; imageUrl: string; coverUrl: string; order: number; active: boolean };
const emptyForm = (): FormState => ({ parentId: null, name: "", description: "", slug: "", imageUrl: "", coverUrl: "", order: 0, active: true });

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CategoriesManager({ initialCategories }: Props) {
  const [categories] = useState(initialCategories);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function editCategory(category: AdminCategory) { setError(""); setForm({ ...category, description: category.description ?? "", imageUrl: category.imageUrl ?? "", coverUrl: category.coverUrl ?? "" }); }
  function updateName(name: string) { if (!form) return; setForm({ ...form, name, slug: form.id ? form.slug : slugify(name) }); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true); setError("");
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "No se pudo guardar"); setSaving(false); return; }
    window.location.reload();
  }

  return <div className="mt-2">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-black uppercase tracking-[0.05em]">Categorías</h1><button type="button" onClick={() => { setError(""); setForm(emptyForm()); }} className="flex items-center gap-2 bg-black px-4 py-3 text-sm font-bold uppercase tracking-[0.06em] text-white"><FaPlus aria-hidden="true" /> Nueva categoría</button></div>
    <div className="mt-4 overflow-x-auto border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-black/10 bg-black/[0.03] text-xs uppercase tracking-[0.08em] text-foreground/55 dark:border-white/10 dark:bg-white/[0.03]"><tr><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Padre</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Orden</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acción</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} className="border-b border-black/10 last:border-0 dark:border-white/10"><td className="px-4 py-4"><p className="font-bold">{category.name}</p><p className="max-w-xs text-xs text-foreground/55">{category.description || "Sin descripción"}</p></td><td className="px-4 py-4 text-foreground/70">{category.parentName || "Principal"}</td><td className="px-4 py-4 font-mono text-xs text-foreground/70">{category.slug}</td><td className="px-4 py-4 text-foreground/70">{category.order}</td><td className="px-4 py-4"><span className={category.active ? "font-bold text-emerald-700" : "font-bold text-red-600"}>{category.active ? "Activa" : "Inactiva"}</span></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => editCategory(category)} aria-label={`Editar ${category.name}`} className="inline-flex size-9 items-center justify-center border border-black/10 hover:bg-black/5 dark:border-white/10"><FaPen aria-hidden="true" /></button></td></tr>)}</tbody></table></div>
    {form ? <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="category-form-title"><form onSubmit={save} className="box-border max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:max-h-[calc(100dvh-2rem)] sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p><h2 id="category-form-title" className="mt-1 text-xl font-black uppercase">{form.id ? "Editar categoría" : "Nueva categoría"}</h2></div><button type="button" onClick={() => setForm(null)} aria-label="Cerrar" className="flex size-9 items-center justify-center"><FaXmark /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-sm font-bold">Nombre</span><input required value={form.name} onChange={(e) => updateName(e.target.value)} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Categoría padre</span><select value={form.parentId ?? ""} onChange={(e) => setForm({ ...form, parentId: e.target.value || null })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15"><option value="">Principal</option>{categories.filter((category) => category.id !== form.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span className="text-sm font-bold">Orden</span><input required type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label className="sm:col-span-2"><span className="text-sm font-bold">Slug</span><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 font-mono outline-none dark:border-white/15" /></label><label className="sm:col-span-2"><span className="text-sm font-bold">Descripción</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full resize-y border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Imagen URL</span><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/categorias/imagen.webp" className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Portada URL</span><input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="/portadas/portada.webp" className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4" /> Categoría activa</label></div>{error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setForm(null)} className="border border-black/15 px-4 py-3 text-sm font-bold uppercase dark:border-white/15">Cancelar</button><button disabled={saving} className="bg-black px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button></div></form></div> : null}
  </div>;
}
