import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const base = "http://localhost:3100";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
const username = `test-confirmed-cart-${randomUUID()}`;
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
  const [created] = await db.query("INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, 1)", ["Prueba temporal de carritos", username, await bcrypt.hash(password, 12)]);
  userId = String(created.insertId);
  const orderInput = { version: 1, expectedTotalCents: cents, delivery: { method: "retiro", phone: "1112345678", address: "", notes: "Prueba temporal" } };
  assert.equal((await post("/api/cart/confirm", orderInput)).status, 401);
  assert.equal((await post("/api/orders", orderInput)).status, 410);
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
  const cartId = active[0].id;
  orderInput.version = merged.data.version;
  assert.equal((await post("/api/cart/confirm", { ...orderInput, expectedTotalCents: cents + 1 }, session)).status, 409);
  const confirmed = await post("/api/cart/confirm", orderInput, session);
  assert.equal(confirmed.status, 201, JSON.stringify(confirmed.data));
  assert.equal((await post("/api/cart/confirm", orderInput, session)).data.id, cartId);
  const current = await post("/api/cart", { items: [] }, session);
  assert.equal(current.data.status, "confirmado");
  assert.equal(current.data.items[0].quantity, 1);
  const [saved] = await db.query("SELECT usuario_id, estado FROM carritos WHERE id = ?", [cartId]);
  assert.equal(String(saved[0].usuario_id), userId);
  assert.equal(saved[0].estado, "confirmado");
  async function edit(body) {
    const response = await fetch(base + "/api/admin/carts/" + cartId, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: base, Cookie: session }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  }
  assert.equal((await edit({ version: current.data.version, items: [{ productId, quantity: 2 }] })).status, 403);
  const [roles] = await db.query("SELECT id FROM roles WHERE codigo IN ('admin','administrador') AND activo = 1 LIMIT 1");
  assert(roles.length, "Se requiere rol administrador");
  await db.query("INSERT INTO usuarios_roles (id_usuario, id_rol, activo) VALUES (?, ?, 1)", [userId, roles[0].id]);
  const updated = await edit({ version: current.data.version, items: [{ productId, quantity: 2 }] });
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal((await edit({ version: current.data.version, items: [{ productId, quantity: 1 }] })).status, 409);
  const revised = await post("/api/cart", { items: [] }, session);
  assert.equal(revised.data.status, "actualizado");
  assert.equal(revised.data.items[0].quantity, 2);
  assert.equal((await post("/api/cart/confirm", { ...orderInput, version: revised.data.version }, session)).status, 409, "No aceptar revisiones administrativas en esta etapa");
  const clientEdit = await post("/api/cart", { version: revised.data.version, items: [{ productId, quantity: 1 }] }, session);
  assert.equal(clientEdit.data.status, "activo");
  assert.equal(clientEdit.data.total, null);
  const second = await post("/api/cart/confirm", { ...orderInput, version: clientEdit.data.version }, session);
  assert.equal(second.status, 201);
  assert.equal(second.data.id, cartId);
  const [orders] = await db.query("SELECT COUNT(*) AS total FROM pedidos WHERE usuario_id = ?", [userId]);
  assert.equal(Number(orders[0].total), 0);
  const [stock] = await db.query("SELECT stock FROM productos WHERE id = ?", [productId]);
  assert.equal(Number(stock[0].stock), Number(product.stock));
  console.log("Integración OK: carrito confirmado conservado, revisión administrativa, edición del cliente, versiones protegidas, sin pedidos ni descuento de stock.");

} finally {
  if (userId) {
    await db.query("DELETE FROM pedidos WHERE usuario_id = ?", [userId]);
    await db.query("DELETE FROM carritos WHERE usuario_id = ?", [userId]);
    await db.query("DELETE FROM usuarios_roles WHERE id_usuario = ?", [userId]);
    await db.query("DELETE FROM sesiones WHERE id_usuario = ?", [userId]);
    await db.query("DELETE FROM usuarios WHERE id = ? AND usuario = ?", [userId, username]);
  }
  if (cartIds.length) await db.query("DELETE FROM carritos WHERE id IN (?)", [cartIds]);
  await db.end();
}
