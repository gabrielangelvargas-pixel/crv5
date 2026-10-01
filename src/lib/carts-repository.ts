import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { getDatabasePool } from "./db";
import type { OrderDelivery, OrderLine } from "./orders-repository";
import type { CartItem } from "./cart";

export const CART_COOKIE = "crv4_cart";
type CartRow = RowDataPacket & { id: string; usuario_id: string | number | null; items: string | CartItem[]; version: number; estado?: string; productos_confirmados?: string | OrderLine[] | null; total_estimado?: number | null };
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
function readItems(row: CartRow): CartItem[] { return typeof row.items === "string" ? JSON.parse(row.items) : row.items; }

async function validateItems(connection: PoolConnection, items: CartItem[]) {
  if (!items.length) return [];
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT p.id, p.stock FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.activo = 1 AND c.activa = 1 AND p.id IN (?)", [items.map((item) => item.productId)]);
  const stock = new Map(rows.map((row) => [String(row.id), Number(row.stock)]));
  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = Math.min(stock.get(item.productId) ?? 0, (quantities.get(item.productId) ?? 0) + item.quantity);
    if (quantity > 0) quantities.set(item.productId, quantity);
  }
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
}

/** Resolve ownership inside a transaction. A visitor token never grants access to an account cart. */
export async function synchronizeCart(userId: string | null, token: string | undefined, input: { items: CartItem[]; version?: number | undefined }) {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    if (userId) await connection.query("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", [userId]);
    const [guestRows] = token && /^[a-f0-9]{64}$/.test(token)
      ? await connection.query<CartRow[]>("SELECT * FROM carritos WHERE token_hash = ? AND usuario_id IS NULL AND estado = 'activo' FOR UPDATE", [hash(token)])
      : [[] as CartRow[]];
    const guest = guestRows[0];
    const [accountRows] = userId
      ? await connection.query<CartRow[]>("SELECT * FROM carritos WHERE usuario_id = ? AND estado IN ('activo','confirmado','actualizado') FOR UPDATE", [userId])
      : [[] as CartRow[]];
    let cart = userId ? accountRows[0] : guest;
    let newToken: string | undefined;
    let items = cart ? readItems(cart) : [];
    let merged = false;
    if (userId && guest) {
      items = [...items, ...readItems(guest)];
      merged = true;
      await connection.query("UPDATE carritos SET estado = 'fusionado', token_hash = NULL, items = JSON_ARRAY() WHERE id = ?", [guest.id]);
    }
    // Import the old browser cart once, only when no visitor identity exists.
    if (input.version === undefined && !userId && !cart && !guest && !token) items = [...items, ...input.items];
    if (!cart) {
      if (input.version === undefined && items.length === 0) {
        await connection.commit();
        return { id: "", items: [] as CartItem[], version: 0, conflict: false, newToken: undefined, clearToken: Boolean(userId && token), status: "activo", lines: null, total: null };
      }
      const id = randomUUID();
      if (!userId) newToken = randomBytes(32).toString("hex");
      await connection.query("INSERT INTO carritos (id, usuario_id, token_hash, items) VALUES (?, ?, ?, JSON_ARRAY())", [id, userId, newToken ? hash(newToken) : null]);
      cart = { id, usuario_id: userId, items: [], version: 0 } as CartRow;
    }
    const conflict = input.version !== undefined && (input.version !== Number(cart.version) || merged);
    if (input.version !== undefined && !conflict) items = input.items;
    if (!cart.estado || cart.estado === "activo" || merged || (input.version !== undefined && !conflict)) items = await validateItems(connection, items);
    const changed = JSON.stringify(items) !== JSON.stringify(readItems(cart));
    const version = Number(cart.version) + (changed || merged ? 1 : 0);
    if (changed || merged) await connection.query("UPDATE carritos SET items = ?, version = ?, ultima_actividad = NOW(), estado = 'activo', productos_confirmados = NULL, total_estimado = NULL, confirmado_en = NULL WHERE id = ?", [JSON.stringify(items), version, cart.id]);
    await connection.commit();
    return { id: cart.id, items, version, conflict, newToken, clearToken: Boolean(userId && token), status: changed || merged ? "activo" : cart.estado ?? "activo", lines: changed || merged ? null : (typeof cart.productos_confirmados === "string" ? JSON.parse(cart.productos_confirmados) : cart.productos_confirmados ?? null) as OrderLine[] | null, total: changed || merged || cart.total_estimado == null ? null : Number(cart.total_estimado) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function getAdminCarts() {
  const [rows] = await getDatabasePool().query<RowDataPacket[]>(`
    SELECT c.id, c.items, c.version, c.entrega, c.productos_confirmados, c.total_estimado, c.ultima_actividad, u.nombre, u.usuario,
      CASE WHEN c.estado IN ('confirmado','actualizado') THEN c.estado WHEN c.ultima_actividad <= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 'abandonado' ELSE 'activo' END AS estado
    FROM carritos c LEFT JOIN usuarios u ON u.id = c.usuario_id
    WHERE c.estado IN ('activo','confirmado','actualizado') AND JSON_LENGTH(c.items) > 0
    ORDER BY c.ultima_actividad DESC LIMIT 200
  `);
  return rows.map((row) => ({ id: String(row.id), items: (typeof row.items === "string" ? JSON.parse(row.items) : row.items) as CartItem[],
    customer: row.nombre ? String(row.nombre) : null, username: row.usuario ? String(row.usuario) : null,
    version: Number(row.version), delivery: (typeof row.entrega === "string" ? JSON.parse(row.entrega) : row.entrega) as OrderDelivery | null, lines: (typeof row.productos_confirmados === "string" ? JSON.parse(row.productos_confirmados) : row.productos_confirmados) as OrderLine[] | null, total: row.total_estimado == null ? null : Number(row.total_estimado), lastActivity: new Date(row.ultima_actividad).toISOString(), status: String(row.estado) }));
}
