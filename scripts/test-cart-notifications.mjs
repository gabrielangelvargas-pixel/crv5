import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
const base = "http://localhost:3100";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
const users = [];
let productId, cartId;
async function call(path, method, body, cookie = "") {
 const response = await fetch(base+path, { method, headers: { Origin:base, Cookie:cookie, "Content-Type":"application/json" }, ...(body === undefined ? {} : { body:JSON.stringify(body) }) });
 return { status:response.status,data:await response.json(),cookie:response.headers.get("set-cookie")?.split(";")[0]??"" };
}
try {
 const [roles] = await db.query("SELECT id,codigo FROM roles WHERE activo=1 AND codigo IN ('admin','administrador','vendedor','cliente')");
 const admin = roles.find(r => ['admin','administrador'].includes(r.codigo)), seller = roles.find(r=>r.codigo==='vendedor');
 assert(admin && seller,"Se requieren roles administrador y vendedor");
 const sessions=[];
 for (const role of [null,admin,seller]) {
  const username = "test-notify-"+randomUUID(), password=randomUUID();
  const [created] = await db.query("INSERT INTO usuarios (nombre,usuario,clave_hash,activo) VALUES (?,?,?,1)", ["Prueba temporal de avisos",username,await bcrypt.hash(password,12)]);
  const id=String(created.insertId);users.push(id);
  if(role) await db.query("INSERT INTO usuarios_roles (id_usuario,id_rol,activo) VALUES (?,?,1)",[id,role.id]);
  const login=await call("/api/auth/login","POST",{username,password});assert.equal(login.status,200);sessions.push(login.cookie);
 }
 const [cats] = await db.query("SELECT id FROM categorias WHERE activa=1 LIMIT 1");
 const code="TN"+randomUUID().replaceAll("-","").slice(0,11);
 const [p] = await db.query("INSERT INTO productos (categoria_id,codigo,nombre,slug,precio_venta,stock,activo) VALUES (?,?,?,?,100,5,1)",[cats[0].id,code,"Prueba temporal de avisos",code.toLowerCase()]);
 productId=String(p.insertId); cartId=randomUUID();
 await db.query("INSERT INTO carritos (id,usuario_id,items) VALUES (?,?,?)",[cartId,users[0],JSON.stringify([{productId,quantity:1}])]);
 const input={version:0,expectedTotalCents:10000,delivery:{method:"retiro",phone:"1112345678",address:"",notes:""}};
 const sent=await call("/api/cart/confirm","POST",input,sessions[0]);assert.equal(sent.status,201,JSON.stringify(sent.data));
 // Keep test alerts only for the test recipients; no fake notices remain for the real team.
 await db.query("DELETE FROM notificaciones_carritos WHERE carrito_id=? AND usuario_id NOT IN (?)",[cartId,users.slice(1)]);
 const retry=await call("/api/cart/confirm","POST",input,sessions[0]);assert.equal(retry.status,201);
 const [rows]=await db.query("SELECT * FROM notificaciones_carritos WHERE carrito_id=?",[cartId]);
 assert.equal(rows.length,2,"Un aviso por administrador y vendedor");
 for(const i of [1,2]){
  const notices=await call("/api/notifications","GET",undefined,sessions[i]);assert.equal(notices.status,200);assert.equal(notices.data.unread,1);
  assert.equal(notices.data.notifications[0].cartId,cartId);
 }
 assert.equal((await call("/api/notifications","GET",undefined,sessions[0])).status,403);
 assert.equal((await call("/api/notifications","GET",undefined)).status,401);
 const adminId=String(rows.find(r=>String(r.usuario_id)===users[1]).id), sellerId=String(rows.find(r=>String(r.usuario_id)===users[2]).id);
 await call("/api/notifications","PATCH",{id:sellerId},sessions[1]);
 assert.equal((await call("/api/notifications","GET",undefined,sessions[2])).data.unread,1,"No marcar avisos ajenos");
 await call("/api/notifications","PATCH",{id:adminId},sessions[1]);
 assert.equal((await call("/api/notifications","GET",undefined,sessions[1])).data.unread,0);
 assert.equal((await call("/api/notifications","GET",undefined,sessions[2])).data.unread,1);
 const changed=await call("/api/cart","POST",{version:1,items:[{productId,quantity:2}]},sessions[0]);assert.equal(changed.status,200);
 const resent=await call("/api/cart/confirm","POST",{...input,version:changed.data.version,expectedTotalCents:20000},sessions[0]);assert.equal(resent.status,201);
 await db.query("DELETE FROM notificaciones_carritos WHERE carrito_id=? AND usuario_id NOT IN (?)",[cartId,users.slice(1)]);
 assert.equal((await call("/api/notifications","GET",undefined,sessions[1])).data.unread,1);
 assert.equal((await call("/api/notifications","GET",undefined,sessions[2])).data.unread,2);
 await call("/api/notifications","PATCH",{all:true},sessions[2]);
 assert.equal((await call("/api/notifications","GET",undefined,sessions[2])).data.unread,0);
 const screen=await fetch(base+"/admin/carritos?carrito="+cartId,{headers:{Cookie:sessions[1]}});
 const html=await screen.text();assert.equal(screen.status,200);assert(html.includes('id="carrito-'+cartId+'" open=""'),"El enlace abre el detalle");
 console.log("Avisos OK: envío y reenvío, sin duplicados, destinatarios autorizados, lecturas independientes y enlace al detalle.");
} finally {
 if(cartId)await db.query("DELETE FROM carritos WHERE id=?",[cartId]);
 if(productId)await db.query("DELETE FROM productos WHERE id=?",[productId]);
 if(users.length){await db.query("DELETE FROM sesiones WHERE id_usuario IN (?)",[users]);await db.query("DELETE FROM usuarios_roles WHERE id_usuario IN (?)",[users]);await db.query("DELETE FROM usuarios WHERE id IN (?)",[users]);}
 await db.end();
}