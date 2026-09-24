import Link from "next/link";
import { SectionPage } from "@/components/section-page";

export default function RubrosPage() {
  return <SectionPage eyebrow="Administración" title="Rubros y subrubros" description="Aquí construiremos la estructura que organiza el catálogo público."><section className="empty-state"><span className="empty-index">01</span><h2>Módulo en construcción</h2><p>La nueva gestión se conectará a la base de datos de la v2 después de definir el esquema tipado.</p><Link className="primary-action" href="/panel">Volver al panel <span aria-hidden="true">→</span></Link></section></SectionPage>;
}
