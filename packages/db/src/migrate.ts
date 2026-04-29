import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDbClient } from './client.js';

async function runMigrate() {
  const { db, sql } = createDbClient();
  console.warn('🚧 Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.warn('✅ Migrations complete');
  await sql.end();
  process.exit(0);
}

runMigrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
