import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext, Context } from 'grammy';

const reply = vi.fn((..._args: unknown[]) => Promise.resolve(undefined as unknown));

vi.mock('../src/services/auth', () => ({
  getUserByChatId: vi.fn(() => Promise.resolve({ id: 'user-1', email: 'u@example.com' })),
}));

const taskRow = {
  id: 'task-1',
  userId: 'user-1',
  contentText: 'Test task',
  contentHtml: '<p>Test task</p>',
  isDone: false,
  isPinned: true,
  deadline: new Date('2026-04-29T15:30:00.000Z'),
  doneAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  searchVector: null,
};

vi.mock('../src/services/tasks', () => ({
  listTodayTasks: vi.fn(() => Promise.resolve([taskRow])),
}));

const redisSet = vi.fn((..._args: unknown[]) => Promise.resolve('OK'));
vi.mock('../src/services/redis', () => ({
  redis: { set: redisSet, get: vi.fn(), del: vi.fn() },
  todayListKey: (uid: string) => `tg:today:${uid}`,
  TODAY_LIST_TTL_S: 3600,
}));

beforeEach(() => {
  reply.mockClear();
  redisSet.mockClear();
});

function makeCtx(): CommandContext<Context> {
  return {
    chat: { id: 99 },
    reply,
    match: '',
  } as unknown as CommandContext<Context>;
}

describe('todayHandler', () => {
  it('replies with numbered list and caches ids in redis', async () => {
    const { todayHandler } = await import('../src/handlers/today');
    await todayHandler(makeCtx());
    expect(reply).toHaveBeenCalledTimes(1);
    const replyArgs = reply.mock.calls[0] ?? [];
    const first = replyArgs[0];
    const text = typeof first === 'string' ? first : '';
    expect(text).toContain('1.');
    expect(text).toContain('Test task');
    expect(redisSet).toHaveBeenCalledTimes(1);
    const setArgs = redisSet.mock.calls[0] ?? [];
    expect(setArgs[0]).toBe('tg:today:user-1');
    expect(setArgs[1]).toBe(JSON.stringify(['task-1']));
  });

  it('replies with link prompt when user not linked', async () => {
    const auth = await import('../src/services/auth');
    vi.mocked(auth.getUserByChatId).mockResolvedValueOnce(null);
    const { todayHandler } = await import('../src/handlers/today');
    await todayHandler(makeCtx());
    const replyArgs = reply.mock.calls[0] ?? [];
    const first = replyArgs[0];
    const text = typeof first === 'string' ? first : '';
    expect(text).toContain('Привяжи');
  });
});
