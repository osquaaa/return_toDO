import type { CommandContext, Context } from 'grammy';

import { getUserByChatId } from '../services/auth';
import { redis, todayListKey } from '../services/redis';
import { markTaskDone } from '../services/tasks';

export async function doneHandler(ctx: CommandContext<Context>) {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  const user = await getUserByChatId(BigInt(chatId));
  if (!user) {
    await ctx.reply('Сначала привяжи аккаунт через /start link_… из настроек LETget.');
    return;
  }

  const arg = (ctx.match ?? '').toString().trim();
  const num = Number.parseInt(arg, 10);
  if (!Number.isFinite(num) || num < 1) {
    await ctx.reply('Использование: /done <номер из /today>');
    return;
  }

  const raw = await redis.get(todayListKey(user.id));
  if (!raw) {
    await ctx.reply('Сначала выполни /today — увижу актуальный список.');
    return;
  }

  let ids: string[];
  try {
    ids = JSON.parse(raw) as string[];
  } catch {
    await ctx.reply('Список устарел. Запусти /today заново.');
    return;
  }

  const taskId = ids[num - 1];
  if (!taskId) {
    await ctx.reply('Нет такого номера. Проверь список через /today.');
    return;
  }

  const ok = await markTaskDone(user.id, taskId);
  if (!ok) {
    await ctx.reply('Не получилось обновить — возможно, задача удалена.');
    return;
  }
  await ctx.reply('✅ Готово');
}
