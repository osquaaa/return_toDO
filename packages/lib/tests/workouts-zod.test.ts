import { describe, it, expect } from 'vitest';

import { addExerciseSchema, addSetSchema } from '../src/zod/workouts.js';

describe('workouts zod schemas', () => {
  it('addExerciseSchema accepts valid name with icon', () => {
    const result = addExerciseSchema.safeParse({ name: 'Подтягивания', icon: '💪' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Подтягивания');
      expect(result.data.icon).toBe('💪');
    }
  });

  it('addExerciseSchema rejects empty name', () => {
    const result = addExerciseSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('addSetSchema rejects negative reps and non-uuid exercise id', () => {
    const bad = addSetSchema.safeParse({ exerciseId: 'not-a-uuid', reps: -1 });
    expect(bad.success).toBe(false);
    const ok = addSetSchema.safeParse({
      exerciseId: '11111111-2222-3333-4444-555555555555',
      reps: 12,
    });
    expect(ok.success).toBe(true);
  });
});
