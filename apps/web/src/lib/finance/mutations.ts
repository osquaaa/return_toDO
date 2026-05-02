import { and, eq } from 'drizzle-orm';

import { createDbClient, genId } from '@letget/db';
import {
  financeCategories,
  financeTransactions,
  type FinanceCategory,
  type FinanceTransaction,
} from '@letget/db/schema';
import type {
  CreateCategoryInput,
  CreateTransactionInput,
  UpdateCategoryInput,
  UpdateTransactionInput,
} from '@letget/lib/zod/finance';

const { db } = createDbClient();

async function ownsCategory(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .select({ id: financeCategories.id })
    .from(financeCategories)
    .where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

async function ownsTransaction(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .select({ id: financeTransactions.id })
    .from(financeTransactions)
    .where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
): Promise<FinanceCategory> {
  const [row] = await db
    .insert(financeCategories)
    .values({
      id: genId(),
      userId,
      name: input.name,
      kind: input.kind,
      color: input.color ?? null,
      icon: input.icon ?? null,
    })
    .returning();
  return row;
}

export async function updateCategory(
  userId: string,
  id: string,
  input: UpdateCategoryInput,
): Promise<FinanceCategory | null> {
  if (!(await ownsCategory(userId, id))) return null;

  const patch: Partial<typeof financeCategories.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.color !== undefined) patch.color = input.color;
  if (input.icon !== undefined) patch.icon = input.icon;

  if (Object.keys(patch).length === 0) {
    const rows = await db
      .select()
      .from(financeCategories)
      .where(eq(financeCategories.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  const rows = await db
    .update(financeCategories)
    .set(patch)
    .where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function archiveCategory(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(financeCategories)
    .set({ archivedAt: new Date() })
    .where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId)))
    .returning({ id: financeCategories.id });
  return rows.length > 0;
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<FinanceTransaction> {
  // If categoryId provided, verify ownership so users can't attach to someone else's category.
  if (input.categoryId) {
    const owns = await ownsCategory(userId, input.categoryId);
    if (!owns) throw new Error('Категория не найдена');
  }

  const [row] = await db
    .insert(financeTransactions)
    .values({
      id: genId(),
      userId,
      categoryId: input.categoryId ?? null,
      amount: input.amount,
      currency: input.currency ?? 'RUB',
      description: input.description ?? null,
      occurredOn: input.occurredOn,
    })
    .returning();
  return row;
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<FinanceTransaction | null> {
  if (!(await ownsTransaction(userId, id))) return null;

  if (input.categoryId) {
    const owns = await ownsCategory(userId, input.categoryId);
    if (!owns) throw new Error('Категория не найдена');
  }

  const patch: Partial<typeof financeTransactions.$inferInsert> = {};
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.description !== undefined) patch.description = input.description;
  if (input.occurredOn !== undefined) patch.occurredOn = input.occurredOn;

  if (Object.keys(patch).length === 0) {
    const rows = await db
      .select()
      .from(financeTransactions)
      .where(eq(financeTransactions.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  const rows = await db
    .update(financeTransactions)
    .set(patch)
    .where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteTransaction(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(financeTransactions)
    .where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)))
    .returning({ id: financeTransactions.id });
  return rows.length > 0;
}
