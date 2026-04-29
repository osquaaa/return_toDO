import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/lib/auth/session', () => ({
  requireUser: vi.fn(async () => ({ id: 'u1' })),
}));
vi.mock('../../src/lib/tasks/mutations', () => ({
  createTask: vi.fn(async () => ({ id: 't1' })),
  updateTask: vi.fn(async () => ({ id: 't1' })),
  softDeleteTask: vi.fn(async () => true),
  bulkUpdate: vi.fn(async () => 3),
}));
vi.mock('../../src/lib/tasks/queries', () => ({
  getTask: vi.fn(async () => ({ id: 't1', isDone: false, isPinned: false })),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('task actions', () => {
  it('createTaskAction validates input', async () => {
    const { createTaskAction } = await import('../../src/app/(modules)/tasks/actions');
    const bad = await createTaskAction({ contentHtml: '' });
    expect(bad.ok).toBe(false);
    const good = await createTaskAction({ contentHtml: '<p>x</p>' });
    expect(good.ok).toBe(true);
  });

  it('bulkAction rejects empty ids', async () => {
    const { bulkAction } = await import('../../src/app/(modules)/tasks/actions');
    const res = await bulkAction([], 'done');
    expect(res.ok).toBe(false);
  });

  it('bulkAction returns count on success', async () => {
    const { bulkAction } = await import('../../src/app/(modules)/tasks/actions');
    const res = await bulkAction(['a', 'b'], 'done');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data?.count).toBe(3);
  });
});
