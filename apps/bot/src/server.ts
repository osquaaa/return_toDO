import Fastify from 'fastify';

import { env } from './env';
import { logger } from './logger';

export function createServer() {
  const app = Fastify({ logger: false });

  app.get('/health', () => ({
    status: 'ok',
    bot: env.TELEGRAM_BOT_USERNAME,
    timestamp: new Date().toISOString(),
  }));

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
