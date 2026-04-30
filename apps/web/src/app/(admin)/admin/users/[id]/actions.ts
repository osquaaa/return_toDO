'use server';

import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { createDbClient } from '@letget/db/client';

import { logAdminAction } from '@/lib/admin/audit';
import { requireAdminContext } from '@/lib/admin/guard';

const { db } = createDbClient();

type Result = { ok: true } | { ok: false; error: string };

export async function forceLogoutAction(userId: string): Promise<Result> {
  const ctx = await requireAdminContext();
  await logAdminAction({
    adminUserId: ctx.user.id,
    action: 'force_logout',
    targetType: 'user',
    targetId: userId,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
  await db.execute(sql`delete from sessions where user_id = ${userId}`);
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function updateUserRoleAction(
  userId: string,
  role: 'user' | 'admin',
): Promise<Result> {
  const ctx = await requireAdminContext();
  if (ctx.user.id === userId) return { ok: false, error: 'Нельзя менять свою роль' };
  await logAdminAction({
    adminUserId: ctx.user.id,
    action: 'update_user_role',
    targetType: 'user',
    targetId: userId,
    metadata: { newRole: role },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
  await db.execute(sql`update users set role = ${role}, updated_at = now() where id = ${userId}`);
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function deleteUserAction(userId: string, confirmPhrase: string): Promise<Result> {
  const ctx = await requireAdminContext();
  if (ctx.user.id === userId) return { ok: false, error: 'Нельзя удалить себя' };

  const rows = (await db.execute<{ email: string }>(
    sql`select email from users where id = ${userId}`,
  )) as unknown as { email: string }[];
  const u = rows[0];
  if (!u) return { ok: false, error: 'Юзер не найден' };
  const expected = `DELETE ${u.email}`;
  if (confirmPhrase !== expected) return { ok: false, error: 'Фраза подтверждения не совпадает' };

  await logAdminAction({
    adminUserId: ctx.user.id,
    action: 'delete_user',
    targetType: 'user',
    targetId: userId,
    metadata: { email: u.email },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
  await db.execute(sql`delete from users where id = ${userId}`);
  revalidatePath('/admin/users');
  return { ok: true };
}
