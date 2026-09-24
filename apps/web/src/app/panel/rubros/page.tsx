"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SectionPage } from "@/components/section-page";
import { useAuth } from "@/contexts/auth-context";

type Rubro = { id: number; idRubroPadre: number | null; nombre: string; slug: string; orden: number; activo: boolean };

export default function RubrosPage() {
  const { user, status } = useAuth();
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    fetch("/api/admin/rubros", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No se pudieron cargar los rubros.");
        setRubros(payload.rubros ?? []);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar los rubros."))
      .finally(() => setLoading(false));
  }, [status, user]);

  const parents = useMemo(() => rubros.filter((rubro) => rubro.idRubroPadre === null), [rubros]);
  const childrenOf = (parentId: number) => rubros.filter((rubro) => rubro.idRubroPadre === parentId);
  const isManager = user?.roles.some((role) => role === "admin" || role === "supervisor");

  if (status === "loading" || loading) return <SectionPage eyebrow="Administración" title="Rubros y subrubros" description="Cargando estructura..." />;
  if (!user || !isManager) return <SectionPage eyebrow="Administración" title="Acceso restringido." description="No tenés permisos para administrar la estructura del catálogo."><Link className="primary-action" href="/panel">Volver al panel <span aria-hidden="true">→</span></Link></SectionPage>;

  return (
    <SectionPage eyebrow="Administración" title="Rubros y subrubros" description="Ordená la estructura que organiza el catálogo público.">
      <div className="module-toolbar"><span>{rubros.length} elementos en la estructura</span><button className="primary-action" type="button" disabled>Nuevo rubro <span aria-hidden="true">+</span></button></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!error && parents.length === 0 && <section className="empty-state"><h2>No hay rubros cargados.</h2><p>La estructura aparecerá aquí cuando se creen los primeros rubros.</p></section>}
      <section className="rubro-list" aria-label="Rubros del catálogo">
        {parents.map((parent) => (
          <article className="rubro-group" key={parent.id}>
            <div className="rubro-row"><div><span className="rubro-order">{String(parent.orden).padStart(2, "0")}</span><strong>{parent.nombre}</strong><small>{parent.slug}</small></div><span className={parent.activo ? "status-active" : "status-inactive"}>{parent.activo ? "Activo" : "Inactivo"}</span></div>
            {childrenOf(parent.id).map((child) => <div className="rubro-child" key={child.id}><span>↳</span><div><strong>{child.nombre}</strong><small>{child.slug}</small></div><span className={child.activo ? "status-active" : "status-inactive"}>{child.activo ? "Activo" : "Inactivo"}</span></div>)}
          </article>
        ))}
      </section>
    </SectionPage>
  );
}
