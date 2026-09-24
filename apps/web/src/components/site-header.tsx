"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";
  const isStaff = user?.roles.some((role) => role !== "cliente");

  return (
    <>
      <header className="site-header">
        <Link className="site-wordmark" href="/" onClick={() => setOpen(false)} aria-label="CRV4 Mayorista, inicio">
          <span className="site-mark">CRV4</span>
          <span>Mayorista</span>
        </Link>
        <nav className="site-desktop-nav" aria-label="Navegación principal">
          <Link href="/catalogo">Catálogo</Link>
          {isStaff && <Link href="/panel">Panel principal</Link>}
          <Link href={user ? "/perfil" : "/login"}>{user ? "Mi cuenta" : "Ingresar"}</Link>
          <Link className="cart-link" href="/carrito">Carrito <span aria-hidden="true">0</span></Link>
        </nav>
        <button className="menu-trigger" type="button" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
          <span /><span /><span />
        </button>
      </header>
      {open && <div className="site-menu-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={`site-menu ${open ? "is-open" : ""}`} aria-label="Menú lateral" aria-hidden={!open}>
        <div className="site-menu-head"><span className="site-eyebrow">{user?.nombre || "CRV4 Mayorista"}</span><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú">×</button></div>
        <nav className="site-menu-nav">
          {(!isHome || isStaff) && <Link href={isHome ? "/panel" : "/"} onClick={() => setOpen(false)}>{isHome ? "Panel principal" : "Inicio"}<span aria-hidden="true">→</span></Link>}
          <Link href="/catalogo" onClick={() => setOpen(false)}>Catálogo <span aria-hidden="true">→</span></Link>
          <Link href="/carrito" onClick={() => setOpen(false)}>Carrito <span aria-hidden="true">→</span></Link>
          {user && <Link href="/perfil" onClick={() => setOpen(false)}>Mi cuenta <span aria-hidden="true">→</span></Link>}
          {isStaff && <Link href="/panel/rubros" onClick={() => setOpen(false)}>Rubros y subrubros <span aria-hidden="true">→</span></Link>}
        </nav>
      </aside>
    </>
  );
}
