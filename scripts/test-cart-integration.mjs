import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Run against the local dev server. Only disposable accounts and carts are modified.
const base = "http://localhost:3100";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
let userId;
let guestCookie = "";
let guestId;
const username = `test-cart-${randomUUID()}`;
const password = randomUUID();
async function post(route, body, cookie = "") {
  const response = await fetch(`${base}${route}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie }, body: JSON.stringify(body) });
  return { response, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" };
}
try {
  const [products] = await db.query("SELECT p.id FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.activo = 1 AND c.activa = 1 AND p.stock >= 5 LIMIT 1");
  assert(products.length, "La prueba necesita un producto con stock >= 5");
  const productId = String(products[0].id);
  const [created] = await db.query("INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, 1)", ["Prueba temporal de carrito", username, await bcrypt.hash(password, 12)]);
  userId = String(created.insertId);
  const login = await post("/api/auth/login", { username, password });
  assert.equal(login.response.status, 200);
  const session = login.cookie;
  const guest = await post("/api/cart", { items: [{ productId, quantity: 2 }] });
  assert.equal(guest.response.status, 200);
  guestCookie = guest.cookie;
  assert(guestCookie.startsWith("crv4_cart="));
  const [guestRows] = await db.query("SELECT id FROM carritos WHERE token_hash = ?", [createHash("sha256").update(guestCookie.split("=")[1]).digest("hex")]);
  guestId = guestRows[0].id;
  const account = await post("/api/cart", { items: [{ productId, quantity: 1 }] }, session);
  assert.equal(account.data.items[0].quantity, 1);
  const merged = await post("/api/cart", { items: [] }, `${session}; ${guestCookie}`);
  assert.equal(merged.data.items[0].quantity, 3);
  const again = await post("/api/cart", { items: [{ productId, quantity: 3 }] }, session);
  assert.equal(again.data.items[0].quantity, 3, "La consulta no debe reimportar ni duplicar cantidades");
  const conflict = await post("/api/cart", { items: [{ productId, quantity: 5 }], version: 0 }, session);
  assert.equal(conflict.response.status, 409);
  assert.equal(conflict.data.items[0].quantity, 3);
  const anonymous = await post("/api/cart", { items: [] }, guestCookie);
  assert.deepEqual(anonymous.data.items, [], "El token fusionado no puede leer el carrito de la cuenta");
  const unauthorized = await fetch(`${base}/admin/carritos`, { headers: { Cookie: session }, redirect: "manual" });
  assert.equal(unauthorized.status, 307);
  assert(unauthorized.headers.get("location")?.endsWith("/perfil"));
  const [activity] = await db.query("SELECT ultima_actividad FROM carritos WHERE usuario_id = ?", [userId]);
  await post("/api/cart", { items: [] }, session);
  const [activityAfter] = await db.query("SELECT ultima_actividad FROM carritos WHERE usuario_id = ?", [userId]);
  assert.equal(String(activity[0].ultima_actividad), String(activityAfter[0].ultima_actividad));
  const cleared = await post("/api/cart", { items: [], version: again.data.version }, session);
  assert.equal(cleared.response.status, 200);
  assert.deepEqual(cleared.data.items, []);
  console.log("Integración OK: visitante, cuenta, fusión única, versiones, aislamiento, permisos, actividad y eliminación.");
} finally {
  if (userId) {
    await db.query("DELETE FROM carritos WHERE usuario_id = ?", [userId]);
    await db.query("DELETE FROM sesiones WHERE id_usuario = ?", [userId]);
    await db.query("DELETE FROM usuarios WHERE id = ? AND usuario = ?", [userId, username]);
  }
  if (guestCookie) {
    const token = guestCookie.split("=")[1];
    await db.query("DELETE FROM carritos WHERE token_hash = ?", [createHash("sha256").update(token).digest("hex")]);
  }
  if (guestId) await db.query("DELETE FROM carritos WHERE id = ?", [guestId]);
  await db.end();
}
