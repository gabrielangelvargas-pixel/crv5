import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env } from './config/env.js';
import { database } from './config/database.js';
import { authRouter } from './routes/auth.routes.js';
import { catalogoRouter } from './routes/catalogo.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { rubrosRouter } from './routes/rubros.routes.js';

const logger = pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' });
const app = express();
const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(pinoHttp({ logger }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/catalogo', catalogoRouter);
app.use('/api/rubros', rubrosRouter);

app.get('/catalogo', async (request, response, next) => {
  try {
    let html = await fs.readFile(path.join(publicDirectory, 'catalogo.html'), 'utf8');
    const slug = typeof request.query.rubro === 'string' ? request.query.rubro.trim() : '';
    const baseUrl = `${request.protocol}://${request.get('host')}`;
    let metadata = {
      title: 'Catálogo mayorista | CRV4',
      description: 'Explorá rubros y categorías de productos mayoristas para tu negocio.',
      image: `${baseUrl}/images/og-crv4-mayorista.png`,
      imageAlt: 'CRV4 Mayorista',
      url: `${baseUrl}/catalogo`,
    };

    if (slug) {
      const [rows] = await database.query(
        'SELECT nombre, descripcion, imagen FROM rubros WHERE slug = ? AND activo = TRUE LIMIT 1',
        [slug],
      );
      if (rows[0]) {
        const storedImage = rows[0].imagen || `/images/rubros/${slug}.png`;
        let socialImage = storedImage;
        if (storedImage.startsWith('/')) {
          const socialFile = path.basename(storedImage).replace(/\.[^.]+$/, '.jpg');
          const socialPath = path.join(publicDirectory, 'images', 'social', socialFile);
          try {
            await fs.access(socialPath);
            socialImage = `/images/social/${socialFile}`;
          } catch {
            // Keep the original database image when no optimized preview exists.
          }
        }
        metadata = {
          title: `${rows[0].nombre} | CRV4 Mayorista`,
          description: rows[0].descripcion || `Explorá productos mayoristas de ${rows[0].nombre}.`,
          image: socialImage.startsWith('http') ? socialImage : `${baseUrl}${socialImage}`,
          imageAlt: rows[0].nombre,
          url: `${baseUrl}/catalogo?rubro=${encodeURIComponent(slug)}`,
        };
      }
    }

    const escapeAttribute = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const replaceMeta = (source, attribute, name, value) => source.replace(new RegExp(`(<meta\\s+${attribute}="${name}"\\s+content=")[^"]*(")`, 'i'), `$1${escapeAttribute(value)}$2`);
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttribute(metadata.title)}</title>`);
    html = replaceMeta(html, 'name', 'description', metadata.description);
    html = replaceMeta(html, 'property', 'og:title', metadata.title);
    html = replaceMeta(html, 'property', 'og:description', metadata.description);
    html = replaceMeta(html, 'property', 'og:url', metadata.url);
    html = replaceMeta(html, 'property', 'og:image', metadata.image);
    html = replaceMeta(html, 'property', 'og:image:alt', metadata.imageAlt);
    html = replaceMeta(html, 'name', 'twitter:title', metadata.title);
    html = replaceMeta(html, 'name', 'twitter:description', metadata.description);
    html = replaceMeta(html, 'name', 'twitter:image', metadata.image);
    return response.type('html').send(html);
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(publicDirectory, {
  extensions: ['html'],
  setHeaders(response, filePath) {
    const fileName = path.basename(filePath);
    if (['sw.js', 'manifest.webmanifest', 'app.js', 'styles.css'].includes(fileName)) {
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

app.use((_request, response) => {
  response.status(404).json({ error: 'Recurso no encontrado' });
});

app.use((error, _request, response, _next) => {
  logger.error(error);
  response.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'CRV5 iniciado');
});
