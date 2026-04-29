import { describe, it, expect } from 'vitest';

import { v1MigrationSchema } from '../src/zod/migrate';

describe('v1MigrationSchema', () => {
  it('accepts a minimal payload with empty arrays', () => {
    const r = v1MigrationSchema.safeParse({
      tasks: [],
      shopping: { trips: [], items: [] },
      code: [],
      workouts: { exercises: [], sets: [] },
    });
    expect(r.success).toBe(true);
  });

  it('accepts a realistic v1 task entry and falls back on missing fields', () => {
    const r = v1MigrationSchema.safeParse({
      tasks: [
        {
          id: 't1',
          text: 'Купить хлеб',
          htmlText: '<p>Купить хлеб</p>',
          isDone: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
        { id: 't2', text: 'Wax car' },
      ],
      shopping: {
        trips: [{ id: 'tr1', name: 'Магнит', isCurrent: true, createdAt: '2024-02-01T00:00:00Z' }],
        items: [
          {
            id: 'i1',
            tripId: 'tr1',
            name: 'Молоко',
            quantity: '1 л',
            isDone: false,
            position: 0,
          },
        ],
      },
      code: [{ id: 'c1', title: 'snippet', code: 'console.log(1)', lang: 'ts' }],
      workouts: {
        exercises: [{ id: 'pullups', name: 'Подтягивания', icon: '💪' }],
        sets: [{ id: 's1', exerciseId: 'pullups', reps: 10, performedAt: '2024-03-01T00:00:00Z' }],
      },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tasks.length).toBe(2);
      expect(r.data.workouts.exercises[0]?.name).toBe('Подтягивания');
    }
  });

  it('rejects non-object root', () => {
    expect(v1MigrationSchema.safeParse('garbage').success).toBe(false);
    expect(v1MigrationSchema.safeParse(null).success).toBe(false);
  });
});
