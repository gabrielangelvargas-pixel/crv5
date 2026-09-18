import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env } from './config/env.js';
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
app.use(express.static(publicDirectory, { extensions: ['html'] }));

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
