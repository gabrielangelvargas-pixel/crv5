"use client";

import { useState } from "react";
import { FaPen, FaPlus, FaXmark } from "react-icons/fa6";
import type { AdminRole, AdminUser } from "@/lib/users-repository";

type Props = { initialUsers: AdminUser[]; roles: AdminRole[] };
type FormState = { id?: string; name: string; username: string; password: string; roleId: string; active: boolean; address: NonNullable<AdminUser["addressDetails"]> };
const emptyAddress = (): FormState["address"] => ({ label: "casa", phone: "", address: "", neighborhood: "", city: "", province: "", postalCode: "", reference: "" });
const emptyForm = (roleId: string): FormState => ({ name: "", username: "", password: "", roleId, active: true, address: emptyAddress() });

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value)).replace(", ", " ");
}

export function UsersManager({ initialUsers, roles }: Props) {
  const [users] = useState(initialUsers);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const defaultRole = roles.find((role) => role.code === "cliente")?.id ?? roles[0]?.id ?? "";

  const openCreate = () => { setError(""); setForm(emptyForm(defaultRole)); };
  const openEdit = (user: AdminUser) => {
    setError("");
    const role = roles.find((candidate) => user.roles.includes(candidate.name));
    setForm({ id: user.id, name: user.name, username: user.username, password: "", roleId: role?.id ?? defaultRole, active: user.active, address: user.addressDetails ?? emptyAddress() });
  };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true); setError("");
    const response = await fetch("/api/admin/users", { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "No se pudo guardar"); setSaving(false); return; }
    window.location.reload();
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black uppercase tracking-[0.05em]">Usuarios</h1>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 bg-black px-4 py-3 text-sm font-bold uppercase tracking-[0.06em] text-white hover:bg-black/80">
          <FaPlus aria-hidden="true" /> Nuevo usuario
        </button>
      </div>

      <div className="mt-4 overflow-x-auto border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.03] text-xs uppercase tracking-[0.08em] text-foreground/55 dark:border-white/10 dark:bg-white/[0.03]">
            <tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Último acceso</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acción</th></tr>
          </thead>
          <tbody>
            {users.map((user) => <tr key={user.id} className="border-b border-black/10 last:border-0 dark:border-white/10">
              <td className="px-4 py-4"><p className="font-bold">{user.name}</p><p className="text-xs text-foreground/55">@{user.username}</p></td>
              <td className="px-4 py-4 text-foreground/70"><p>{user.phone || "-"}</p><p className="max-w-xs text-xs text-foreground/55">{user.address || "Sin dirección"}</p></td>
              <td className="px-4 py-4 text-foreground/70">{user.roles.join(", ") || "Sin rol"}</td>
              <td className="px-4 py-4 text-foreground/70">{formatDate(user.lastAccess)}</td>
              <td className="px-4 py-4"><span className={user.active ? "font-bold text-emerald-700" : "font-bold text-red-600"}>{user.active ? "Activo" : "Inactivo"}</span></td>
              <td className="px-4 py-4 text-right"><button type="button" onClick={() => openEdit(user)} aria-label={`Editar ${user.name}`} className="inline-flex size-9 items-center justify-center border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"><FaPen aria-hidden="true" /></button></td>
            </tr>)}
          </tbody>
        </table>
      </div>

      {form ? <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <form onSubmit={save} className="box-border max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p><h2 id="user-form-title" className="mt-1 text-xl font-black uppercase">{form.id ? "Editar usuario" : "Nuevo usuario"}</h2></div><button type="button" onClick={() => setForm(null)} aria-label="Cerrar" className="flex size-9 items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><FaXmark /></button></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="text-sm font-bold">Nombre</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label><span className="text-sm font-bold">Usuario</span><input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label><span className="text-sm font-bold">Rol</span><select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15">{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
            <label className="sm:col-span-2"><span className="text-sm font-bold">Contraseña {form.id ? <span className="font-normal text-foreground/50">(dejar vacía para conservarla)</span> : null}</span><input required={!form.id} minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <div className="border-t border-black/10 pt-4 sm:col-span-2 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/55">Contacto y dirección</p></div>
            <label><span className="text-sm font-bold">Teléfono</span><input type="tel" value={form.address.phone} onChange={(e) => setForm({ ...form, address: { ...form.address, phone: e.target.value } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label><span className="text-sm font-bold">Etiqueta</span><select value={form.address.label} onChange={(e) => setForm({ ...form, address: { ...form.address, label: e.target.value as FormState["address"]["label"] } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15"><option value="casa">Casa</option><option value="trabajo">Trabajo</option><option value="deposito">Depósito</option><option value="otro">Otro</option></select></label>
            <label className="sm:col-span-2"><span className="text-sm font-bold">Dirección</span><input type="text" value={form.address.address} onChange={(e) => setForm({ ...form, address: { ...form.address, address: e.target.value } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label><span className="text-sm font-bold">Barrio</span><input type="text" value={form.address.neighborhood} onChange={(e) => setForm({ ...form, address: { ...form.address, neighborhood: e.target.value } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label><span className="text-sm font-bold">Localidad</span><input type="text" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label><span className="text-sm font-bold">Provincia</span><input type="text" value={form.address.province} onChange={(e) => setForm({ ...form, address: { ...form.address, province: e.target.value } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label><span className="text-sm font-bold">Código postal</span><input type="text" value={form.address.postalCode} onChange={(e) => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label className="sm:col-span-2"><span className="text-sm font-bold">Referencia</span><input type="text" value={form.address.reference} onChange={(e) => setForm({ ...form, address: { ...form.address, reference: e.target.value } })} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-black dark:border-white/15" /></label>
            <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4" /> Cuenta activa</label>
          </div>
          {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setForm(null)} className="border border-black/15 px-4 py-3 text-sm font-bold uppercase dark:border-white/15">Cancelar</button><button disabled={saving} className="bg-black px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button></div>
        </form>
      </div> : null}
    </div>
  );
}
