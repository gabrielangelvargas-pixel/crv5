import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/authorization";
import { getProducts } from "@/lib/products-repository";
import { getOrders } from "@/lib/orders-repository";
import { OrdersList } from "@/components/orders/orders-list";

export const dynamic = "force-dynamic";
export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessAdmin(user)) redirect("/perfil");
  const [orders, products] = await Promise.all([getOrders(), getProducts()]);
  return <main className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-3xl font-black uppercase">Pedidos</h1><p className="mt-2 text-sm text-foreground/60">Pedidos confirmados por los clientes. Los pedidos en espera de pago se coordinan por WhatsApp; el stock físico se descuenta al cerrar la venta.</p><OrdersList selectedId={pedido} orders={orders} products={products} admin /></main>;
}
