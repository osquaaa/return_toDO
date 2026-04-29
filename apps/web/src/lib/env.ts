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
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be ≥32 chars'),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);
