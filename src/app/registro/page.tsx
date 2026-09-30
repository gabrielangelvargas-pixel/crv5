"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import type { AuthUser } from "@/data/auth";

const steps = ["Tus datos", "Dirección", "Acceso"];

type RegistrationForm = {
  name: string;
  address: {
    label: "casa" | "trabajo" | "deposito" | "otro";
    phone: string;
    address: string;
    neighborhood: string;
    city: string;
    province: string;
    postalCode: string;
    reference: string;
  };
  username: string;
  password: string;
  passwordConfirmation: string;
};

const initialForm: RegistrationForm = {
  name: "",
  address: { label: "casa", phone: "", address: "", neighborhood: "", city: "", province: "", postalCode: "", reference: "" },
  username: "",
  password: "",
  passwordConfirmation: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateAddress(field: keyof RegistrationForm["address"], value: string) {
    setForm((current) => ({ ...current, address: { ...current.address, [field]: value } }));
  }

  function validateStep() {
    if (step === 0 && (form.name.trim().length < 2 || form.address.phone.trim().length < 6)) return "Completá tu nombre y teléfono.";
    if (step === 1 && (!form.address.address.trim() || !form.address.city.trim() || !form.address.province.trim())) return "Completá la dirección, localidad y provincia.";
    if (step === 2) {
      if (form.username.trim().length < 3 || form.password.length < 8) return "El usuario debe tener al menos 3 caracteres y la contraseña 8.";
      if (form.password !== form.passwordConfirmation) return "Las contraseñas no coinciden.";
    }
    return null;
  }

  function nextStep() {
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }
    setError(null); setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, username: form.username, password: form.password, address: form.address }),
      });
      const result = (await response.json()) as { error?: string; user?: AuthUser };
      if (!response.ok) { setError(result.error ?? "No se pudo crear la cuenta"); return; }
      setUser(result.user ?? null);
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-4 py-10 text-foreground">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-8">
        <h1 className="text-2xl font-black uppercase tracking-[0.06em]">Crear cuenta</h1>
        <p className="mt-2 text-sm text-foreground/60">Completá tus datos para realizar y consultar tus pedidos.</p>

        <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Progreso del registro">
          {steps.map((label, index) => <li key={label} className={`border-t-4 pt-2 text-xs font-bold uppercase tracking-[0.08em] ${index <= step ? "border-emerald-600 text-foreground" : "border-black/10 text-foreground/40 dark:border-white/10"}`}>{index + 1}. {label}</li>)}
        </ol>

        <div className="mt-7 space-y-4">
          {step === 0 ? <>
            <h2 className="text-lg font-black uppercase">Tus datos</h2>
            <label className="block text-sm font-semibold">Nombre completo<input name="name" type="text" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" required /></label>
            <label className="block text-sm font-semibold">Teléfono<input name="phone" type="tel" autoComplete="tel" value={form.address.phone} onChange={(event) => updateAddress("phone", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" required /></label>
          </> : null}

          {step === 1 ? <>
            <h2 className="text-lg font-black uppercase">Dirección de entrega</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Etiqueta<select value={form.address.label} onChange={(event) => updateAddress("label", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15"><option value="casa">Casa</option><option value="trabajo">Trabajo</option><option value="deposito">Depósito</option><option value="otro">Otro</option></select></label>
              <label className="block text-sm font-semibold">Código postal<input type="text" value={form.address.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" /></label>
              <label className="block text-sm font-semibold sm:col-span-2">Dirección<input type="text" autoComplete="street-address" value={form.address.address} onChange={(event) => updateAddress("address", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" required /></label>
              <label className="block text-sm font-semibold">Barrio<input type="text" value={form.address.neighborhood} onChange={(event) => updateAddress("neighborhood", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" /></label>
              <label className="block text-sm font-semibold">Localidad<input type="text" autoComplete="address-level2" value={form.address.city} onChange={(event) => updateAddress("city", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" required /></label>
              <label className="block text-sm font-semibold">Provincia<input type="text" autoComplete="address-level1" value={form.address.province} onChange={(event) => updateAddress("province", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" required /></label>
              <label className="block text-sm font-semibold sm:col-span-2">Referencia <span className="font-normal text-foreground/50">(opcional)</span><input type="text" value={form.address.reference} onChange={(event) => updateAddress("reference", event.target.value)} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" /></label>
            </div>
          </> : null}

          {step === 2 ? <>
            <h2 className="text-lg font-black uppercase">Datos de acceso</h2>
            <label className="block text-sm font-semibold">Usuario<input name="username" type="text" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" required /></label>
            <label className="block text-sm font-semibold">Contraseña<input name="password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" minLength={8} required /></label>
            <label className="block text-sm font-semibold">Repetir contraseña<input name="passwordConfirmation" type="password" autoComplete="new-password" value={form.passwordConfirmation} onChange={(event) => setForm({ ...form, passwordConfirmation: event.target.value })} className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15" minLength={8} required /></label>
          </> : null}
        </div>

        {error ? <p className="mt-5 text-sm font-semibold text-red-600" role="alert">{error}</p> : null}

        <div className="mt-7 flex flex-wrap justify-between gap-3">
          {step > 0 ? <button type="button" onClick={() => { setError(null); setStep((current) => current - 1); }} className="border border-black/15 px-4 py-3 text-sm font-black uppercase dark:border-white/15">Atrás</button> : <span />}
          {step < steps.length - 1 ? <button type="button" onClick={nextStep} className="bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white dark:bg-white dark:text-zinc-950">Continuar</button> : <button type="submit" disabled={isSubmitting} className="bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-zinc-950">{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</button>}
        </div>

        <p className="mt-5 text-center text-sm text-foreground/60">¿Ya tenés una cuenta? <Link href="/login" className="font-bold text-foreground underline">Iniciá sesión</Link></p>
      </form>
    </main>
  );
}
