import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin, hasRole } from "@/lib/authorization";
import { getAdminRoles as getUserRoles, getAdminUsers } from "@/lib/users-repository";
import { UsersManager } from "@/components/admin/users-manager";
import { getAdminPermissions, getAdminRoles as getRoles } from "@/lib/roles-repository";
import { RolesManager } from "@/components/admin/roles-manager";

const administratorModules = new Set(["usuarios", "roles", "categorias"]);
const commercialModules = new Set(["productos", "clientes", "pedidos"]);
const moduleNames: Record<string, string> = {
  usuarios: "Usuarios",
  roles: "Roles y permisos",
  categorias: "Categorías",
  productos: "Productos",
  clientes: "Clientes",
  pedidos: "Pedidos",
};

export const dynamic = "force-dynamic";

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const user = await getCurrentUser();

  if (!moduleNames[module]) notFound();
  if (!user) redirect("/login");
  if (!canAccessAdmin(user)) redirect("/perfil");

  const isAdministrator = hasRole(user, "administrador", "admin");
  const allowed = isAdministrator || (commercialModules.has(module) && hasRole(user, "vendedor", "supervisor"));

  if (!allowed || (!isAdministrator && administratorModules.has(module))) {
    redirect("/admin");
  }

  if (module === "usuarios") {
    const [users, roles] = await Promise.all([getAdminUsers(), getUserRoles()]);

    return (
      <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground">
        <section className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p>
          <UsersManager initialUsers={users} roles={roles} />
        </section>
      </main>
    );
  }

  if (module === "roles") {
    const [roles, permissions] = await Promise.all([getRoles(), getAdminPermissions()]);

    return (
      <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground">
        <section className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.05em]">Roles y permisos</h1>
          <p className="mt-2 text-sm text-foreground/60">Define qué puede consultar y gestionar cada rol.</p>
          <RolesManager initialRoles={roles} permissions={permissions} />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Administración</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.05em]">{moduleNames[module]}</h1>
        <p className="mt-4 border border-dashed border-black/20 bg-white p-5 text-sm text-foreground/60 dark:border-white/20 dark:bg-zinc-950">
          Este módulo está preparado para comenzar la gestión de datos.
        </p>
      </section>
    </main>
  );
}
