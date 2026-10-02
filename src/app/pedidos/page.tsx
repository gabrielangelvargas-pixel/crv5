import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrders } from "@/lib/orders-repository";
import { OrdersList } from "@/components/orders/orders-list";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ confirmado?: string }> }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  const orders = await getOrders(user.id);
  const { confirmado } = await searchParams;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">Cuenta</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.05em]">Mis pedidos</h1>
        {orders.some((order) => order.id === confirmado) ? <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 p-4">Pedido confirmado y pendiente de pago. Nos comunicaremos con vos por WhatsApp para indicarte cómo pagar.</p> : null}
        <OrdersList orders={orders} selectedId={confirmado} />
      </section>
    </main>
  );
}
