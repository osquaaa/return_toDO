import { z } from 'zod';

export const createSnippetSchema = z.object({
  code: z.string().min(1, 'Код не может быть пустым').max(50_000),
  title: z.string().max(200).optional().nullable(),
  language: z.string().max(40).optional().nullable(),
});

export const updateSnippetSchema = z.object({
  code: z.string().min(1).max(50_000).optional(),
  title: z.string().max(200).nullable().optional(),
  language: z.string().max(40).nullable().optional(),
  isPinned: z.boolean().optional(),
});

export const listSnippetsQuerySchema = z.object({
  q: z.string().max(200).optional(),
  pinned: z.boolean().optional(),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
export type ListSnippetsQuery = z.infer<typeof listSnippetsQuerySchema>;
