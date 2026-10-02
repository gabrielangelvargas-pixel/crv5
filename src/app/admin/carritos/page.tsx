import { OrderEditor } from "@/components/orders/order-editor";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/authorization";
import { getAdminCarts } from "@/lib/carts-repository";
import { getAdminProducts } from "@/lib/admin-products-repository";
import { getCartUnitPrice } from "@/lib/cart";

export const dynamic = "force-dynamic";
const money = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export default async function AdminCartsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, "admin", "administrador", "vendedor", "supervisor")) redirect("/perfil");
  let data;
  try { data = await Promise.all([getAdminCarts(), getAdminProducts()]); }
  catch { return <main className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-3xl font-black">Carritos</h1><p className="mt-4">No se pudieron cargar los carritos. Verificá la conexión y la migración database/carritos.sql.</p></main>; }
  const [carts, products] = data;
  return <main className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="text-3xl font-black uppercase">Carritos</h1>
    <p className="mt-2 text-sm text-foreground/60">Abandonado: con productos y sin modificaciones durante 24 horas. Se muestran hasta 200 carritos recientes. Los productos marcados como reservados bloquean unidades para otros clientes, sin descontar el stock físico.</p>
    <p className="mt-4 font-bold">{carts.filter((cart) => cart.status === "abandonado").length} abandonados · {carts.filter((cart) => cart.status === "activo").length} activos · {carts.filter(cart => cart.status === "confirmado").length} confirmados · {carts.filter(cart => cart.status === "actualizado").length} actualizados</p>
    <div className="mt-6 space-y-4">{carts.map((cart) => {
      let total = 0;
      return <details key={cart.id} className="border border-black/10 bg-white p-4">
        <summary className="cursor-pointer"><strong>{cart.customer ?? "Visitante anónimo"}</strong> · {({ abandonado: "Abandonado", activo: "Activo", confirmado: "Confirmado", actualizado: "Actualizado por administración" }[cart.status] ?? cart.status)} · {cart.items.reduce((sum, item) => sum + item.quantity, 0)} unidades
          <span className="mt-1 block text-xs text-foreground/60">{cart.username ? `${cart.username} · ` : ""}Última modificación: {new Date(cart.lastActivity).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires", hourCycle: "h23" })}</span>
        </summary>
        <ul className="mt-4 space-y-2">{cart.items.map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return <li key={item.productId}>{item.quantity} × Producto no disponible ({item.productId})</li>;
          const subtotal = (cart.lines?.find(line => line.productId === item.productId)?.unitPrice ?? getCartUnitPrice(product, item.quantity)) * item.quantity;
          total += subtotal;
          return <li key={item.productId} className="flex flex-wrap justify-between gap-2 text-sm"><span>{item.quantity} × {product.name} · {product.variantName ?? product.code}{!product.active || item.quantity > product.stock ? " · Agregado · Esperando ingreso" : ""} · {cart.lines?.find(line => line.productId === item.productId)?.reserved ? "Reservado: Sí" : "Reservado: No"}</span><strong>{money(subtotal)}</strong></li>;
        })}</ul>
        <p className="mt-4 text-right font-bold">Total estimado: {money(cart.total ?? total)}</p>
        {cart.delivery ? <p className="mt-3 text-sm">{cart.delivery.method === "envio" ? `Envío a ${cart.delivery.address}` : "Retiro"} · Teléfono: {cart.delivery.phone}{cart.delivery.notes ? ` · ${cart.delivery.notes}` : ""}</p> : null}
        {cart.status === "confirmado" || cart.status === "actualizado" ? <OrderEditor cartVersion={cart.version} products={products.filter(p => p.active).map(p => ({ ...p, stock: p.availableStock + (cart.lines?.find(l => l.productId === p.id && l.reserved)?.quantity ?? 0) }))} order={{ id: cart.id, customer: cart.customer ?? "", status: cart.status, created: cart.lastActivity, lines: cart.lines ?? [], estimatedTotal: cart.total ?? total, confirmedTotal: null, delivery: cart.delivery ?? { method: "retiro", phone: "", address: "", notes: "" } }} /> : null}
      </details>;
    })}</div>
    {!carts.length ? <p className="mt-6">No hay carritos con productos.</p> : null}
  </main>;
}
