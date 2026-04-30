import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, adminAuditLog } from '@letget/db/schema';

import { logAdminAction } from '../../src/lib/admin/audit';

const { db } = createDbClient();

async function makeAdmin(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `admin-${id}@test.local`, role: 'admin' });
  return id;
}

describe('logAdminAction', () => {
  it('inserts audit row with all fields', async () => {
    const adminId = await makeAdmin();
    await logAdminAction({
      adminUserId: adminId,
      action: 'force_logout',
      targetType: 'user',
      targetId: 'target-1',
      metadata: { reason: 'security' },
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    const rows = await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.adminUserId, adminId));
    expect(rows.length).toBe(1);
    expect(rows[0].action).toBe('force_logout');
    expect(rows[0].targetId).toBe('target-1');
    expect(rows[0].metadata).toEqual({ reason: 'security' });
  });

  it('inserts row with minimal fields', async () => {
    const adminId = await makeAdmin();
    await logAdminAction({ adminUserId: adminId, action: 'view_user_content' });
    const rows = await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.adminUserId, adminId));
    expect(rows.length).toBe(1);
    expect(rows[0].targetType).toBeNull();
  });
});
