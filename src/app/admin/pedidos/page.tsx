import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/authorization";
import { getProducts } from "@/lib/products-repository";
import { getOrders } from "@/lib/orders-repository";
import { OrdersList } from "@/components/orders/orders-list";

export const dynamic = "force-dynamic";
export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, "admin", "administrador", "vendedor", "supervisor")) redirect("/perfil");
  const [orders, products] = await Promise.all([getOrders(), getProducts()]);
  return <main className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-3xl font-black uppercase">Pedidos</h1><p className="mt-2 text-sm text-foreground/60">Historial de pedidos anteriores. Los nuevos envíos y sus modificaciones se gestionan en el módulo Carritos.</p><OrdersList orders={orders} products={products} admin /></main>;
}
