import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export function SectionPage({ eyebrow, title, description, children }: Readonly<{ eyebrow: string; title: string; description?: string; children?: ReactNode }>) {
  return (
    <main className="section-page">
      <SiteHeader />
      <div className="section-page-content">
        <p className="section-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="section-description">{description}</p>}
        {children}
      </div>
    </main>
  );
}
