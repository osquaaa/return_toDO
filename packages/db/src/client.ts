import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

interface DbConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

function readConfig(): DbConfig {
  const cfg = {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5440),
    database: process.env.DB_NAME ?? 'letget',
    username: process.env.DB_USER ?? 'letget',
    password: process.env.DB_PASSWORD ?? '',
  };
  if (!cfg.password) {
    throw new Error('DB_PASSWORD env var is required');
  }
  return cfg;
}

export function createDbClient() {
  const cfg = readConfig();
  const sql = postgres({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    max: 10,
    idle_timeout: 20,
  });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type Db = ReturnType<typeof createDbClient>['db'];
