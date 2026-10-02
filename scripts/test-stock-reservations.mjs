import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
const base = "http://localhost:3100";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
const users = [], carts = [];
let productId, guestCookie;
async function post(path, body, cookie = "") {
 const r = await fetch(base+path, { method:"POST", headers:{ Origin:base, "Content-Type":"application/json", Cookie:cookie }, body:JSON.stringify(body) });
 return { status:r.status, data:await r.json(), cookie:r.headers.get("set-cookie")?.split(";")[0] ?? "" };
}
async function edit(cart, session, version, reserved, quantity=4) {
 const r = await fetch(base+"/api/admin/carts/"+cart, { method:"PATCH", headers:{ Origin:base,"Content-Type":"application/json",Cookie:session }, body:JSON.stringify({version,items:[{productId,quantity,reserved}]}) });
 return { status:r.status,data:await r.json() };
}
try {
 const [categories] = await db.query("SELECT id FROM categorias WHERE activa=1 LIMIT 1");
 const [roles] = await db.query("SELECT id FROM roles WHERE codigo IN ('admin','administrador') AND activo=1 LIMIT 1");
 const code = "TR"+randomUUID().replaceAll("-","").slice(0,11);
 const [product] = await db.query("INSERT INTO productos (categoria_id,codigo,nombre,slug,precio_venta,stock,activo) VALUES (?,?,?,?,100,5,1)", [categories[0].id,code,"Prueba temporal de reserva",code.toLowerCase()]);
 productId=String(product.insertId);
 const sessions=[];
 for(let i=0;i<2;i++){
  const username="test-reserve-"+randomUUID(), password=randomUUID();
  const [u] = await db.query("INSERT INTO usuarios (nombre,usuario,clave_hash,activo) VALUES (?,?,?,1)",["Prueba temporal de reserva",username,await bcrypt.hash(password,12)]);
  const uid=String(u.insertId);users.push(uid);
  await db.query("INSERT INTO usuarios_roles (id_usuario,id_rol,activo) VALUES (?,?,1)",[uid,roles[0].id]);
  const login=await post("/api/auth/login",{username,password});assert.equal(login.status,200);sessions.push(login.cookie);
  const cart=randomUUID();carts.push(cart);
  await db.query("INSERT INTO carritos (id,usuario_id,items,estado,productos_confirmados,total_estimado) VALUES (?,?,?,'confirmado',?,400)",[cart,uid,JSON.stringify([{productId,quantity:4}]),JSON.stringify([{productId,code,name:"Prueba temporal de reserva",variant:null,quantity:4,unitPrice:100,subtotal:400,reserved:false}])]);
 }
 const results=await Promise.all(carts.map((cart,i)=>edit(cart,sessions[i],0,true)));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409],JSON.stringify(results));
 const winner=results.findIndex(r=>r.status===200);
 const own=await post("/api/cart",{items:[]},sessions[winner]);
 assert.equal(own.data.items[0].quantity,4);
 assert.equal(own.data.lines[0].reserved,true);
 assert.equal(own.data.stock[productId],5,"El propietario conserva acceso a sus unidades");
 const guest=await post("/api/cart",{items:[{productId,quantity:5}]});
 guestCookie=guest.cookie;assert.equal(guest.data.items[0].quantity,1,"Otro cliente solo puede agregar la unidad libre");
 const released=await edit(carts[winner],sessions[winner],own.data.version,false);assert.equal(released.status,200);
 const guestAgain=await post("/api/cart",{items:[{productId,quantity:5}],version:guest.data.version},guestCookie);
 assert.equal(guestAgain.data.items[0].quantity,5);
 const reservedAgain=await edit(carts[winner],sessions[winner],released.data.version,true);assert.equal(reservedAgain.status,200);
 const modified=await post("/api/cart",{items:[{productId,quantity:3}],version:reservedAgain.data.version},sessions[winner]);assert.equal(modified.status,200);
 const [holds]=await db.query("SELECT * FROM carrito_reservas WHERE producto_id=?",[productId]);assert.equal(holds.length,0,"Modificar el carrito libera su reserva");
 const [stock]=await db.query("SELECT stock FROM productos WHERE id=?",[productId]);assert.equal(Number(stock[0].stock),5);
 console.log("Reservas OK: dos clientes concurrentes no duplican unidades; disponibilidad 1/5, persistencia del detalle, liberación y stock físico intacto.");
} finally {
 if(guestCookie) {
  const {createHash}=await import("node:crypto");
  await db.query("DELETE FROM carritos WHERE token_hash=?",[createHash("sha256").update(guestCookie.split("=")[1]).digest("hex")]);
 }
 if(carts.length)await db.query("DELETE FROM carritos WHERE id IN (?)",[carts]);
 if(users.length){await db.query("DELETE FROM sesiones WHERE id_usuario IN (?)",[users]);await db.query("DELETE FROM usuarios_roles WHERE id_usuario IN (?)",[users]);await db.query("DELETE FROM usuarios WHERE id IN (?)",[users]);}
 if(productId)await db.query("DELETE FROM productos WHERE id=?",[productId]);
 await db.end();
}