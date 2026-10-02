import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
  await db.query(await readFile(new URL("../database/carrito-reservas.sql", import.meta.url), "utf8"));
  await db.beginTransaction();
  const [carts] = await db.query("SELECT id, productos_confirmados FROM carritos WHERE estado IN ('confirmado','actualizado') ORDER BY id FOR UPDATE");
  const [products] = await db.query("SELECT id, stock FROM productos ORDER BY id FOR UPDATE");
  const stock = new Map(products.map(p => [String(p.id), Number(p.stock)]));
  const desired = carts.flatMap(c => {
    const lines = typeof c.productos_confirmados === "string" ? JSON.parse(c.productos_confirmados) : c.productos_confirmados ?? [];
    return lines.filter(l => l.reserved === true).map(l => ({ cart: c.id, product: l.productId, quantity: l.quantity }));
  });
  for (const r of desired) {
    const remaining = (stock.get(r.product) ?? 0) - r.quantity;
    if (remaining < 0) throw new Error("Las marcas de reserva anteriores superan el stock. Revisar antes de desplegar.");
    stock.set(r.product, remaining);
  }
  await db.query("DELETE FROM carrito_reservas");
  for (const r of desired) await db.query("INSERT INTO carrito_reservas (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)", [r.cart, r.product, r.quantity]);
  await db.commit();
  console.log(`Migración aplicada: ${desired.length} reservas existentes convertidas a bloqueo de unidades.`);
} catch (error) { await db.rollback(); throw error; }
finally { await db.end(); }
