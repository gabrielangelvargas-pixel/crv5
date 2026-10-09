"use client";

import { Fragment, useState, type FormEvent } from "react";
import { FaBoxOpen, FaChevronDown, FaCopy, FaPen, FaPlus, FaXmark } from "react-icons/fa6";
import type { AdminCategory } from "@/lib/admin-categories-repository";
import type { AdminProduct, AdminProductGroup } from "@/lib/admin-products-repository";
import { groupByProductGroup } from "@/lib/product-groups";

type Props = { initialProducts: AdminProduct[]; categories: AdminCategory[]; groups: AdminProductGroup[] };
type Tier = { minimumQuantity: number; unitPrice: number };
type FormState = {
  id?: string; duplicate?: boolean; groupId: string | null; newGroupName: string; newGroupSlug: string; categoryId: string; code: string; name: string;
  variantName: string; slug: string; description: string; costPrice: number; salePrice: number; offerPrice: number | null; stock: number; imageUrl: string;
  order: number; active: boolean; priceTiers: Tier[]; imageFile: File | null;
};

const emptyForm = (categoryId: string): FormState => ({ groupId: null, newGroupName: "", newGroupSlug: "", categoryId, code: "", name: "", variantName: "", slug: "", description: "", costPrice: 0, salePrice: 0, offerPrice: null, stock: 0, imageUrl: "", order: 0, active: true, priceTiers: [], imageFile: null });

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatPrice(value: number) { return `$${value.toLocaleString("es-AR")}`; }

export function ProductsManager({ initialProducts, categories, groups }: Props) {
  const [products] = useState(initialProducts);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const defaultCategory = categories[0]?.id ?? "";

  function openCreate() { setError(""); setForm(emptyForm(defaultCategory)); }
  function openEdit(product: AdminProduct, duplicate = false) {
    setError("");
    setForm({ ...(duplicate ? {} : { id: product.id }), duplicate, groupId: product.groupId, newGroupName: "", newGroupSlug: "", categoryId: product.categoryId, code: duplicate ? "" : product.code, name: product.name, variantName: product.variantName ?? "", slug: duplicate ? "" : product.slug, description: product.description ?? "", costPrice: product.costPrice, salePrice: product.salePrice, offerPrice: product.offerPrice, stock: product.stock, imageUrl: duplicate ? "" : product.imageUrl ?? "", order: product.order, active: product.active, priceTiers: product.priceTiers.map((tier) => ({ ...tier })), imageFile: null });
  }
  function updateName(name: string) { if (!form) return; setForm({ ...form, name, slug: form.id || form.duplicate ? form.slug : slugify(name) }); }
  function updateGroup(value: string) { if (!form) return; setForm({ ...form, groupId: value === "__new__" ? "__new__" : value || null, newGroupName: value === "__new__" ? form.newGroupName : "", newGroupSlug: value === "__new__" ? form.newGroupSlug : "" }); }
  function updateTier(index: number, field: keyof Tier, value: number) { if (!form) return; const priceTiers = form.priceTiers.map((tier, tierIndex) => tierIndex === index ? { ...tier, [field]: value } : tier); setForm({ ...form, priceTiers }); }
  function addTier() { if (!form) return; setForm({ ...form, priceTiers: [...form.priceTiers, { minimumQuantity: form.priceTiers.length ? 3 : 1, unitPrice: form.salePrice }] }); }

  // Same grouping as the storefront cards: one entry per product group, standalone products alone.
  const productGroups = groupByProductGroup(products);
  const groupIds = productGroups.filter((group) => group.variants[0]!.groupId).map((group) => group.id);
  const groupCount = groupIds.length;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const allOpen = groupCount > 0 && groupIds.every((id) => openGroups.has(id));
  function toggleGroup(id: string) { setOpenGroups((current) => { const next = new Set(current); if (!next.delete(id)) next.add(id); return next; }); }
  function toggleAll() { setOpenGroups(allOpen ? new Set() : new Set(groupIds)); }

  function productCells(product: AdminProduct) {
    return <>
      <td className="px-4 py-3 font-semibold">{formatPrice(product.offerPrice ?? product.salePrice)}{product.priceTiers.length ? <span className="block text-xs font-normal text-foreground/55">{product.priceTiers.length} precio(s) por cantidad</span> : null}</td>
      <td className="px-4 py-3 text-foreground/70">{product.stock}</td>
      <td className="px-4 py-3"><span className={product.active ? "font-bold text-emerald-700" : "font-bold text-red-600"}>{product.active ? "Activo" : "Inactivo"}</span></td>
      <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEdit(product, true)} aria-label={`Duplicar ${product.name} (${product.code})`} title="Duplicar producto" className="inline-flex size-9 shrink-0 items-center justify-center border border-black/10 hover:bg-black/5 dark:border-white/10"><FaCopy aria-hidden="true" /></button><button type="button" onClick={() => openEdit(product)} aria-label={`Editar ${product.name} (${product.code})`} className="inline-flex size-9 items-center justify-center border border-black/10 hover:bg-black/5 dark:border-white/10"><FaPen /></button></div></td>
    </>;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    if (products.some((product) => product.id !== form.id && (product.code === form.code.trim() || product.slug === form.slug.trim()))) {
      setError("El código o slug ya existe. Usá valores nuevos para la copia.");
      return;
    }
    setSaving(true); setError("");
    try {
      let imageUrl = form.imageUrl;
      if (form.imageFile) {
        const data = new FormData(); data.set("file", form.imageFile); data.set("slug", form.slug);
        const uploadResponse = await fetch("/api/admin/products/upload", { method: "POST", body: data });
        const uploadResult = await uploadResponse.json() as { error?: string; path?: string };
        if (!uploadResponse.ok || !uploadResult.path) throw new Error(uploadResult.error ?? "No se pudo subir la imagen");
        imageUrl = uploadResult.path;
      }
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, imageUrl, priceTiers: form.priceTiers.filter((tier) => tier.minimumQuantity > 0 && tier.unitPrice >= 0) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo guardar el producto");
      window.location.reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el producto");
      setSaving(false);
    }
  }

  return <div className="mt-2">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-black uppercase tracking-[0.05em]">Productos</h1><button type="button" onClick={openCreate} className="flex items-center gap-2 bg-black px-4 py-3 text-sm font-bold uppercase tracking-[0.06em] text-white"><FaPlus aria-hidden="true" /> Nuevo producto</button></div>
    {groupCount ? <div className="mt-4 flex justify-end"><button type="button" onClick={toggleAll} className="text-xs font-bold uppercase tracking-[0.08em] text-foreground/60 underline-offset-4 hover:underline">{allOpen ? "Contraer todos" : "Expandir todos"}</button></div> : null}
    <div className="mt-2 overflow-x-auto border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-black/10 bg-black/[0.03] text-xs uppercase tracking-[0.08em] text-foreground/55 dark:border-white/10 dark:bg-white/[0.03]"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Precio</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acción</th></tr></thead>
      {productGroups.map((group) => {
        const first = group.variants[0]!;
        if (!first.groupId) return <tbody key={group.id} className="border-b border-black/10 last:border-0 dark:border-white/10"><tr><td className="px-4 py-4"><p className="font-bold">{first.name}</p><p className="font-mono text-xs text-foreground/55">{first.code}</p></td><td className="px-4 py-4 text-foreground/70">{first.categoryName}</td>{productCells(first)}</tr></tbody>;
        const open = openGroups.has(group.id);
        const panelId = `variantes-${first.groupId}`;
        const prices = group.variants.map((variant) => variant.offerPrice ?? variant.salePrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const activeCount = group.variants.filter((variant) => variant.active).length;
        return <Fragment key={group.id}>
          <tbody className="border-b border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]"><tr>
            <td className="px-4 py-4"><button type="button" onClick={() => toggleGroup(group.id)} aria-expanded={open} aria-controls={panelId} className="flex items-center gap-3 text-left"><FaChevronDown aria-hidden="true" className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} /><span><span className="block font-bold">{first.groupName ?? first.name}</span><span className="block text-xs text-foreground/55">{group.variants.length} {group.variants.length === 1 ? "variante" : "variantes"}</span></span></button></td>
            <td className="px-4 py-4 text-foreground/70">{[...new Set(group.variants.map((variant) => variant.categoryName))].join(", ")}</td>
            <td className="px-4 py-4 font-semibold">{minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}</td>
            <td className="px-4 py-4 text-foreground/70">{group.variants.reduce((total, variant) => total + variant.stock, 0)}</td>
            <td className="px-4 py-4">{activeCount === group.variants.length ? <span className="font-bold text-emerald-700">Activo</span> : activeCount === 0 ? <span className="font-bold text-red-600">Inactivo</span> : <span className="font-bold text-amber-700">{activeCount} de {group.variants.length} activas</span>}</td>
            <td className="px-4 py-4 text-right"><button type="button" onClick={() => openEdit(first, true)} aria-label={`Agregar variante a ${first.groupName ?? first.name}`} title="Agregar variante (copia la primera)" className="inline-flex size-9 items-center justify-center border border-black/10 hover:bg-black/5 dark:border-white/10"><FaPlus aria-hidden="true" /></button></td>
          </tr></tbody>
          <tbody id={panelId} hidden={!open} className="border-b border-black/10 dark:border-white/10">{group.variants.map((variant) => <tr key={variant.id} className="border-t border-black/5 dark:border-white/5"><td className="py-3 pl-12 pr-4"><p className="font-bold">{variant.variantName || "Sin variante"}</p>{variant.name !== (first.groupName ?? first.name) ? <p className="text-xs text-foreground/70">{variant.name}</p> : null}<p className="font-mono text-xs text-foreground/55">{variant.code}</p></td><td className="px-4 py-3 text-foreground/70">{variant.categoryName}</td>{productCells(variant)}</tr>)}</tbody>
        </Fragment>;
      })}
    </table></div>
    {products.length === 0 ? <p className="border-x border-b border-black/10 bg-white p-6 text-sm text-foreground/60 dark:border-white/10 dark:bg-zinc-950">No hay productos cargados.</p> : null}
    {form ? <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="product-form-title"><form onSubmit={save} className="box-border max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:max-h-[calc(100dvh-2rem)] sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p><h2 id="product-form-title" className="mt-1 text-xl font-black uppercase">{form.id ? "Editar producto" : form.duplicate ? "Duplicar producto" : "Nuevo producto"}</h2></div><button type="button" onClick={() => setForm(null)} aria-label="Cerrar" className="flex size-9 items-center justify-center"><FaXmark /></button></div>
      {form.duplicate ? <p className="mt-4 text-sm text-foreground/70">Completá un código y slug nuevos y seleccioná la imagen de la copia. El producto original no se modifica.</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-sm font-bold">Nombre</span><input required value={form.name} onChange={(e) => updateName(e.target.value)} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Código</span><input required maxLength={13} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value, slug: form.duplicate ? slugify(e.target.value) : form.slug })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Variante</span><input value={form.variantName} onChange={(e) => setForm({ ...form, variantName: e.target.value })} placeholder="Ej. Negra" className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label className="sm:col-span-2"><span className="text-sm font-bold">Categoría</span><select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15">{categories.map((category) => <option key={category.id} value={category.id}>{"　".repeat(category.depth)}{category.name}</option>)}</select></label><label><span className="text-sm font-bold">Grupo de producto</span><select value={form.groupId ?? ""} onChange={(e) => updateGroup(e.target.value)} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15"><option value="">Sin grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}<option value="__new__">+ Crear grupo nuevo</option></select></label><label><span className="text-sm font-bold">Orden</span><input type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label>{form.groupId === "__new__" ? <><label><span className="text-sm font-bold">Nombre del grupo</span><input required value={form.newGroupName} onChange={(e) => setForm({ ...form, newGroupName: e.target.value, newGroupSlug: slugify(e.target.value) })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Slug del grupo</span><input required value={form.newGroupSlug} onChange={(e) => setForm({ ...form, newGroupSlug: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 font-mono outline-none dark:border-white/15" /></label></> : null}<label className="sm:col-span-2"><span className="text-sm font-bold">Slug</span><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 font-mono outline-none dark:border-white/15" /></label><label className="sm:col-span-2"><span className="text-sm font-bold">Descripción</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full resize-y border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Precio de costo</span><input required type="number" min={0} max={9999999999.99} step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Precio de venta</span><input required type="number" min={0} step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Precio de oferta</span><input type="number" min={0} step="0.01" value={form.offerPrice ?? ""} onChange={(e) => setForm({ ...form, offerPrice: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Stock</span><input required type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Imagen WEBP</span><input type="file" accept="image/*" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} className="mt-1 block w-full text-sm" />{form.imageUrl ? <span className="mt-1 block truncate text-xs text-foreground/55">Actual: {form.imageUrl}</span> : null}</label></div>
      <fieldset className="mt-6 border-t border-black/10 pt-4 dark:border-white/10"><div className="flex items-center justify-between gap-3"><legend className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/55">Precios por cantidad</legend><button type="button" onClick={addTier} className="flex items-center gap-2 border border-black/15 px-3 py-2 text-xs font-bold uppercase dark:border-white/15"><FaPlus /> Agregar precio</button></div>{form.priceTiers.length ? <div className="mt-3 space-y-3">{form.priceTiers.map((tier, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label><span className="text-xs font-bold">Desde unidades</span><input required type="number" min={1} value={tier.minimumQuantity} onChange={(e) => updateTier(index, "minimumQuantity", Number(e.target.value))} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-2 dark:border-white/15" /></label><label><span className="text-xs font-bold">Precio unitario</span><input required type="number" min={0} step="0.01" value={tier.unitPrice} onChange={(e) => updateTier(index, "unitPrice", Number(e.target.value))} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-2 dark:border-white/15" /></label><button type="button" onClick={() => setForm({ ...form, priceTiers: form.priceTiers.filter((_, tierIndex) => tierIndex !== index) })} aria-label="Eliminar precio" className="mt-5 flex size-10 items-center justify-center border border-black/15 dark:border-white/15"><FaXmark /></button></div>)}</div> : <p className="mt-3 text-sm text-foreground/55">Sin precios especiales por cantidad.</p>}</fieldset>
      <label className="mt-5 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4" /> Producto activo</label>{error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setForm(null)} className="border border-black/15 px-4 py-3 text-sm font-bold uppercase dark:border-white/15">Cancelar</button><button disabled={saving} className="flex items-center gap-2 bg-black px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-50">{saving ? "Guardando..." : <><FaBoxOpen /> Guardar</>}</button></div>
    </form></div> : null}
  </div>;
}
