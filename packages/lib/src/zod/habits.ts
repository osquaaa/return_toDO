import { z } from 'zod';

export const habitFrequencyEnum = z.enum(['daily', 'weekly', 'n_per_week']);

export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(8).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  frequency: habitFrequencyEnum.default('daily'),
  targetCount: z.number().int().min(1).max(99).default(1),
});

export const updateHabitSchema = createHabitSchema.partial();

export const checkinSchema = z.object({
  habitId: z.string().uuid(),
  performedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(1).max(99).default(1),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type HabitFrequency = z.infer<typeof habitFrequencyEnum>;
