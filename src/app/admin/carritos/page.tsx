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
    <p className="mt-2 text-sm text-foreground/60">Abandonado: con productos y sin modificaciones durante 24 horas. Se muestran hasta 200 carritos recientes. Los totales usan precios actuales y no reservan stock.</p>
    <p className="mt-4 font-bold">{carts.filter((cart) => cart.status === "abandonado").length} abandonados · {carts.filter((cart) => cart.status === "activo").length} activos</p>
    <div className="mt-6 space-y-4">{carts.map((cart) => {
      let total = 0;
      return <details key={cart.id} className="border border-black/10 bg-white p-4">
        <summary className="cursor-pointer"><strong>{cart.customer ?? "Visitante anónimo"}</strong> · {cart.status === "abandonado" ? "Abandonado" : "Activo"} · {cart.items.reduce((sum, item) => sum + item.quantity, 0)} unidades
          <span className="mt-1 block text-xs text-foreground/60">{cart.username ? `${cart.username} · ` : ""}Última modificación: {new Date(cart.lastActivity).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires", hourCycle: "h23" })}</span>
        </summary>
        <ul className="mt-4 space-y-2">{cart.items.map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return <li key={item.productId}>{item.quantity} × Producto no disponible ({item.productId})</li>;
          const subtotal = getCartUnitPrice(product, item.quantity) * item.quantity;
          total += subtotal;
          return <li key={item.productId} className="flex flex-wrap justify-between gap-2 text-sm"><span>{item.quantity} × {product.name} · {product.variantName ?? product.code}{!product.active || item.quantity > product.stock ? " · Revisar disponibilidad" : ""}</span><strong>{money(subtotal)}</strong></li>;
        })}</ul>
        <p className="mt-4 text-right font-bold">Total estimado: {money(total)}</p>
      </details>;
    })}</div>
    {!carts.length ? <p className="mt-6">No hay carritos con productos.</p> : null}
  </main>;
}
