import { requireUser } from '@/lib/auth/session';
import { listCategories, listTransactions, summary } from '@/lib/finance/queries';

import { FinanceRoot } from './finance-root';
import type { CategoryDTO, TransactionDTO } from './types';

export const metadata = { title: 'Финансы — LETget' };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  from?: string;
  to?: string;
  categoryId?: string;
  kind?: string;
  preset?: string;
}>;

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FinancePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const sp = await searchParams;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const fromParam = sp.from && ISO_RE.test(sp.from) ? sp.from : null;
  const toParam = sp.to && ISO_RE.test(sp.to) ? sp.to : null;
  const presetParam =
    sp.preset === 'month' || sp.preset === '3m' || sp.preset === 'year' || sp.preset === 'custom'
      ? sp.preset
      : null;

  let from: string;
  let to: string;
  let preset: 'month' | '3m' | 'year' | 'custom';

  if (fromParam && toParam) {
    from = fromParam;
    to = toParam;
    preset = presetParam ?? 'custom';
  } else if (presetParam === '3m') {
    const f = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    from = toIsoDate(f);
    to = toIsoDate(today);
    preset = '3m';
  } else if (presetParam === 'year') {
    const f = new Date(today.getFullYear(), 0, 1);
    from = toIsoDate(f);
    to = toIsoDate(today);
    preset = 'year';
  } else {
    from = toIsoDate(startOfMonth);
    to = toIsoDate(today);
    preset = 'month';
  }

  const categoryId = sp.categoryId && UUID_RE.test(sp.categoryId) ? sp.categoryId : undefined;
  const kind = sp.kind === 'income' || sp.kind === 'expense' ? sp.kind : undefined;

  const [categoriesRows, transactionsRows, summaryData] = await Promise.all([
    listCategories(user.id),
    listTransactions(user.id, { from, to, categoryId, kind, limit: 200 }),
    summary(user.id, { from, to }),
  ]);

  const categories: CategoryDTO[] = categoriesRows.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    color: c.color,
    icon: c.icon,
  }));

  const transactions: TransactionDTO[] = transactionsRows.map((t) => ({
    id: t.id,
    categoryId: t.categoryId,
    amount: t.amount,
    currency: t.currency,
    description: t.description,
    occurredOn: t.occurredOn as unknown as string,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-8 md:py-10">
      <FinanceRoot
        categories={categories}
        transactions={transactions}
        summary={summaryData}
        from={from}
        to={to}
        preset={preset}
        kindFilter={kind ?? null}
        categoryFilter={categoryId ?? null}
        todayKey={toIsoDate(today)}
      />
    </div>
  );
}
