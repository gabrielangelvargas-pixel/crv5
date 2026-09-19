import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { database } from '../config/database.js';
import { env } from '../config/env.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const SESSION_COOKIE = 'crv5_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá nuevamente en unos minutos.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Se alcanzó el límite de registros. Probá nuevamente más tarde.' },
});

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

authRouter.post('/login', loginLimiter, async (request, response, next) => {
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

    if (!user || !user.activo || !(await verifyPassword(clave, user.clave_hash))) {
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

authRouter.post('/register', registerLimiter, async (request, response, next) => {
  const { nombre, usuario, clave } = request.body ?? {};
  const cleanName = typeof nombre === 'string' ? nombre.trim() : '';
  const cleanUser = typeof usuario === 'string' ? usuario.trim().toLowerCase() : '';

  if (cleanName.length < 2 || cleanName.length > 100) {
    return response.status(400).json({ error: 'Ingresá un nombre válido.' });
  }
  if (!/^[a-z0-9._-]{3,80}$/.test(cleanUser)) {
    return response.status(400).json({ error: 'El usuario debe tener entre 3 y 80 caracteres: letras, números, punto, guion o guion bajo.' });
  }
  if (typeof clave !== 'string' || clave.length < 8 || clave.length > 128) {
    return response.status(400).json({ error: 'La clave debe tener entre 8 y 128 caracteres.' });
  }

  let connection;
  try {
    connection = await database.getConnection();
    await connection.beginTransaction();
    const [roleRows] = await connection.query('SELECT id FROM roles WHERE codigo = ? AND activo = TRUE LIMIT 1', ['cliente']);
    if (!roleRows[0]) throw new Error('El rol cliente no está configurado.');
    const [userResult] = await connection.query(
      'INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, TRUE)',
      [cleanName, cleanUser, await hashPassword(clave)],
    );
    await connection.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol, activo) VALUES (?, ?, TRUE)',
      [userResult.insertId, roleRows[0].id],
    );
    await connection.commit();
    return response.status(201).json({ usuario: { id: userResult.insertId, nombre: cleanName, usuario: cleanUser } });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'Ese nombre de usuario ya está registrado.' });
    return next(error);
  } finally {
    connection?.release();
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
