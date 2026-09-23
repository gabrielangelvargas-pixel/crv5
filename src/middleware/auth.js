import crypto from 'node:crypto';
import { database } from '../config/database.js';

const SESSION_COOKIE = 'crv5_session';

function sessionTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function getSessionUser(request) {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return null;

  const [rows] = await database.query(`
    SELECT u.id, u.nombre, u.usuario,
           GROUP_CONCAT(DISTINCT r.codigo ORDER BY r.codigo SEPARATOR ',') AS codigos_roles
    FROM sesiones s
    JOIN usuarios u ON u.id = s.id_usuario AND u.activo = TRUE
    LEFT JOIN usuarios_roles ur ON ur.id_usuario = u.id AND ur.activo = TRUE
    LEFT JOIN roles r ON r.id = ur.id_rol AND r.activo = TRUE
    WHERE s.token_hash = ? AND s.revocada_en IS NULL AND (s.expira_en IS NULL OR s.expira_en > NOW())
    GROUP BY u.id, u.nombre, u.usuario
    LIMIT 1
  `, [sessionTokenHash(token)]);

  if (!rows[0]) return null;
  return { ...rows[0], roles: rows[0].codigos_roles?.split(',') ?? [] };
}

export async function requireStaff(request, response, next) {
  try {
    const user = await getSessionUser(request);
    if (!user) return response.status(401).json({ error: 'Sesión no iniciada.' });
    if (user.roles.includes('cliente')) return response.status(403).json({ error: 'No tenés permisos para acceder a este módulo.' });
    request.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
