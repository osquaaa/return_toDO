import { z } from 'zod';

export const addExerciseSchema = z.object({
  name: z.string().min(1, 'Название не может быть пустым').max(100),
  icon: z.string().max(20).optional().nullable(),
});

export const addSetSchema = z.object({
  exerciseId: z.string().uuid(),
  reps: z.number().int().nonnegative().max(10_000),
  notes: z.string().max(500).optional().nullable(),
});

export type AddExerciseInput = z.infer<typeof addExerciseSchema>;
export type AddSetInput = z.infer<typeof addSetSchema>;
