import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin, hasRole } from "@/lib/authorization";

const modules = [
  ["Usuarios", "Administrar cuentas y accesos", "/admin/usuarios", "administrador"],
  ["Roles y permisos", "Configurar accesos por módulo", "/admin/roles", "administrador"],
  ["Categorías", "Organizar el catálogo", "/admin/categorias", "administrador"],
  ["Productos", "Gestionar productos y precios", "/admin/productos", "comercial"],
  ["Carritos", "Consultar carritos activos y abandonados", "/admin/carritos", "comercial"],
  ["Clientes", "Consultar clientes", "/admin/clientes", "comercial"],
  ["Pedidos", "Gestionar pedidos", "/admin/pedidos", "comercial"],
] as const;

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!canAccessAdmin(user)) redirect("/perfil");

  const isAdministrator = hasRole(user, "administrador", "admin");

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.05em]">Panel de gestión</h1>
        <p className="mt-2 text-sm text-foreground/60">Sesión iniciada como {user.name}.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules
            .filter(([, , , access]) => access === "comercial" || isAdministrator)
            .map(([name, description, href]) => (
              <Link key={href} href={href} className="border border-black/10 bg-white p-5 transition-colors hover:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/30">
                <h2 className="font-black uppercase tracking-[0.06em]">{name}</h2>
                <p className="mt-2 text-sm text-foreground/60">{description}</p>
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
