export type FinanceKind = 'income' | 'expense';

export type CategoryDTO = {
  id: string;
  name: string;
  kind: FinanceKind;
  color: string | null;
  icon: string | null;
};

export type TransactionDTO = {
  id: string;
  categoryId: string | null;
  amount: string; // numeric string straight from DB; parse with parseFloat for math
  currency: string;
  description: string | null;
  occurredOn: string; // YYYY-MM-DD
};

export type CategoryBreakdownDTO = {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  icon: string | null;
  total: number;
};

export type SummaryDTO = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  byCategoryExpense: CategoryBreakdownDTO[];
  byCategoryIncome: CategoryBreakdownDTO[];
  byDay: { date: string; income: number; expense: number }[];
};

export type PeriodPreset = 'month' | '3m' | 'year' | 'custom';
