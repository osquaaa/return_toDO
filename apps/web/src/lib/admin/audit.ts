import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { adminAuditLog } from '@letget/db/schema';

const { db } = createDbClient();

type Args = {
  adminUserId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAdminAction(args: Args) {
  await db.insert(adminAuditLog).values({
    id: genId(),
    adminUserId: args.adminUserId,
    action: args.action,
    targetType: args.targetType ?? null,
    targetId: args.targetId ?? null,
    metadata: args.metadata ?? null,
    ipAddress: args.ipAddress ?? null,
    userAgent: args.userAgent ?? null,
  });
}
