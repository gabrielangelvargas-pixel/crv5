import Link from "next/link";
import { SectionPage } from "@/components/section-page";

export default function CatalogoPage() {
  return (
    <SectionPage eyebrow="Catálogo mayorista" title="Encontrá tu próximo producto." description="La estructura de rubros y subrubros será la fuente de navegación del catálogo público.">
      <section className="empty-state" aria-label="Catálogo en preparación">
        <span className="empty-index">01</span>
        <h2>Catálogo en preparación</h2>
        <p>Estamos preparando la nueva experiencia de rubros, productos y variantes.</p>
        <Link className="primary-action" href="/">Volver al inicio <span aria-hidden="true">→</span></Link>
      </section>
    </SectionPage>
  );
}
