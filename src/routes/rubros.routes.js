import { Router } from 'express';
import { database } from '../config/database.js';
import { requireStaff } from '../middleware/auth.js';

export const rubrosRouter = Router();
rubrosRouter.use(requireStaff);

rubrosRouter.get('/', async (_request, response, next) => {
  try {
    const [rows] = await database.query(`
      SELECT id, id_rubro_padre, codigo, slug, nombre, descripcion, imagen, orden, activo, creado, actualizado
      FROM rubros
      ORDER BY activo DESC, orden ASC, nombre ASC
    `);
    return response.json({ rubros: rows });
  } catch (error) {
    return next(error);
  }
});

rubrosRouter.post('/', async (request, response, next) => {
  const { codigo, slug, nombre, descripcion = null, imagen = null, orden = 0, id_rubro_padre = null } = request.body ?? {};
  if (![codigo, slug, nombre].every((value) => typeof value === 'string' && value.trim())) {
    return response.status(400).json({ error: 'Código, slug y nombre son obligatorios.' });
  }

  try {
    const [result] = await database.query(`
      INSERT INTO rubros (codigo, slug, nombre, descripcion, imagen, orden, id_rubro_padre)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [codigo.trim(), slug.trim(), nombre.trim(), descripcion?.trim() || null, imagen?.trim() || null, Number(orden) || 0, id_rubro_padre || null]);
    const [rows] = await database.query('SELECT * FROM rubros WHERE id = ?', [result.insertId]);
    return response.status(201).json({ rubro: rows[0] });
  } catch (error) {
    return next(error);
  }
});

rubrosRouter.patch('/:id', async (request, response, next) => {
  const { codigo, slug, nombre, descripcion = null, imagen = null, orden = 0, id_rubro_padre = null, activo = true } = request.body ?? {};
  if (![codigo, slug, nombre].every((value) => typeof value === 'string' && value.trim())) {
    return response.status(400).json({ error: 'Código, slug y nombre son obligatorios.' });
  }

  try {
    const [result] = await database.query(`
      UPDATE rubros
      SET codigo = ?, slug = ?, nombre = ?, descripcion = ?, imagen = ?, orden = ?, id_rubro_padre = ?, activo = ?
      WHERE id = ?
    `, [codigo.trim(), slug.trim(), nombre.trim(), descripcion?.trim() || null, imagen?.trim() || null, Number(orden) || 0, id_rubro_padre || null, Boolean(activo), request.params.id]);
    if (!result.affectedRows) return response.status(404).json({ error: 'Rubro no encontrado.' });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

rubrosRouter.delete('/:id', async (request, response, next) => {
  try {
    const [result] = await database.query('UPDATE rubros SET activo = FALSE WHERE id = ?', [request.params.id]);
    if (!result.affectedRows) return response.status(404).json({ error: 'Rubro no encontrado.' });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});
