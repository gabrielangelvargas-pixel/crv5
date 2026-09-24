import {
  boolean,
  char,
  foreignKey,
  datetime,
  index,
  int,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const roles = mysqlTable("roles", {
  id: tinyint("id", { unsigned: true }).autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 40 }).notNull(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  creado: timestamp("creado").notNull().defaultNow(),
  actualizado: timestamp("actualizado").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  codigoUnico: uniqueIndex("uq_roles_codigo").on(table.codigo),
}));

export const permisos = mysqlTable("permisos", {
  id: smallint("id", { unsigned: true }).autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 80 }).notNull(),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  descripcion: text("descripcion"),
  modulo: varchar("modulo", { length: 60 }).notNull(),
  accion: varchar("accion", { length: 40 }).notNull(),
  activo: boolean("activo").notNull().default(true),
  creado: timestamp("creado").notNull().defaultNow(),
  actualizado: timestamp("actualizado").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  codigoUnico: uniqueIndex("uq_permisos_codigo").on(table.codigo),
  moduloAccionUnico: uniqueIndex("uq_permisos_modulo_accion").on(table.modulo, table.accion),
}));

export const usuarios = mysqlTable("usuarios", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  usuario: varchar("usuario", { length: 80 }).notNull(),
  claveHash: varchar("clave_hash", { length: 255 }).notNull(),
  activo: boolean("activo").notNull().default(true),
  ultimoAcceso: datetime("ultimo_acceso"),
  creado: timestamp("creado").notNull().defaultNow(),
  actualizado: timestamp("actualizado").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  usuarioUnico: uniqueIndex("uq_usuarios_usuario").on(table.usuario),
  activoIndice: index("idx_usuarios_activo").on(table.activo),
}));

export const usuariosRoles = mysqlTable("usuarios_roles", {
  idUsuario: int("id_usuario", { unsigned: true }).notNull(),
  idRol: tinyint("id_rol", { unsigned: true }).notNull(),
  activo: boolean("activo").notNull().default(true),
  creado: timestamp("creado").notNull().defaultNow(),
  actualizado: timestamp("actualizado").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.idUsuario, table.idRol] }),
  rolIndice: index("idx_usuarios_roles_rol").on(table.idRol),
  usuarioFk: foreignKey({
    columns: [table.idUsuario],
    foreignColumns: [usuarios.id],
    name: "fk_usuarios_roles_usuario",
  }),
  rolFk: foreignKey({
    columns: [table.idRol],
    foreignColumns: [roles.id],
    name: "fk_usuarios_roles_rol",
  }),
}));

export const rolesPermisos = mysqlTable("roles_permisos", {
  idRol: tinyint("id_rol", { unsigned: true }).notNull(),
  idPermiso: smallint("id_permiso", { unsigned: true }).notNull(),
  activo: boolean("activo").notNull().default(true),
  creado: timestamp("creado").notNull().defaultNow(),
  actualizado: timestamp("actualizado").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.idRol, table.idPermiso] }),
  permisoIndice: index("idx_roles_permisos_permiso").on(table.idPermiso),
  rolFk: foreignKey({
    columns: [table.idRol],
    foreignColumns: [roles.id],
    name: "fk_roles_permisos_rol",
  }),
  permisoFk: foreignKey({
    columns: [table.idPermiso],
    foreignColumns: [permisos.id],
    name: "fk_roles_permisos_permiso",
  }),
}));

export const sesiones = mysqlTable("sesiones", {
  id: char("id", { length: 36 }).primaryKey(),
  idUsuario: int("id_usuario", { unsigned: true }).notNull(),
  tokenHash: char("token_hash", { length: 64 }).notNull(),
  expiraEn: datetime("expira_en"),
  revocadaEn: datetime("revocada_en"),
  creado: timestamp("creado").notNull().defaultNow(),
}, (table) => ({
  tokenUnico: uniqueIndex("uq_sesiones_token_hash").on(table.tokenHash),
  usuarioIndice: index("idx_sesiones_usuario").on(table.idUsuario),
  expiracionIndice: index("idx_sesiones_expiracion").on(table.expiraEn),
  usuarioFk: foreignKey({
    columns: [table.idUsuario],
    foreignColumns: [usuarios.id],
    name: "fk_sesiones_usuario",
  }),
}));

export const rubros = mysqlTable("rubros", {
  id: smallint("id", { unsigned: true }).autoincrement().primaryKey(),
  idRubroPadre: smallint("id_rubro_padre", { unsigned: true }),
  codigo: varchar("codigo", { length: 40 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  descripcion: text("descripcion"),
  imagen: varchar("imagen", { length: 500 }),
  orden: smallint("orden", { unsigned: true }).notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  creado: timestamp("creado").notNull().defaultNow(),
  actualizado: timestamp("actualizado").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  codigoUnico: uniqueIndex("uq_rubros_codigo").on(table.codigo),
  slugUnico: uniqueIndex("uq_rubros_slug").on(table.slug),
  padreIndice: index("idx_rubros_padre").on(table.idRubroPadre),
  ordenIndice: index("idx_rubros_orden").on(table.activo, table.idRubroPadre, table.orden),
  padreFk: foreignKey({
    columns: [table.idRubroPadre],
    foreignColumns: [table.id],
    name: "fk_rubros_padre",
  }).onDelete("set null"),
}));

export const schema = {
  roles,
  permisos,
  usuarios,
  usuariosRoles,
  rolesPermisos,
  sesiones,
  rubros,
};
