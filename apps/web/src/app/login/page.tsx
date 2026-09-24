"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionPage } from "@/components/section-page";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(usuario, clave);
      router.replace("/panel");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return <SectionPage eyebrow="Acceso seguro" title="Ingresá a tu cuenta." description="Desde allí podrás revisar pedidos, compras y herramientas de gestión."><form className="auth-form" onSubmit={handleSubmit}><label htmlFor="usuario">Nombre de usuario</label><input id="usuario" value={usuario} onChange={(event) => setUsuario(event.target.value)} autoComplete="username" required /><label htmlFor="clave">Clave</label><input id="clave" type="password" value={clave} onChange={(event) => setClave(event.target.value)} autoComplete="current-password" required /><button className="primary-action" type="submit" disabled={submitting || status === "loading"}>{submitting ? "Ingresando..." : "Ingresar"}<span aria-hidden="true">→</span></button>{error && <p className="form-error" role="alert">{error}</p>}<p className="form-help">¿Todavía no tenés cuenta? <Link href="/registro">Registrate</Link></p></form></SectionPage>;
}
