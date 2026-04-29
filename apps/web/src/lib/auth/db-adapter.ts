import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDbClient } from '@letget/db/client';
import { users, sessions, accounts, verifications } from '@letget/db/schema';

const { db } = createDbClient();

export const adapter = drizzleAdapter(db, {
  provider: 'pg',
  schema: {
    user: users,
    session: sessions,
    account: accounts,
    verification: verifications,
  },
});
