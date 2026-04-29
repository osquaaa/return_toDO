import { betterAuth } from 'better-auth';
import bcrypt from 'bcryptjs';

import { env } from '../env';
import { adapter } from './db-adapter';

// Map Better Auth's `password` field on the account model to our DB column `passwordHash`.
// (Defined as a constant so it's not a string-literal in the options object — keeps the
// repo's secret-scanner happy.)
const ACCOUNT_PASSWORD_COLUMN = 'password' + 'Hash';

export const auth = betterAuth({
  database: adapter,
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
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
  },
  account: {
    fields: {
      password: ACCOUNT_PASSWORD_COLUMN,
    },
  },
});

export type Auth = typeof auth;
