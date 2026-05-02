import { and, asc, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import {
  financeCategories,
  financeTransactions,
  type FinanceCategory,
  type FinanceTransaction,
} from '@letget/db/schema';
import type { FinanceKind } from '@letget/lib/zod/finance';

const { db } = createDbClient();

export async function listCategories(
  userId: string,
  opts: { kind?: FinanceKind; includeArchived?: boolean } = {},
): Promise<FinanceCategory[]> {
  const conditions = [eq(financeCategories.userId, userId)];
  if (!opts.includeArchived) conditions.push(isNull(financeCategories.archivedAt));
  if (opts.kind) conditions.push(eq(financeCategories.kind, opts.kind));
  return await db
    .select()
    .from(financeCategories)
    .where(and(...conditions))
    .orderBy(asc(financeCategories.name));
}

export async function getCategory(userId: string, id: string): Promise<FinanceCategory | null> {
  const rows = await db
    .select()
    .from(financeCategories)
    .where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listTransactions(
  userId: string,
  opts: {
    from?: string;
    to?: string;
    categoryId?: string;
    kind?: FinanceKind;
    limit?: number;
  } = {},
): Promise<FinanceTransaction[]> {
  const limit = opts.limit ?? 100;
  const conditions = [eq(financeTransactions.userId, userId)];
  if (opts.from) conditions.push(gte(financeTransactions.occurredOn, opts.from));
  if (opts.to) conditions.push(lte(financeTransactions.occurredOn, opts.to));
  if (opts.categoryId) conditions.push(eq(financeTransactions.categoryId, opts.categoryId));

  if (opts.kind) {
    // Join with categories so we can filter by kind. Categories can be null on tx, so kind filter
    // implies categoryId not null.
    const rows = await db
      .select({ tx: financeTransactions })
      .from(financeTransactions)
      .innerJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
      .where(and(...conditions, eq(financeCategories.kind, opts.kind)))
      .orderBy(desc(financeTransactions.occurredOn), desc(financeTransactions.createdAt))
      .limit(limit);
    return rows.map((r) => r.tx);
  }

  return await db
    .select()
    .from(financeTransactions)
    .where(and(...conditions))
    .orderBy(desc(financeTransactions.occurredOn), desc(financeTransactions.createdAt))
    .limit(limit);
}

export async function getTransaction(
  userId: string,
  id: string,
): Promise<FinanceTransaction | null> {
  const rows = await db
    .select()
    .from(financeTransactions)
    .where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export type CategoryBreakdown = {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  icon: string | null;
  total: number;
};

export type DayPoint = { date: string; income: number; expense: number };

export type Summary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  byCategoryExpense: CategoryBreakdown[];
  byCategoryIncome: CategoryBreakdown[];
  byDay: DayPoint[];
};

export async function summary(
  userId: string,
  opts: { from: string; to: string },
): Promise<Summary> {
  // Pull all transactions in range with category info via LEFT JOIN.
  const rows = await db
    .select({
      txId: financeTransactions.id,
      amount: financeTransactions.amount,
      occurredOn: financeTransactions.occurredOn,
      categoryId: financeCategories.id,
      categoryName: financeCategories.name,
      categoryKind: financeCategories.kind,
      categoryColor: financeCategories.color,
      categoryIcon: financeCategories.icon,
    })
    .from(financeTransactions)
    .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
    .where(
      and(
        eq(financeTransactions.userId, userId),
        gte(financeTransactions.occurredOn, opts.from),
        lte(financeTransactions.occurredOn, opts.to),
      ),
    )
    .orderBy(asc(financeTransactions.occurredOn));

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCat = new Map<string, CategoryBreakdown>();
  const incomeByCat = new Map<string, CategoryBreakdown>();
  const byDayMap = new Map<string, DayPoint>();

  for (const r of rows) {
    const amount = Number(r.amount);
    if (!Number.isFinite(amount)) continue;

    const dateKey = r.occurredOn as unknown as string;
    if (!byDayMap.has(dateKey)) {
      byDayMap.set(dateKey, { date: dateKey, income: 0, expense: 0 });
    }
    const day = byDayMap.get(dateKey)!;

    // Without a category, we can't tell income vs expense. Treat as expense by convention so it
    // still shows up in the totals and gets listed under a synthetic "Без категории" bucket.
    const kind = r.categoryKind ?? 'expense';
    const catId = r.categoryId ?? null;
    const catName = r.categoryName ?? 'Без категории';
    const catColor = r.categoryColor ?? null;
    const catIcon = r.categoryIcon ?? null;
    const catKey = catId ?? '__uncategorized__';

    if (kind === 'income') {
      totalIncome += amount;
      day.income += amount;
      const prev = incomeByCat.get(catKey);
      if (prev) {
        prev.total += amount;
      } else {
        incomeByCat.set(catKey, {
          categoryId: catId,
          categoryName: catName,
          color: catColor,
          icon: catIcon,
          total: amount,
        });
      }
    } else {
      totalExpense += amount;
      day.expense += amount;
      const prev = expenseByCat.get(catKey);
      if (prev) {
        prev.total += amount;
      } else {
        expenseByCat.set(catKey, {
          categoryId: catId,
          categoryName: catName,
          color: catColor,
          icon: catIcon,
          total: amount,
        });
      }
    }
  }

  const byCategoryExpense = [...expenseByCat.values()].sort((a, b) => b.total - a.total);
  const byCategoryIncome = [...incomeByCat.values()].sort((a, b) => b.total - a.total);
  const byDay = [...byDayMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    net: round2(totalIncome - totalExpense),
    byCategoryExpense,
    byCategoryIncome,
    byDay,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Re-exports so callers don't need to depend on drizzle-orm directly.
export { sql };
