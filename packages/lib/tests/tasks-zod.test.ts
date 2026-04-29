import { describe, it, expect } from 'vitest';

import { createTaskSchema, updateTaskSchema, listTasksQuerySchema } from '../src/zod/tasks.js';

describe('tasks zod schemas', () => {
  it('createTaskSchema rejects empty html', () => {
    const result = createTaskSchema.safeParse({ contentHtml: '' });
    expect(result.success).toBe(false);
  });

  it('createTaskSchema accepts valid input with deadline', () => {
    const result = createTaskSchema.safeParse({
      contentHtml: '<p>купить молоко</p>',
      isPinned: true,
      deadline: '2026-12-31T23:59:59.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPinned).toBe(true);
      expect(result.data.deadline).toBe('2026-12-31T23:59:59.000Z');
    }
  });

  it('updateTaskSchema accepts partial update without all fields', () => {
    const result = updateTaskSchema.safeParse({ isDone: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDone).toBe(true);
      expect(result.data.contentHtml).toBeUndefined();
    }
  });

  it('listTasksQuerySchema defaults filter=active on empty input', () => {
    const result = listTasksQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('active');
    }
  });
});
