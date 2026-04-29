import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string().min(1),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_DB: z.coerce.number().int().nonnegative(),
  APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
