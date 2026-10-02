import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
const base = "http://localhost:3100";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
const users = [], products = [];
const cartId = randomUUID();
let orderId;
async function call(path, method, body, cookie = "") {
 const response = await fetch(base + path, { method, headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
 return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" };
}
try {
 const [roles] = await db.query("SELECT id,codigo FROM roles WHERE activo=1 AND codigo IN ('admin','administrador','vendedor')");
 const sessions = [];
 for (const role of [null, roles.find(r => ['admin','administrador'].includes(r.codigo)), roles.find(r => r.codigo === 'vendedor')]) {
  const username = "test-accept-" + randomUUID(), password = randomUUID();
  const [created] = await db.query("INSERT INTO usuarios (nombre,usuario,clave_hash,activo) VALUES (?,?,?,1)", ["Prueba temporal de aceptación", username, await bcrypt.hash(password,12)]);
  const id = String(created.insertId); users.push(id);
  if (role) await db.query("INSERT INTO usuarios_roles (id_usuario,id_rol,activo) VALUES (?,?,1)", [id,role.id]);
  const login = await call("/api/auth/login","POST",{username,password}); assert.equal(login.status,200); sessions.push(login.cookie);
 }
 const [cats] = await db.query("SELECT id FROM categorias WHERE activa=1 LIMIT 1");
 for (let i=0;i<2;i++) {
  const code = "TA" + randomUUID().replaceAll("-", "").slice(0,11);
  const [p] = await db.query("INSERT INTO productos (categoria_id,codigo,nombre,slug,precio_venta,stock,activo) VALUES (?,?,?,?,100,5,1)",[cats[0].id,code,"Prueba temporal de aceptación",code.toLowerCase()]);
  products.push(String(p.insertId));
 }
 const lines = products.map(productId => ({ productId, code: "TEST", name: "Prueba temporal", variant: null, quantity: 1, unitPrice: 100, subtotal: 100 }));
 const items = products.map(productId => ({ productId, quantity: 1 }));
 const delivery = { method: "retiro", phone: "1112345678", address: "", notes: "Prueba temporal" };
 await db.query("INSERT INTO carritos (id,usuario_id,estado,items,version,productos_confirmados,entrega,total_estimado) VALUES (?,?,'confirmado',?,1,?,?,200)",[cartId,users[0],JSON.stringify(items),JSON.stringify(lines),JSON.stringify(delivery)]);
 const adjustments = [{ description:"Envío", amountCents:112000 },{ description:"Redondeo", amountCents:-510 }];
 const reviewItems = [{ productId:products[0],quantity:2,reserved:true },{ productId:products[1],quantity:1,exhausted:true }];
 const edit = await call(`/api/admin/carts/${cartId}`,"PATCH",{version:1,items:reviewItems,adjustments},sessions[1]);
 assert.equal(edit.status,200,JSON.stringify(edit.data));
 const clientAlerts = await call("/api/notifications","GET",undefined,sessions[0]);
 assert.equal(clientAlerts.status,200); assert.equal(clientAlerts.data.notifications[0].kind,"actualizacion");
 const clientCart = await call("/api/cart","POST",{items:[]},sessions[0]);
 assert.equal(clientCart.data.status,"actualizado"); assert.equal(clientCart.data.id,cartId);
 const stale = await call("/api/cart/review","POST",{cartId,version:1,action:"accept",expectedTotalCents:131490},sessions[0]); assert.equal(stale.status,409);
 const foreign = await call("/api/cart/review","POST",{cartId,version:2,action:"accept",expectedTotalCents:131490},sessions[2]); assert.equal(foreign.status,409);
 const reopened = await call("/api/cart/review","POST",{cartId,version:2,action:"continue"},sessions[0]); assert.equal(reopened.status,200);
 const [held] = await db.query("SELECT * FROM carrito_reservas WHERE carrito_id=?",[cartId]); assert.equal(held.length,0);
 await db.query("UPDATE carritos SET estado='confirmado' WHERE id=?",[cartId]);
 const edited = await call(`/api/admin/carts/${cartId}`,"PATCH",{version:3,items:reviewItems,adjustments},sessions[1]); assert.equal(edited.status,200);
 const acceptedBody = {cartId,version:4,action:"accept",expectedTotalCents:131490};
 const accepted = await call("/api/cart/review","POST",acceptedBody,sessions[0]);
 // Immediately remove temporary test alerts for existing staff; keep only the test recipients.
 await db.query("DELETE FROM notificaciones_carritos WHERE carrito_id=? AND usuario_id NOT IN (?)",[cartId,users]);
 assert.equal(accepted.status,200,JSON.stringify(accepted.data)); orderId = accepted.data.orderId;
 const retry = await call("/api/cart/review","POST",acceptedBody,sessions[0]); assert.equal(retry.data.orderId,orderId);
 const [orders] = await db.query("SELECT * FROM pedidos WHERE carrito_id=?",[cartId]); assert.equal(orders.length,1); assert.equal(orders[0].estado,"esperando_pago"); assert.equal(Number(orders[0].total_confirmado),1314.9);
 const orderAdjustments = typeof orders[0].ajustes === 'string' ? JSON.parse(orders[0].ajustes) : orders[0].ajustes; assert.deepEqual(orderAdjustments,adjustments);
 const [physical] = await db.query("SELECT stock FROM productos WHERE id=?",[products[0]]); assert.equal(Number(physical[0].stock),5);
 const [reserved] = await db.query("SELECT cantidad FROM carrito_reservas WHERE carrito_id=?",[cartId]); assert.equal(Number(reserved[0].cantidad),2);
 for (const session of sessions.slice(1)) {
  const alerts = await call("/api/notifications","GET",undefined,session); assert(alerts.data.notifications.some(n=>n.kind==='pedido' && n.orderId===orderId));
 }
 const [snapshot] = await db.query("SELECT estado,pedido_id,usuario_id FROM carritos WHERE id=?",[cartId]); assert.equal(snapshot[0].estado,"confirmado"); assert.equal(snapshot[0].pedido_id,orderId); assert.equal(snapshot[0].usuario_id,null);
 const again = await call("/api/cart","POST",{items:[]},sessions[0]); assert.equal(again.data.items.length,0);
 const html = await fetch(base+`/pedidos?confirmado=${orderId}`,{headers:{Cookie:sessions[0]}}); assert.equal(html.status,200); const text = await html.text(); assert(text.includes("WhatsApp") && text.includes("Total a pagar:"));
 const blocked = await call(`/api/admin/carts/${cartId}`,"PATCH",{version:5,items:reviewItems,adjustments},sessions[1]); assert.equal(blocked.status,409);
 console.log("Integración remota: cliente notificado, reactivación/liberación, aceptación única, pedido esperando pago, stock físico intacto, reservas y avisos al equipo comprobados.");
} finally {
 await db.query("DELETE FROM pedidos WHERE carrito_id=?",[cartId]);
 await db.query("DELETE FROM carritos WHERE id=?",[cartId]);
 if(products.length) await db.query("DELETE FROM productos WHERE id IN (?)",[products]);
 if(users.length) {
  await db.query("DELETE FROM carritos WHERE usuario_id IN (?)",[users]);
  await db.query("DELETE FROM sesiones WHERE id_usuario IN (?)",[users]);
  await db.query("DELETE FROM usuarios_roles WHERE id_usuario IN (?)",[users]);
  await db.query("DELETE FROM usuarios WHERE id IN (?)",[users]);
 }
 await db.end();
}
