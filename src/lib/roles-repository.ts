import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDatabasePool } from "@/lib/db";

export type AdminPermission = { id: string; code: string; name: string; description: string | null; module: string; action: string };
export type AdminRole = { id: string; code: string; name: string; description: string | null; active: boolean; permissions: string[] };
type RoleRow = RowDataPacket & { id: number | string | bigint; codigo: string; nombre: string; descripcion: string | null; activo: number; permisos: string | null };
type PermissionRow = RowDataPacket & { id: number | string | bigint; codigo: string; nombre: string; descripcion: string | null; modulo: string; accion: string };

export async function getAdminRoles(): Promise<AdminRole[]> {
  const [rows] = await getDatabasePool().query<RoleRow[]>(`
    SELECT r.id, r.codigo, r.nombre, r.descripcion, r.activo,
      GROUP_CONCAT(CASE WHEN rp.activo = 1 THEN p.codigo END SEPARATOR ',') AS permisos
    FROM roles r
    LEFT JOIN roles_permisos rp ON rp.id_rol = r.id
    LEFT JOIN permisos p ON p.id = rp.id_permiso AND p.activo = 1
    GROUP BY r.id, r.codigo, r.nombre, r.descripcion, r.activo
    ORDER BY r.activo DESC, r.nombre ASC
  `);
  return rows.map((row) => ({ id: String(row.id), code: row.codigo, name: row.nombre, description: row.descripcion, active: Boolean(row.activo), permissions: row.permisos ? row.permisos.split(",") : [] }));
}

export async function getAdminPermissions(): Promise<AdminPermission[]> {
  const [rows] = await getDatabasePool().query<PermissionRow[]>(`SELECT id, codigo, nombre, descripcion, modulo, accion FROM permisos WHERE activo = 1 ORDER BY modulo, accion, nombre`);
  return rows.map((row) => ({ id: String(row.id), code: row.codigo, name: row.nombre, description: row.descripcion, module: row.modulo, action: row.accion }));
}

export type RoleInput = { code: string; name: string; description: string; active: boolean; permissionIds: string[] };

export async function saveAdminRole(id: string | undefined, input: RoleInput) {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    let roleId = id;
    if (roleId) {
      await connection.query("UPDATE roles SET codigo = ?, nombre = ?, descripcion = ?, activo = ? WHERE id = ?", [input.code.trim(), input.name.trim(), input.description.trim() || null, input.active ? 1 : 0, roleId]);
    } else {
      const [result] = await connection.query<ResultSetHeader>("INSERT INTO roles (codigo, nombre, descripcion, activo) VALUES (?, ?, ?, ?)", [input.code.trim(), input.name.trim(), input.description.trim() || null, input.active ? 1 : 0]);
      roleId = String(result.insertId);
    }
    await connection.query("UPDATE roles_permisos SET activo = 0 WHERE id_rol = ?", [roleId]);
    for (const permissionId of input.permissionIds) {
      await connection.query("INSERT INTO roles_permisos (id_rol, id_permiso, activo) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE activo = 1, actualizado = CURRENT_TIMESTAMP", [roleId, permissionId]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
