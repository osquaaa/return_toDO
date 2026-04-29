import Fastify from 'fastify';
import type { Bot } from 'grammy';

import { env } from './env';
import { logger } from './logger';

type CreateServerOpts = { bot?: Bot };

export function createServer(opts: CreateServerOpts = {}) {
  const app = Fastify({ logger: false });

  app.get('/health', () => ({
    status: 'ok',
    bot: env.TELEGRAM_BOT_USERNAME,
    timestamp: new Date().toISOString(),
  }));

  if (opts.bot) {
    const bot = opts.bot;
    app.post('/webhook', async (req, reply) => {
      const expected = env.TELEGRAM_WEBHOOK_SECRET;
      if (expected) {
        const provided = req.headers['x-telegram-bot-api-secret-token'];
        if (provided !== expected) {
          await reply.code(401).send({ error: 'unauthorized' });
          return;
        }
      } else {
        logger.warn('TELEGRAM_WEBHOOK_SECRET not set — webhook accepts unsigned requests');
      }
      try {
        await bot.handleUpdate(req.body as Parameters<Bot['handleUpdate']>[0]);
        await reply.code(200).send({ ok: true });
      } catch (err) {
        logger.error({ err }, 'webhook handleUpdate failed');
        await reply.code(500).send({ error: 'handler_failed' });
      }
    });
  }

  return {
    app,
    listen: async () => {
      try {
        await app.listen({ port: env.PORT, host: '127.0.0.1' });
        logger.info({ port: env.PORT }, '🤖 Bot HTTP server listening');
      } catch (err) {
        logger.error({ err }, 'Server failed to start');
        process.exit(1);
      }
    },
  };
}
