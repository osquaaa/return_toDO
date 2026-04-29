import { Bot } from 'grammy';

import { env } from './env';
import { addHandler } from './handlers/add';
import { doneHandler } from './handlers/done';
import { helpHandler } from './handlers/help';
import { startHandler } from './handlers/start';
import { todayHandler } from './handlers/today';
import { logger } from './logger';

export function createBot(): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command('start', startHandler);
  bot.command('today', todayHandler);
  bot.command('add', addHandler);
  bot.command('done', doneHandler);
  bot.command('help', helpHandler);

  bot.catch((err) => {
    logger.error({ err: err.error }, 'Bot handler error');
  });

  return bot;
}
