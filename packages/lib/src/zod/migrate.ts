import { z } from 'zod';

const isoDate = z.string().min(1).optional();
const optionalString = z.string().optional().nullable();

const v1Task = z.object({
  id: z.string(),
  text: z.string().default(''),
  htmlText: z.string().optional(),
  isDone: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  deadline: isoDate,
  doneAt: isoDate,
  createdAt: isoDate,
  updatedAt: isoDate,
});

const v1ShoppingTrip = z.object({
  id: z.string(),
  name: z.string().default('Поход'),
  isCurrent: z.boolean().default(false),
  completedAt: isoDate,
  createdAt: isoDate,
});

const v1ShoppingItem = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  quantity: optionalString,
  isDone: z.boolean().default(false),
  position: z.number().int().default(0),
  doneAt: isoDate,
  createdAt: isoDate,
});

const v1CodeSnippet = z.object({
  id: z.string(),
  title: optionalString,
  code: z.string(),
  lang: optionalString,
  isPinned: z.boolean().default(false),
  createdAt: isoDate,
  updatedAt: isoDate,
});

const v1Exercise = z.object({
  id: z.string(),
  name: z.string(),
  icon: optionalString,
  archivedAt: isoDate,
});

const v1Set = z.object({
  id: z.string(),
  exerciseId: z.string(),
  reps: z.number().int().nonnegative(),
  notes: optionalString,
  performedAt: isoDate,
});

export const v1MigrationSchema = z.object({
  tasks: z.array(v1Task).default([]),
  shopping: z
    .object({
      trips: z.array(v1ShoppingTrip).default([]),
      items: z.array(v1ShoppingItem).default([]),
    })
    .default({ trips: [], items: [] }),
  code: z.array(v1CodeSnippet).default([]),
  workouts: z
    .object({
      exercises: z.array(v1Exercise).default([]),
      sets: z.array(v1Set).default([]),
    })
    .default({ exercises: [], sets: [] }),
});

export type V1MigrationPayload = z.infer<typeof v1MigrationSchema>;
