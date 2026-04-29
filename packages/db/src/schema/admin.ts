import { sql } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    adminIdx: index('admin_audit_log_admin_idx').on(t.adminUserId),
    createdIdx: index('admin_audit_log_created_idx').on(t.createdAt),
    actionIdx: index('admin_audit_log_action_idx').on(t.action),
  }),
);

export const loginHistory = pgTable(
  'login_history',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    success: boolean('success').notNull(),
    failureReason: text('failure_reason'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    attemptedAt: timestamp('attempted_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    emailIdx: index('login_history_email_idx').on(t.email),
    attemptedIdx: index('login_history_attempted_idx').on(t.attemptedAt),
    userIdx: index('login_history_user_idx').on(t.userId),
  }),
);

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;
export type LoginHistoryEntry = typeof loginHistory.$inferSelect;
export type NewLoginHistoryEntry = typeof loginHistory.$inferInsert;
