import { z } from 'zod';

export const createTaskSchema = z.object({
  contentHtml: z.string().min(1, 'Текст задачи не может быть пустым').max(50_000),
  isPinned: z.boolean().default(false),
  deadline: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  contentHtml: z.string().min(1).max(50_000).optional(),
  isDone: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  deadline: z.string().datetime().nullable().optional(),
});

export const listTasksQuerySchema = z.object({
  filter: z.enum(['all', 'active', 'done']).default('active'),
  q: z.string().max(200).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
