import { SectionPage } from "@/components/section-page";

export default function HistorialPage() {
  return <SectionPage eyebrow="Mi cuenta" title="Historial de compras" description="Tus ventas confirmadas y pedidos anteriores aparecerán en este espacio."><section className="empty-state"><span className="empty-index">00</span><h2>Aún no hay compras para mostrar.</h2><p>Cuando completes tu primera compra, podrás seguirla desde aquí.</p></section></SectionPage>;
}
