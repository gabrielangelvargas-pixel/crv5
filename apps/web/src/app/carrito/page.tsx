import Link from "next/link";
import { SectionPage } from "@/components/section-page";

export default function CarritoPage() {
  return (
    <SectionPage eyebrow="Tu selección" title="Carrito" description="Revisá tus productos antes de enviar el pedido.">
      <section className="empty-state" aria-label="Carrito vacío">
        <span className="empty-index">00</span>
        <h2>Todavía no agregaste productos.</h2>
        <p>Cuando encuentres algo para tu negocio, aparecerá aquí con su cantidad y total.</p>
        <Link className="primary-action" href="/catalogo">Explorar catálogo <span aria-hidden="true">→</span></Link>
      </section>
    </SectionPage>
  );
}
