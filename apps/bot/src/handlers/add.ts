import type { CommandContext, Context } from 'grammy';

import { getUserByChatId } from '../services/auth';
import { createTaskFromBot } from '../services/tasks';

export async function addHandler(ctx: CommandContext<Context>) {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  const user = await getUserByChatId(BigInt(chatId));
  if (!user) {
    await ctx.reply('Сначала привяжи аккаунт через /start link_… из настроек LETget.');
    return;
  }

  const text = (ctx.match ?? '').toString().trim();
  if (!text) {
    await ctx.reply('Использование: /add <текст задачи>');
    return;
  }

  await createTaskFromBot(user.id, text);
  await ctx.reply('✅ Добавлено');
}
