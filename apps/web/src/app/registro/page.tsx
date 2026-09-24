"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionPage } from "@/components/section-page";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, status } = useAuth();
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(nombre, usuario, clave);
      router.replace("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionPage eyebrow="Nueva cuenta" title="Registrate para continuar." description="Creá tu cuenta para confirmar pedidos y consultar tu historial de compras.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre completo</label>
        <input id="nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} autoComplete="name" required />
        <label htmlFor="usuario">Nombre de usuario</label>
        <input id="usuario" value={usuario} onChange={(event) => setUsuario(event.target.value)} autoComplete="username" pattern="[a-zA-Z0-9._-]{3,80}" required />
        <label htmlFor="clave">Clave</label>
        <input id="clave" type="password" value={clave} onChange={(event) => setClave(event.target.value)} autoComplete="new-password" minLength={8} required />
        <button className="primary-action" type="submit" disabled={submitting || status === "loading"}>{submitting ? "Creando cuenta..." : "Crear cuenta"}<span aria-hidden="true">→</span></button>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="form-help">¿Ya tenés cuenta? <Link href="/login">Ingresá</Link></p>
      </form>
    </SectionPage>
  );
}
