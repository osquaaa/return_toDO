import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

import { genId } from '../id';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    email: text('email').notNull(),
    emailVerified: timestamp('email_verified', { withTimezone: true, mode: 'date' }),
    name: text('name'),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    roleIdx: index('users_role_idx').on(t.role),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tokenIdx: uniqueIndex('sessions_token_idx').on(t.token),
    userIdx: index('sessions_user_idx').on(t.userId),
  }),
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('accounts_user_idx').on(t.userId),
    providerAccountIdx: uniqueIndex('accounts_provider_account_idx').on(t.providerId, t.accountId),
  }),
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    identifierIdx: index('verifications_identifier_idx').on(t.identifier),
    expiresIdx: index('verifications_expires_idx').on(t.expiresAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
