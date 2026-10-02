import { OrderEditor } from "./order-editor";
import type { Product } from "@/data/products";
import type { Order } from "@/lib/orders-repository";

const statuses: Record<string, string> = { pendiente_revision: "Pendiente de revisión", esperando_pago: "Esperando pago", cerrado: "Venta cerrada", cancelado: "Cancelado" };
const money = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
export function OrdersList({ orders, admin = false, products = [], selectedId }: { orders: Order[]; admin?: boolean; products?: Product[]; selectedId?: string | undefined }) {
  if (!orders.length) return <p className="mt-6">Todavía no hay pedidos.</p>;
  return <div className="mt-6 space-y-4">{orders.map((order) => <details key={order.id} id={`pedido-${order.id}`} open={selectedId === order.id} className="border border-black/10 bg-white p-4">
    <summary className="cursor-pointer"><strong>Pedido {order.id.slice(0, 8).toUpperCase()}</strong> · {statuses[order.status] ?? order.status}{admin ? ` · ${order.customer}` : ""}<span className="mt-1 block text-sm text-foreground/60">{new Date(order.created).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires", hourCycle: "h23" })}</span></summary>
    <ul className="mt-4 space-y-2">{order.lines.map((line) => <li key={line.productId} className="flex justify-between gap-3 text-sm"><span>{line.quantity} × {line.name} · {line.variant ?? line.code}{line.exhausted ? " · Agotado (historial)" : ""}</span><strong>{money(line.subtotal)}</strong></li>)}</ul>
    <p className="mt-4 font-bold">Subtotal: {money(order.estimatedTotal)}</p>
    {order.adjustments?.map((item, index) => <p key={index} className="mt-2 text-right text-sm">{item.description}: <strong>{money(item.amountCents / 100)}</strong></p>)}
    {order.confirmedTotal !== null ? <p className="mt-1 font-bold">Total a pagar: {money(order.confirmedTotal)}</p> : <p className="mt-2 text-sm">Revisaremos tu pedido y te confirmaremos el importe antes del pago.</p>}
    {order.status === "esperando_pago" ? <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">{admin ? "Pendiente de pago. Contactá al cliente por WhatsApp para indicar cómo pagar." : "Nos comunicaremos con vos por WhatsApp para indicarte cómo pagar. Tu pedido está pendiente de pago."}</p> : null}
    <p className="mt-3 text-sm">{order.delivery.method === "envio" ? `Envío a ${order.delivery.address}` : "Retiro"} · Teléfono: {order.delivery.phone}</p>
    {order.delivery.notes ? <p className="mt-2 text-sm">Observaciones: {order.delivery.notes}</p> : null}
    {admin && order.status === "pendiente_revision" ? <OrderEditor order={order} products={products} /> : null}
  </details>)}</div>;
}
