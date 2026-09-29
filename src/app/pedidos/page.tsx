import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Cuenta</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.05em]">Mis pedidos</h1>
        <p className="mt-4 border border-dashed border-black/20 bg-white p-5 text-sm text-foreground/60 dark:border-white/20 dark:bg-zinc-950">
          El historial de pedidos estará disponible cuando implementemos el flujo de compras.
        </p>
      </section>
    </main>
  );
}
