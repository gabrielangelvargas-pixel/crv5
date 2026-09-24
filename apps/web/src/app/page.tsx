import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "./page.module.css";

const highlights = [
  { number: "01", title: "Catálogo ordenado", text: "Rubros y subrubros claros para encontrar cada producto." },
  { number: "02", title: "Pedidos simples", text: "Elegí, revisá tu carrito y enviá tu pedido en pocos pasos." },
  { number: "03", title: "Atención cercana", text: "Tu pedido continúa con un equipo que conoce tu negocio." },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Regalería · Bijouterie · Accesorios</p>
          <h1>Todo lo que tu negocio necesita para seguir creciendo.</h1>
          <p className={styles.lead}>Explorá nuestra propuesta mayorista, armá tu pedido y encontrá nuevas oportunidades para tu negocio.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/catalogo">Explorar catálogo <span aria-hidden="true">→</span></Link>
            <Link className={styles.textLink} href="/login">Acceder a mi cuenta <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className={styles.heroVisual} aria-label="Propuesta mayorista CRV4">
          <div className={styles.visualLabel}>CRV4<br /><strong>Mayorista</strong></div>
          <div className={`${styles.visualPanel} ${styles.visualPanelOne}`} />
          <div className={`${styles.visualPanel} ${styles.visualPanelTwo}`} />
          <div className={`${styles.visualPanel} ${styles.visualPanelThree}`} />
        </div>
      </section>
      <section className={styles.highlights} aria-labelledby="highlights-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Una forma simple de comprar</p>
          <h2 id="highlights-title">Elegí con claridad. Vendé con confianza.</h2>
        </div>
        <div className={styles.highlightGrid}>
          {highlights.map((highlight) => (
            <article key={highlight.number}>
              <span className={styles.number}>{highlight.number}</span>
              <h3>{highlight.title}</h3>
              <p>{highlight.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
