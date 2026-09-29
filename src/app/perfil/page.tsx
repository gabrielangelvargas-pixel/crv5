import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Cuenta</p>
        <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">Mi perfil</h1>

        <dl className="mt-8 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
          <div className="flex justify-between gap-4 py-4">
            <dt className="text-sm text-foreground/55">Nombre</dt>
            <dd className="text-right text-sm font-semibold">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-4">
            <dt className="text-sm text-foreground/55">Usuario</dt>
            <dd className="text-right text-sm font-semibold">{user.username}</dd>
          </div>
          <div className="flex justify-between gap-4 py-4">
            <dt className="text-sm text-foreground/55">Rol</dt>
            <dd className="text-right text-sm font-semibold">{user.roles.join(", ") || "Sin rol asignado"}</dd>
          </div>
        </dl>

        <div className="mt-8 flex justify-end">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
