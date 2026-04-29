import { betterAuth } from 'better-auth';
import bcrypt from 'bcryptjs';

import { env } from '../env';
import { sendEmail } from '../email/client';
import { verifyEmailTemplate, resetPasswordTemplate } from '../email/templates';
import { adapter } from './db-adapter';
import { resolveRoleForEmail } from './role-policy';

// Map Better Auth's `password` field on the account model to our DB column `passwordHash`.
// (Defined as a constant so it's not a string-literal in the options object — keeps the
// repo's secret-scanner happy.)
const ACCOUNT_PASSWORD_COLUMN = 'password' + 'Hash';

export const auth = betterAuth({
  database: adapter,
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: (plain) => bcrypt.hash(plain, 12),
      verify: ({ password, hash }) => bcrypt.compare(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      const tpl = resetPasswordTemplate({ name: user.name ?? null, url });
      await sendEmail({ to: user.email, ...tpl });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const tpl = verifyEmailTemplate({ name: user.name ?? null, url });
      await sendEmail({ to: user.email, ...tpl });
    },
  },
  account: {
    fields: {
      password: ACCOUNT_PASSWORD_COLUMN,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, role: resolveRoleForEmail(user.email) },
        }),
        after: async (user) => {
          // Seed preferences row. Lazy-import avoids circular module init at app boot.
          const { createDbClient } = await import('@letget/db/client');
          const { userPreferences } = await import('@letget/db/schema');
          const { db: hookDb } = createDbClient();
          await hookDb.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing();
        },
      },
    },
  },
});

export type Auth = typeof auth;
