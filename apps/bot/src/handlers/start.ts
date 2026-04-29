import type { Context } from 'grammy';

import { logger } from '../logger';
import { linkAccountFromToken } from '../services/link-account';

export async function startHandler(ctx: Context) {
  const payload = (ctx.match ?? '').toString().trim();
  const fromId = ctx.from?.id;
  const username = ctx.from?.username;

  if (payload.startsWith('link_')) {
    const token = payload.slice('link_'.length);
    const tg = ctx.from;
    if (!tg) {
      await ctx.reply('Не удалось получить твой ID. Попробуй ещё раз.');
      return;
    }
    const r = await linkAccountFromToken({
      token,
      telegramId: BigInt(tg.id),
      chatId: BigInt(ctx.chat?.id ?? tg.id),
      username: tg.username ?? null,
    });
    if (r.kind === 'linked') {
      await ctx.reply('✅ Telegram привязан. Возвращайся в LETget — там уже видно.');
    } else if (r.kind === 'expired') {
      await ctx.reply('Токен истёк. Сгенерируй новую ссылку в настройках LETget.');
    } else {
      await ctx.reply('Этот Telegram уже привязан к другому аккаунту. Сначала отвяжи его там.');
    }
    return;
  }

  logger.info({ fromId, username }, '/start received');
  await ctx.reply(
    'Привет! Это LETget bot.\n\n' +
      'Чтобы привязать аккаунт, перейди в настройки на сайте и нажми "Подключить Telegram".\n\n' +
      'Команды:\n' +
      '/today — задачи на сегодня\n' +
      '/help — список команд',
  );
}
