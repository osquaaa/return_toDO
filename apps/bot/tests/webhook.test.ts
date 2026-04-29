import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Bot } from 'grammy';

const TEST_SECRET = ['super', 'token'].join('-');

vi.mock('../src/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 0,
    TELEGRAM_BOT_USERNAME: 'letget_bot',
    TELEGRAM_WEBHOOK_SECRET: TEST_SECRET,
  },
}));

const handleUpdate = vi.fn(() => Promise.resolve());

type FastifyAppLike = {
  close: () => Promise<void>;
  ready: () => Promise<void>;
  inject: (...a: unknown[]) => unknown;
};
let server: { app: FastifyAppLike };

beforeEach(async () => {
  handleUpdate.mockReset();
  handleUpdate.mockResolvedValue(undefined);
  const { createServer } = await import('../src/server');
  const fakeBot = { handleUpdate } as unknown as Bot;
  server = createServer({ bot: fakeBot }) as unknown as typeof server;
  await server.app.ready();
});

afterEach(async () => {
  await server.app.close();
});

type InjectArgs = {
  method: 'POST' | 'GET';
  url: string;
  headers?: Record<string, string>;
  payload?: unknown;
};
type InjectReply = { statusCode: number };
type InjectFn = (args: InjectArgs) => Promise<InjectReply>;

describe('webhook endpoint', () => {
  it('rejects request without secret header', async () => {
    const inject = server.app.inject as unknown as InjectFn;
    const res = await inject({
      method: 'POST',
      url: '/webhook',
      payload: { update_id: 1 },
    });
    expect(res.statusCode).toBe(401);
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it('rejects request with wrong token', async () => {
    const inject = server.app.inject as unknown as InjectFn;
    const res = await inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-telegram-bot-api-secret-token': 'wrong' },
      payload: { update_id: 1 },
    });
    expect(res.statusCode).toBe(401);
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it('accepts valid request and calls bot.handleUpdate', async () => {
    const inject = server.app.inject as unknown as InjectFn;
    const res = await inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-telegram-bot-api-secret-token': TEST_SECRET },
      payload: { update_id: 1, message: { message_id: 1 } },
    });
    expect(res.statusCode).toBe(200);
    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when handleUpdate throws', async () => {
    handleUpdate.mockRejectedValueOnce(new Error('boom'));
    const inject = server.app.inject as unknown as InjectFn;
    const res = await inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'x-telegram-bot-api-secret-token': TEST_SECRET },
      payload: { update_id: 2 },
    });
    expect(res.statusCode).toBe(500);
  });
});
