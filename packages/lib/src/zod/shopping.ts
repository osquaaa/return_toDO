import { z } from 'zod';

export const addItemSchema = z.object({
  name: z.string().min(1, 'Название не может быть пустым').max(200),
  quantity: z.string().max(50).optional().nullable(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.string().max(50).nullable().optional(),
  isDone: z.boolean().optional(),
});

export const reorderItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().nonnegative(),
    }),
  ),
});

export const startTripSchema = z.object({
  name: z.string().max(80).optional(),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
export type StartTripInput = z.infer<typeof startTripSchema>;
