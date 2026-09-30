"use client";

import { useState, type FormEvent } from "react";
import { FaPen, FaPlus, FaXmark } from "react-icons/fa6";
import type { AdminPermission, AdminRole } from "@/lib/roles-repository";

type Props = { initialRoles: AdminRole[]; permissions: AdminPermission[] };
type FormState = { id?: string; code: string; name: string; description: string; active: boolean; permissionIds: string[] };
const emptyForm = (): FormState => ({ code: "", name: "", description: "", active: true, permissionIds: [] });

export function RolesManager({ initialRoles, permissions }: Props) {
  const [roles] = useState(initialRoles);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const modules = [...new Set(permissions.map((permission) => permission.module))];

  function editRole(role: AdminRole) {
    setError("");
    setForm({ ...role, description: role.description ?? "", permissionIds: permissions.filter((permission) => role.permissions.includes(permission.code)).map((permission) => permission.id) });
  }

  function togglePermission(id: string) {
    if (!form) return;
    const permissionIds = form.permissionIds.includes(id) ? form.permissionIds.filter((permissionId) => permissionId !== id) : [...form.permissionIds, id];
    setForm({ ...form, permissionIds });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true); setError("");
    const response = await fetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "No se pudo guardar"); setSaving(false); return; }
    window.location.reload();
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">{roles.length} roles configurados</p>
        <button type="button" onClick={() => { setError(""); setForm(emptyForm()); }} className="flex items-center gap-2 bg-black px-4 py-3 text-sm font-bold uppercase tracking-[0.06em] text-white"><FaPlus aria-hidden="true" /> Nuevo rol</button>
      </div>
      <div className="mt-4 overflow-x-auto border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
        <table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-black/10 bg-black/[0.03] text-xs uppercase tracking-[0.08em] text-foreground/55 dark:border-white/10 dark:bg-white/[0.03]"><tr><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Permisos</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acción</th></tr></thead><tbody>{roles.map((role) => <tr key={role.id} className="border-b border-black/10 last:border-0 dark:border-white/10"><td className="px-4 py-4"><p className="font-bold">{role.name}</p><p className="text-xs text-foreground/55">{role.description || "Sin descripción"}</p></td><td className="px-4 py-4 font-mono text-xs text-foreground/70">{role.code}</td><td className="px-4 py-4 text-foreground/70">{role.permissions.length}</td><td className="px-4 py-4"><span className={role.active ? "font-bold text-emerald-700" : "font-bold text-red-600"}>{role.active ? "Activo" : "Inactivo"}</span></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => editRole(role)} aria-label={`Editar ${role.name}`} className="inline-flex size-9 items-center justify-center border border-black/10 hover:bg-black/5 dark:border-white/10"><FaPen aria-hidden="true" /></button></td></tr>)}</tbody></table>
      </div>
      {form ? <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="role-form-title"><form onSubmit={save} className="box-border max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p><h2 id="role-form-title" className="mt-1 text-xl font-black uppercase">{form.id ? "Editar rol" : "Nuevo rol"}</h2></div><button type="button" onClick={() => setForm(null)} aria-label="Cerrar" className="flex size-9 items-center justify-center"><FaXmark /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-bold">Nombre</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label><span className="text-sm font-bold">Código</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 font-mono outline-none dark:border-white/15" /></label><label className="sm:col-span-2"><span className="text-sm font-bold">Descripción</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full resize-y border border-black/15 bg-transparent px-3 py-3 outline-none dark:border-white/15" /></label><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4" /> Rol activo</label></div>
        <fieldset className="mt-6 border-t border-black/10 pt-4 dark:border-white/10"><legend className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/55">Permisos</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{modules.map((module) => <div key={module} className="border border-black/10 p-3 dark:border-white/10"><p className="font-bold uppercase tracking-[0.06em]">{module}</p><div className="mt-2 space-y-2">{permissions.filter((permission) => permission.module === module).map((permission) => <label key={permission.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.permissionIds.includes(permission.id)} onChange={() => togglePermission(permission.id)} className="mt-0.5 size-4" /><span><span className="font-semibold">{permission.name}</span><span className="block text-xs text-foreground/55">{permission.description}</span></span></label>)}</div></div>)}</div></fieldset>
        {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setForm(null)} className="border border-black/15 px-4 py-3 text-sm font-bold uppercase dark:border-white/15">Cancelar</button><button disabled={saving} className="bg-black px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button></div>
      </form></div> : null}
    </div>
  );
}
