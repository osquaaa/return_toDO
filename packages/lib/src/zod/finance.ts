import { z } from 'zod';

export const financeKindEnum = z.enum(['income', 'expense']);

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  kind: financeKindEnum,
  color: z.string().max(20).optional().nullable(),
  icon: z.string().max(8).optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createTransactionSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().min(2).max(8).default('RUB'),
  description: z.string().max(500).optional().nullable(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  categoryId: z.string().uuid().optional(),
  kind: financeKindEnum.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type FinanceKind = z.infer<typeof financeKindEnum>;
