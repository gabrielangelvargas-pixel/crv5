"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaRightFromBracket, FaRightToBracket, FaUser } from "react-icons/fa6";
import { useAuth } from "@/components/auth/auth-provider";

const adminLinks = [
  ["Panel", "/admin"],
  ["Usuarios", "/admin/usuarios"],
  ["Roles y permisos", "/admin/roles"],
  ["Categorías", "/admin/categorias"],
  ["Productos", "/admin/productos"],
  ["Clientes", "/admin/clientes"],
  ["Pedidos", "/admin/pedidos"],
] as const;

const sellerLinks = [
  ["Panel", "/admin"],
  ["Productos", "/admin/productos"],
  ["Clientes", "/admin/clientes"],
  ["Pedidos", "/admin/pedidos"],
] as const;

const clientLinks = [
  ["Mi perfil", "/perfil"],
  ["Mis pedidos", "/pedidos"],
] as const;

function hasRole(roles: string[], ...expected: string[]) {
  return roles.some((role) => expected.includes(role.toLowerCase()));
}

export function AuthMenu() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="Iniciar sesión"
        className="ml-auto flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-white/10"
      >
        <FaRightToBracket aria-hidden="true" className="size-5" />
      </Link>
    );
  }

  const links = hasRole(user.roles, "administrador") || hasRole(user.roles, "admin")
    ? adminLinks
    : hasRole(user.roles, "vendedor", "supervisor")
      ? sellerLinks
      : clientLinks;

  return (
    <div ref={menuRef} className="relative ml-auto">
      <button
        type="button"
        aria-label="Abrir menú de usuario"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 items-center gap-2 rounded-md px-2 text-foreground transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-white/10"
      >
        <FaUser aria-hidden="true" className="size-5" />
        <FaChevronDown aria-hidden="true" className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-[70] w-60 border border-black/10 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-black/10 px-3 py-2 dark:border-white/10">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-foreground/55">{user.username}</p>
          </div>
          <nav aria-label="Menú de usuario" className="py-2">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              setUser(null);
              setIsOpen(false);
              router.replace("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2 border-t border-black/10 px-3 py-3 text-left text-sm font-bold text-red-600 dark:border-white/10"
          >
            <FaRightFromBracket aria-hidden="true" className="size-4" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
