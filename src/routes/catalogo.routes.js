import { Router } from 'express';
import { database } from '../config/database.js';

export const catalogoRouter = Router();

catalogoRouter.get('/rubros', async (_request, response, next) => {
  try {
    const [rows] = await database.query(`
      SELECT id, codigo, slug, nombre, descripcion, imagen, orden
      FROM rubros
      WHERE id_rubro_padre IS NULL AND activo = TRUE
      ORDER BY orden ASC, nombre ASC
    `);
    return response.json({ rubros: rows });
  } catch (error) {
    return next(error);
  }
});

catalogoRouter.get('/rubros/:slug', async (request, response, next) => {
  try {
    const [rubros] = await database.query(`
      SELECT id, codigo, slug, nombre, descripcion, imagen, orden
      FROM rubros
      WHERE slug = ? AND activo = TRUE
      LIMIT 1
    `, [request.params.slug]);
    if (!rubros[0]) return response.status(404).json({ error: 'Rubro no encontrado.' });

    const [hijos] = await database.query(`
      SELECT id, codigo, slug, nombre, descripcion, imagen, orden
      FROM rubros
      WHERE id_rubro_padre = ? AND activo = TRUE
      ORDER BY orden ASC, nombre ASC
    `, [rubros[0].id]);

    return response.json({ rubro: rubros[0], hijos, productos: [] });
  } catch (error) {
    return next(error);
  }
});
