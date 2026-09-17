import 'dotenv/config';
import { z } from 'zod';

const booleanFromEnv = z.preprocess(
  (value) => value === 'true' || value === true,
  z.boolean(),
);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_ORIGIN: z.string().url().default('http://localhost:3000'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default('crv5'),
  DB_USER: z.string().default('crv5'),
  DB_PASSWORD: z.string().default(''),
  DB_SSL: booleanFromEnv.default(false),
  SESSION_SECRET: z.string().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuracion de entorno invalida:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
