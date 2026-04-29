import { createDbClient } from '@letget/db/client';
import { loginHistory } from '@letget/db/schema';
import { genId } from '@letget/db';

const { db } = createDbClient();

type Args = {
  userId?: string | null;
  email: string;
  success: boolean;
  failureReason?: 'wrong_password' | 'email_not_verified' | 'account_disabled' | 'rate_limited';
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordLoginAttempt(args: Args): Promise<void> {
  await db.insert(loginHistory).values({
    id: genId(),
    userId: args.userId ?? null,
    email: args.email,
    success: args.success,
    failureReason: args.failureReason ?? null,
    ipAddress: args.ipAddress ?? null,
    userAgent: args.userAgent ?? null,
    attemptedAt: new Date(),
  });
}
