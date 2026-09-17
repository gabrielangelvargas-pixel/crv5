import crypto from 'node:crypto';
import { Router } from 'express';
import { database } from '../config/database.js';
import { env } from '../config/env.js';
import { verifyPassword } from '../utils/password.js';

const SESSION_COOKIE = 'crv5_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const authRouter = Router();

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  };
}

function sessionTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

authRouter.post('/login', async (request, response, next) => {
  const { usuario, clave } = request.body ?? {};
  if (typeof usuario !== 'string' || typeof clave !== 'string' || !usuario.trim() || !clave) {
    return response.status(400).json({ error: 'Ingresá usuario y clave.' });
  }

  try {
    const [rows] = await database.query(`
      SELECT u.id, u.nombre, u.usuario, u.clave_hash, u.activo,
             GROUP_CONCAT(DISTINCT r.codigo ORDER BY r.codigo SEPARATOR ',') AS codigos_roles
      FROM usuarios u
      LEFT JOIN usuarios_roles ur ON ur.id_usuario = u.id AND ur.activo = TRUE
      LEFT JOIN roles r ON r.id = ur.id_rol AND r.activo = TRUE
      WHERE u.usuario = ?
      GROUP BY u.id, u.nombre, u.usuario, u.clave_hash, u.activo
      LIMIT 1
    `, [usuario.trim()]);
    const user = rows[0];

    if (!user || !user.activo || !verifyPassword(clave, user.clave_hash)) {
      return response.status(401).json({ error: 'Usuario o clave incorrectos.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await database.query(
      'INSERT INTO sesiones (id, id_usuario, token_hash, expira_en) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, sessionTokenHash(token), expiresAt],
    );
    await database.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);

    response.cookie(SESSION_COOKIE, token, cookieOptions());
    return response.json({
      usuario: { id: user.id, nombre: user.nombre, usuario: user.usuario, roles: user.codigos_roles?.split(',') ?? [] },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/me', async (request, response, next) => {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return response.status(401).json({ error: 'Sesión no iniciada.' });

  try {
    const [rows] = await database.query(`
      SELECT u.id, u.nombre, u.usuario,
             GROUP_CONCAT(DISTINCT r.codigo ORDER BY r.codigo SEPARATOR ',') AS codigos_roles
      FROM sesiones s
      JOIN usuarios u ON u.id = s.id_usuario AND u.activo = TRUE
      LEFT JOIN usuarios_roles ur ON ur.id_usuario = u.id AND ur.activo = TRUE
      LEFT JOIN roles r ON r.id = ur.id_rol AND r.activo = TRUE
      WHERE s.token_hash = ? AND s.revocada_en IS NULL AND s.expira_en > NOW()
      GROUP BY u.id, u.nombre, u.usuario
      LIMIT 1
    `, [sessionTokenHash(token)]);
    if (!rows[0]) return response.status(401).json({ error: 'Sesión expirada.' });
    return response.json({ usuario: { ...rows[0], roles: rows[0].codigos_roles?.split(',') ?? [] } });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/logout', async (request, response, next) => {
  const token = request.cookies[SESSION_COOKIE];
  try {
    if (token) await database.query('UPDATE sesiones SET revocada_en = NOW() WHERE token_hash = ?', [sessionTokenHash(token)]);
    response.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});
