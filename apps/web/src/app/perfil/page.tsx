"use client";

import Link from "next/link";
import { SectionPage } from "@/components/section-page";
import { useAuth } from "@/contexts/auth-context";

export default function PerfilPage() {
  const { user, status, logout } = useAuth();
  if (status === "loading") return <SectionPage eyebrow="Mi cuenta" title="Cargando sesión..." />;
  if (!user) return <SectionPage eyebrow="Mi cuenta" title="Ingresá para continuar." description="Tu perfil, pedidos e historial estarán disponibles después de iniciar sesión."><Link className="primary-action" href="/login">Ingresar <span aria-hidden="true">→</span></Link></SectionPage>;

  return <SectionPage eyebrow="Mi cuenta" title={`Hola, ${user.nombre}.`} description="Desde aquí vas a poder administrar tus datos y revisar tu actividad."><section className="profile-state"><dl><div><dt>Usuario</dt><dd>@{user.usuario}</dd></div><div><dt>Rol</dt><dd>{user.roles.join(", ")}</dd></div></dl><button className="secondary-action" type="button" onClick={() => void logout()}>Cerrar sesión <span aria-hidden="true">↗</span></button></section></SectionPage>;
}
