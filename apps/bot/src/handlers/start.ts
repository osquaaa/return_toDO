import type { Context } from 'grammy';

import { logger } from '../logger';

export async function startHandler(ctx: Context) {
  const fromId = ctx.from?.id;
  const username = ctx.from?.username;
  logger.info({ fromId, username }, '/start received');

  await ctx.reply(
    'Привет! Это LETget bot.\n\n' +
      'Чтобы привязать аккаунт, перейди в настройки на сайте и нажми "Подключить Telegram".\n\n' +
      'Команды:\n' +
      '/today — задачи на сегодня\n' +
      '/help — список команд',
  );
}
