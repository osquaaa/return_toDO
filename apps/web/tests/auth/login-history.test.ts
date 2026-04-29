import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { createDbClient } from '@letget/db/client';
import { loginHistory, users } from '@letget/db/schema';
import { genId } from '@letget/db';
import { recordLoginAttempt } from '../../src/lib/auth/login-history';

const { db } = createDbClient();

async function makeUser(email: string): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email, role: 'user' });
  return id;
}

describe('recordLoginAttempt', () => {
  it('inserts a success row with userId', async () => {
    const userId = await makeUser(`success-${Date.now()}@test.local`);
    const before = await db.select().from(loginHistory).where(eq(loginHistory.userId, userId));
    await recordLoginAttempt({
      email: 'x@y.z',
      success: true,
      userId,
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    const after = await db.select().from(loginHistory).where(eq(loginHistory.userId, userId));
    expect(after.length).toBe(before.length + 1);
  });

  it('inserts a failure row with no userId and a reason', async () => {
    const email = `unknown-${Date.now()}@y.z`;
    await recordLoginAttempt({
      email,
      success: false,
      failureReason: 'wrong_password',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    const rows = await db.select().from(loginHistory).where(eq(loginHistory.email, email));
    expect(rows.length).toBe(1);
    expect(rows[0].failureReason).toBe('wrong_password');
  });
});
