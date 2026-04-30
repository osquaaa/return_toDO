import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/schema/auth.ts',
    './src/schema/telegram.ts',
    './src/schema/preferences.ts',
    './src/schema/notifications.ts',
    './src/schema/admin.ts',
    './src/schema/tasks.ts',
    './src/schema/shopping.ts',
    './src/schema/code.ts',
    './src/schema/workouts.ts',
    './src/schema/habits.ts',
    './src/schema/finance.ts',
    './src/schema/calendar.ts',
    './src/schema/reading.ts',
    './src/schema/recipes.ts',
    './src/schema/contacts.ts',
    './src/schema/time-tracker.ts',
  ],
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
