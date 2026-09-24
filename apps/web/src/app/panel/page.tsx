"use client";

import Link from "next/link";
import { SectionPage } from "@/components/section-page";
import { useAuth } from "@/contexts/auth-context";

export default function PanelPage() {
  const { user, status } = useAuth();
  if (status === "loading") return <SectionPage eyebrow="Panel principal" title="Verificando sesión..." />;
  if (!user) return <SectionPage eyebrow="Panel principal" title="Acceso restringido." description="Ingresá con una cuenta autorizada para acceder a la gestión."><Link className="primary-action" href="/login">Ingresar <span aria-hidden="true">→</span></Link></SectionPage>;
  if (user.roles.includes("cliente")) return <SectionPage eyebrow="Mi cuenta" title="Tu cuenta no tiene acceso administrativo." description="Podés consultar el catálogo y gestionar tus pedidos desde las páginas públicas."><Link className="primary-action" href="/catalogo">Ir al catálogo <span aria-hidden="true">→</span></Link></SectionPage>;

  return <SectionPage eyebrow="Panel principal" title="Módulos de gestión." description={`Sesión activa para ${user.nombre}.`}><section className="module-list"><Link href="/panel/rubros"><span className="module-number">01</span><div><strong>Rubros y subrubros</strong><small>Estructura del catálogo público.</small></div><span aria-hidden="true">→</span></Link><article><span className="module-number">02</span><div><strong>Productos</strong><small>En preparación.</small></div></article><article><span className="module-number">03</span><div><strong>Pedidos y ventas</strong><small>En preparación.</small></div></article></section></SectionPage>;
}
