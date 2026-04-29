import { Bot } from 'grammy';

import { env } from './env';
import { startHandler } from './handlers/start';
import { logger } from './logger';

export function createBot(): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command('start', startHandler);
  bot.command('help', async (ctx) => {
    await ctx.reply(
      'Команды:\n/start — привязка\n/today — задачи на сегодня\n/help — это сообщение',
    );
  });

  bot.catch((err) => {
    logger.error({ err: err.error }, 'Bot handler error');
  });

  return bot;
}
