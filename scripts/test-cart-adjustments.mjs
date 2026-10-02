import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
const base = "http://localhost:3100";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
let userId;
const cartId = randomUUID();
const username = `test-adjustments-${randomUUID()}`;
const password = randomUUID();
async function request(path, method, body, cookie = "") {
 const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie }, body: JSON.stringify(body) });
 return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" };
}
try {
 const [roles] = await db.query("SELECT id FROM roles WHERE codigo IN ('admin','administrador') AND activo = 1 LIMIT 1");
 assert(roles.length, "Falta rol administrador");
 const [products] = await db.query("SELECT p.* FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.activo = 1 AND c.activa = 1 LIMIT 1");
 assert(products.length, "Falta producto activo");
 const productId = String(products[0].id);
 const [created] = await db.query("INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, 1)", ["Prueba temporal de ajustes", username, await bcrypt.hash(password, 12)]);
 userId = String(created.insertId);
 await db.query("INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, ?)", [userId, roles[0].id]);
 const lines = [{ productId, code: products[0].codigo, name: products[0].nombre, variant: null, quantity: 1, unitPrice: Number(products[0].precio_venta), subtotal: Number(products[0].precio_venta), reserved: false }];
 await db.query("INSERT INTO carritos (id, usuario_id, items, estado, version, productos_confirmados, total_estimado) VALUES (?, ?, ?, 'confirmado', 1, ?, ?)", [cartId, userId, JSON.stringify([{ productId, quantity: 1 }]), JSON.stringify(lines), lines[0].subtotal]);
 const login = await request("/api/auth/login", "POST", { username, password });
 assert.equal(login.status, 200);
 const adjustments = [{ description: "Redondeo", amountCents: -510 }, { description: "Envío", amountCents: 112000 }];
 const edit = await request(`/api/admin/carts/${cartId}`, "PATCH", { version: 1, items: [{ productId, quantity: 1 }], adjustments }, login.cookie);
 assert.equal(edit.status, 200, JSON.stringify(edit.data));
 assert.equal(edit.data.payableTotal, (Math.round(edit.data.total * 100) + 111490) / 100);
 const current = await request("/api/cart", "POST", { items: [] }, login.cookie);
 assert.deepEqual(current.data.adjustments, adjustments);
 const html = await fetch(base + `/admin/carritos?carrito=${cartId}`, { headers: { Cookie: login.cookie } });
 assert.equal(html.status, 200);
 const content = await html.text();
 assert(content.includes("Subtotal:") && content.includes("Total a pagar:") && content.includes("Redondeo"));
 const invalid = await request(`/api/admin/carts/${cartId}`, "PATCH", { version: edit.data.version, items: [{ productId, quantity: 1 }], adjustments: [{ description: "Descuento", amountCents: -100000000000 }] }, login.cookie);
 assert.equal(invalid.status, 409);
 const cleared = await request(`/api/admin/carts/${cartId}`, "PATCH", { version: edit.data.version, items: [{ productId, quantity: 1 }], adjustments: [] }, login.cookie);
 assert.equal(cleared.status, 200);
 assert.equal(cleared.data.payableTotal, cleared.data.total);
 console.log("Integración con BD remota: ajustes positivos/negativos persistidos, lectura cliente, desglose, rechazo de total negativo y eliminación comprobados.");
} finally {
 await db.query("DELETE FROM carritos WHERE id = ?", [cartId]);
 if (userId) { await db.query("DELETE FROM usuarios_roles WHERE id_usuario = ?", [userId]); await db.query("DELETE FROM sesiones WHERE id_usuario = ?", [userId]); await db.query("DELETE FROM usuarios WHERE id = ?", [userId]); }
 await db.end();
}
