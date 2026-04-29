import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5440),
    user: process.env.DB_USER ?? 'letget',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'letget',
    ssl: false,
  },
  verbose: true,
  strict: true,
});
