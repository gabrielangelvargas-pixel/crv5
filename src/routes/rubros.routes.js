import { Router } from 'express';
import { z } from 'zod';
import { database } from '../config/database.js';
import { requireStaff } from '../middleware/auth.js';

export const rubrosRouter = Router();
rubrosRouter.use(requireStaff);

const optionalText = (max) => z.preprocess(
  (value) => value === '' || value === undefined ? null : value,
  z.string().trim().max(max).nullable(),
);

const booleanInput = z.preprocess((value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}, z.boolean());

const rubroInput = z.object({
  codigo: z.string().trim().min(1).max(40),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug debe usar minúsculas y guiones.'),
  nombre: z.string().trim().min(1).max(150),
  descripcion: optionalText(5000).optional(),
  imagen: optionalText(500).refine((value) => value === null || value.startsWith('/') || /^https?:\/\//i.test(value), 'La imagen debe ser una ruta local o URL.'),
  orden: z.coerce.number().int().min(0).max(32767).default(0),
  id_rubro_padre: z.preprocess((value) => value === '' || value === undefined ? null : value, z.coerce.number().int().positive().nullable()).default(null),
});

const rubroUpdate = rubroInput.extend({ activo: booleanInput.default(true) });
const idParam = z.coerce.number().int().positive();

function parseBody(schema, request, response) {
  const result = schema.safeParse(request.body ?? {});
  if (!result.success) {
    response.status(400).json({ error: 'Los datos del rubro no son válidos.', detalles: result.error.flatten().fieldErrors });
    return null;
  }
  return result.data;
}

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
  const payload = parseBody(rubroInput, request, response);
  if (!payload) return;

  try {
    const [result] = await database.query(`
      INSERT INTO rubros (codigo, slug, nombre, descripcion, imagen, orden, id_rubro_padre)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [payload.codigo, payload.slug, payload.nombre, payload.descripcion, payload.imagen, payload.orden, payload.id_rubro_padre]);
    const [rows] = await database.query('SELECT * FROM rubros WHERE id = ?', [result.insertId]);
    return response.status(201).json({ rubro: rows[0] });
  } catch (error) {
    return next(error);
  }
});

rubrosRouter.patch('/:id', async (request, response, next) => {
  const id = idParam.safeParse(request.params.id);
  if (!id.success) return response.status(400).json({ error: 'El identificador del rubro no es válido.' });
  const payload = parseBody(rubroUpdate, request, response);
  if (!payload) return;

  try {
    const [result] = await database.query(`
      UPDATE rubros
      SET codigo = ?, slug = ?, nombre = ?, descripcion = ?, imagen = ?, orden = ?, id_rubro_padre = ?, activo = ?
      WHERE id = ?
    `, [payload.codigo, payload.slug, payload.nombre, payload.descripcion, payload.imagen, payload.orden, payload.id_rubro_padre, payload.activo, id.data]);
    if (!result.affectedRows) return response.status(404).json({ error: 'Rubro no encontrado.' });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

rubrosRouter.delete('/:id', async (request, response, next) => {
  const id = idParam.safeParse(request.params.id);
  if (!id.success) return response.status(400).json({ error: 'El identificador del rubro no es válido.' });
  try {
    const [result] = await database.query('UPDATE rubros SET activo = FALSE WHERE id = ?', [id.data]);
    if (!result.affectedRows) return response.status(404).json({ error: 'Rubro no encontrado.' });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});
