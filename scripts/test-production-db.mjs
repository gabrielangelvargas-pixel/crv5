import mysql from "mysql2/promise";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
let uid;
try {
 const [result] = await db.query("INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, 'probe-unusable', 1)", ["Prueba de render temporal", "probe-render-"+randomUUID()]);
 uid = String(result.insertId);
 const [roles] = await db.query("SELECT id FROM roles WHERE codigo IN ('admin','administrador') AND activo=1 LIMIT 1");
 await db.query("INSERT INTO usuarios_roles (id_usuario,id_rol,activo) VALUES (?,?,1)", [uid,roles[0].id]);
 const token = randomBytes(32).toString("hex");
 await db.query("INSERT INTO sesiones (id,id_usuario,token_hash,expira_en) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 1 HOUR))", [randomUUID(),uid,createHash("sha256").update(token).digest("hex")]);
 const [products] = await db.query("SELECT id,codigo,nombre,variante,precio_venta FROM productos WHERE activo=1 AND stock>0 LIMIT 1");
 const p=products[0]; const lines=[{ productId:String(p.id),code:p.codigo,name:p.nombre,variant:p.variante,quantity:1,unitPrice:Number(p.precio_venta),subtotal:Number(p.precio_venta) }];
 await db.query("INSERT INTO carritos (id,usuario_id,items,estado,productos_confirmados,total_estimado,entrega) VALUES (?,?,?,'confirmado',?,?,?)", [randomUUID(),uid,JSON.stringify([{productId:String(p.id),quantity:1}]),JSON.stringify(lines),Number(p.precio_venta),JSON.stringify({method:"retiro",phone:"1112345678",address:"",notes:""})]);
 const base = process.env.TEST_BASE_URL ?? "http://localhost:3100";
 for (let round = 0; round < 5; round++) {
  for (const path of ["/","/carrito","/carrito/confirmar","/admin/carritos","/admin/pedidos","/pedidos","/api/auth/session"]) {
   const response = await fetch(base+path, { headers: { Cookie: "crv4_session="+token }, redirect: "manual" });
   const body = await response.text();
   assert.equal(response.status, 200, "Falló la renderización de "+path);
   assert(body.includes("Prueba de render temporal"), "No se reconoció la sesión en "+path);
  }
 }
 const [connections] = await db.query("SHOW PROCESSLIST");
 const [identity] = await db.query("SELECT CONNECTION_ID() AS id");
 const probeHost = connections.find(row => Number(row.Id) === Number(identity[0].id))?.Host.replace(/:\d+$/, "");
 const ownConnections = connections.filter(row => row.User === process.env.DATABASE_USER && row.Host.replace(/:\d+$/, "") === probeHost);
 assert(ownConnections.length <= 11, "Las conexiones crecen más allá de un único pool");
 console.log("Producción OK: 35 solicitudes autenticadas, pantallas renderizadas y conexiones limitadas a un único pool.");

} finally {
 if(uid) { await db.query("DELETE FROM carritos WHERE usuario_id=?",[uid]);await db.query("DELETE FROM sesiones WHERE id_usuario=?",[uid]);await db.query("DELETE FROM usuarios_roles WHERE id_usuario=?",[uid]);await db.query("DELETE FROM usuarios WHERE id=?",[uid]);}
 await db.end();
}