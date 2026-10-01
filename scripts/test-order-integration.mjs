import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const base = "http://localhost:3100";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
const username = `test-order-${randomUUID()}`;
const password = randomUUID();
let userId;
const cartIds = [];
async function post(route, body, cookie = "") {
  const response = await fetch(base + route, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie }, body: JSON.stringify(body) });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "", cookieHeader: response.headers.get("set-cookie") };
}
try {
  const [rows] = await db.query("SELECT p.id, p.stock, p.precio_venta, p.precio_oferta FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.activo = 1 AND c.activa = 1 AND p.stock >= 2 AND p.precio_venta < 70000 LIMIT 1");
  assert(rows.length, "Se necesita un producto activo con stock >= 2 y precio < $70.000");
  const product = rows[0];
  const productId = String(product.id);
  const [tiers] = await db.query("SELECT precio_unitario FROM producto_precios WHERE producto_id = ? AND activo = 1 AND cantidad_minima <= 1", [productId]);
  const cents = Math.min(...[Number(product.precio_venta), Number(product.precio_oferta ?? product.precio_venta), ...tiers.map((tier) => Number(tier.precio_unitario))].map((price) => Math.round(price * 100)));
  const [created] = await db.query("INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, 1)", ["Prueba temporal de pedidos", username, await bcrypt.hash(password, 12)]);
  userId = String(created.insertId);
  const key = randomUUID();
  const orderInput = { key, version: 1, expectedTotalCents: cents, delivery: { method: "retiro", phone: "1112345678", address: "", notes: "Prueba temporal" } };
  assert.equal((await post("/api/orders", orderInput)).status, 401);
  const blocked = await fetch(base + "/pedido/confirmar", { redirect: "manual" });
  assert.equal(blocked.status, 307);
  assert(blocked.headers.get("location")?.includes("/login?next=/pedido/confirmar"));
  const guest = await post("/api/cart", { items: [{ productId, quantity: 1 }] });
  assert.equal(guest.status, 200);
  const [guests] = await db.query("SELECT id FROM carritos WHERE token_hash = ?", [createHash("sha256").update(guest.cookie.split("=")[1]).digest("hex")]);
  cartIds.push(guests[0].id);
  const login = await post("/api/auth/login", { username, password });
  assert.equal(login.status, 200);
  assert(login.cookieHeader.includes("Max-Age=2592000"));
  const session = login.cookie;
  const merged = await post("/api/cart", { items: [] }, `${session}; ${guest.cookie}`);
  assert.equal(merged.data.items[0].quantity, 1);
  const [active] = await db.query("SELECT id FROM carritos WHERE usuario_id = ?", [userId]);
  cartIds.push(active[0].id);
  orderInput.version = merged.data.version;
  assert.equal((await post("/api/orders", { ...orderInput, expectedTotalCents: cents + 1 }, session)).status, 409);
  const order = await post("/api/orders", orderInput, session);
  assert.equal(order.status, 201, JSON.stringify(order.data));
  assert.equal((await post("/api/orders", orderInput, session)).data.id, order.data.id);
  const [saved] = await db.query("SELECT estado, total_estimado, total_confirmado FROM pedidos WHERE id = ?", [order.data.id]);
  assert.equal(saved[0].estado, "pendiente_revision");
  assert.equal(saved[0].total_confirmado, null);
  assert(Number(saved[0].total_estimado) < 70000);
  const [converted] = await db.query("SELECT estado, usuario_id FROM carritos WHERE id = ?", [active[0].id]);
  assert.equal(converted[0].estado, "convertido");
  assert.equal(converted[0].usuario_id, null);
  const empty = await post("/api/cart", { items: [{ productId, quantity: 1 }] }, session);
  assert.deepEqual(empty.data.items, [], "No reimportar el respaldo local de un pedido ya confirmado");
  const secondCart = await post("/api/cart", { items: [{ productId, quantity: 1 }], version: 0 }, session);
  const [secondActive] = await db.query("SELECT id FROM carritos WHERE usuario_id = ?", [userId]);
  cartIds.push(secondActive[0].id);
  const second = await post("/api/orders", { ...orderInput, key: randomUUID(), version: secondCart.data.version }, session);
  assert.equal(second.status, 201);
  assert.notEqual(second.data.id, order.data.id);
  const [stock] = await db.query("SELECT stock FROM productos WHERE id = ?", [productId]);
  assert.equal(Number(stock[0].stock), Number(product.stock), "La confirmación no debe descontar stock");
  const history = await fetch(base + "/pedidos", { headers: { Cookie: session } });
  assert.equal(history.status, 200);
  assert((await history.text()).includes(order.data.id.slice(0, 8).toUpperCase()));
  console.log("Integración OK: login persistente, pedido sin mínimo, precios verificados, reintentos sin duplicados, carrito convertido, segundo pedido y stock intacto.");
} finally {
  if (userId) {
    await db.query("DELETE FROM pedidos WHERE usuario_id = ?", [userId]);
    await db.query("DELETE FROM carritos WHERE usuario_id = ?", [userId]);
    await db.query("DELETE FROM sesiones WHERE id_usuario = ?", [userId]);
    await db.query("DELETE FROM usuarios WHERE id = ? AND usuario = ?", [userId, username]);
  }
  if (cartIds.length) await db.query("DELETE FROM carritos WHERE id IN (?)", [cartIds]);
  await db.end();
}
