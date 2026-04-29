import { createBot } from './bot';
import { startCron } from './cron';
import { env } from './env';
import { logger } from './logger';
import { createServer } from './server';

async function main() {
  const server = createServer();
  await server.listen();

  if (env.TELEGRAM_BOT_TOKEN === 'disabled') {
    logger.warn('Bot token is "disabled" — bot will not connect to Telegram');
    return;
  }

  const bot = createBot();

  startCron(bot);

  if (env.TELEGRAM_USE_LONG_POLLING) {
    logger.info('Starting bot in long-polling mode (dev)');
    void bot.start({
      onStart: (info) => logger.info({ username: info.username }, '🤖 Bot started'),
    });
  } else {
    logger.info('Webhook mode — POST /webhook with x-telegram-bot-api-secret-token');
  }
}

main().catch((err) => {
  logger.error({ err }, 'Fatal');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  process.exit(0);
});
