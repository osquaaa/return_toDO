import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Bot } from 'grammy';

const sendMessage = vi.fn();

const taskRow = {
  id: 'task-1',
  userId: 'user-1',
  contentText: 'Hello world',
  contentHtml: '<p>Hello world</p>',
  isDone: false,
  isPinned: false,
  deadline: new Date(Date.now() + 30 * 60_000),
  doneAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  searchVector: null,
};

vi.mock('../src/services/queue', () => ({
  getChatIdForUser: vi.fn(() => Promise.resolve(99n)),
}));

vi.mock('@letget/db/client', () => {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve([taskRow]),
  };
  return {
    createDbClient: () => ({
      db: { select: () => chain },
    }),
  };
});

beforeEach(() => {
  sendMessage.mockReset();
});

function makeBot() {
  return { api: { sendMessage } } as unknown as Bot;
}

type SendMessageCall = [
  number,
  string,
  {
    reply_markup?: {
      inline_keyboard?: Array<Array<{ callback_data: string; text: string }>>;
    };
  }?,
];

describe('deliverNotification', () => {
  it('sends task_deadline message with inline buttons', async () => {
    sendMessage.mockResolvedValueOnce({ message_id: 1 });
    const { deliverNotification } = await import('../src/services/push');
    const result = await deliverNotification(makeBot(), {
      id: 'n1',
      userId: 'user-1',
      eventType: 'task_deadline',
      payload: { taskId: 'task-1', summary: 'Hello world' },
    });
    expect(result.ok).toBe(true);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    const call = sendMessage.mock.calls[0] as SendMessageCall;
    expect(call[0]).toBe(99);
    expect(call[1]).toContain('Дедлайн');
    const buttons = call[2]?.reply_markup?.inline_keyboard?.[0] ?? [];
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.callback_data).toBe('done_task-1');
    expect(buttons[1]?.callback_data).toBe('snooze_task-1_60');
  });

  it('escapes HTML in summary', async () => {
    sendMessage.mockResolvedValueOnce({ message_id: 1 });
    const { deliverNotification } = await import('../src/services/push');
    await deliverNotification(makeBot(), {
      id: 'n1b',
      userId: 'user-1',
      eventType: 'task_deadline',
      payload: { taskId: 'task-1', summary: '<script>x</script>' },
    });
    const call = sendMessage.mock.calls[0] as SendMessageCall;
    expect(call[1]).toContain('&lt;script&gt;');
    expect(call[1]).not.toContain('<script>');
  });

  it('detects 403 blocked and returns blockedByUser=true', async () => {
    sendMessage.mockRejectedValueOnce({
      error_code: 403,
      description: 'Forbidden: bot was blocked by the user',
    });
    const { deliverNotification } = await import('../src/services/push');
    const result = await deliverNotification(makeBot(), {
      id: 'n2',
      userId: 'user-1',
      eventType: 'task_deadline',
      payload: { taskId: 'task-1', summary: 'Hello' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.blockedByUser).toBe(true);
    }
  });

  it('sends generic message for morning_digest', async () => {
    sendMessage.mockResolvedValueOnce({ message_id: 1 });
    const { deliverNotification } = await import('../src/services/push');
    const result = await deliverNotification(makeBot(), {
      id: 'n3',
      userId: 'user-1',
      eventType: 'morning_digest',
      payload: { text: '<b>Привет</b>' },
    });
    expect(result.ok).toBe(true);
    const call = sendMessage.mock.calls[0] as SendMessageCall;
    expect(call[1]).toBe('<b>Привет</b>');
  });
});
