import { and, eq, isNull } from 'drizzle-orm';
import type { Bot } from 'grammy';

import { createDbClient } from '@letget/db/client';
import { tasks, telegramLinks } from '@letget/db/schema';

import { logger } from '../logger';

const { db } = createDbClient();

async function getUserIdFromChat(chatId: bigint): Promise<string | null> {
  const rows = await db
    .select({ userId: telegramLinks.userId })
    .from(telegramLinks)
    .where(eq(telegramLinks.chatId, chatId))
    .limit(1);
  return rows[0]?.userId ?? null;
}

export function registerCallbacks(bot: Bot) {
  bot.callbackQuery(/^done_(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const chatId = ctx.chat?.id;
    if (!taskId || chatId === undefined) {
      await ctx.answerCallbackQuery();
      return;
    }

    const userId = await getUserIdFromChat(BigInt(chatId));
    if (!userId) {
      await ctx.answerCallbackQuery({ text: 'Аккаунт не привязан' });
      return;
    }

    const updated = await db
      .update(tasks)
      .set({ isDone: true, doneAt: new Date(), updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
      .returning({ id: tasks.id });

    if (updated.length === 0) {
      await ctx.answerCallbackQuery({ text: 'Не нашёл задачу' });
      return;
    }

    await ctx.answerCallbackQuery({ text: '✅ Готово' });
    const message = ctx.update.callback_query.message;
    if (message && 'text' in message && typeof message.text === 'string') {
      try {
        await ctx.editMessageText(`✅ ${message.text}`);
      } catch (err) {
        logger.warn({ err }, 'editMessageText failed');
      }
    }
  });

  bot.callbackQuery(/^snooze_(.+)_(\d+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const minutesRaw = ctx.match[2];
    const chatId = ctx.chat?.id;
    if (!taskId || !minutesRaw || chatId === undefined) {
      await ctx.answerCallbackQuery();
      return;
    }
    const minutes = Number(minutesRaw);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      await ctx.answerCallbackQuery();
      return;
    }

    const userId = await getUserIdFromChat(BigInt(chatId));
    if (!userId) {
      await ctx.answerCallbackQuery({ text: 'Аккаунт не привязан' });
      return;
    }

    const newDeadline = new Date(Date.now() + minutes * 60_000);
    const updated = await db
      .update(tasks)
      .set({ deadline: newDeadline, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
      .returning({ id: tasks.id });

    if (updated.length === 0) {
      await ctx.answerCallbackQuery({ text: 'Не нашёл задачу' });
      return;
    }

    await ctx.answerCallbackQuery({ text: `\u{1F4C5} +${minutes} мин` });
    const message = ctx.update.callback_query.message;
    if (message && 'text' in message && typeof message.text === 'string') {
      try {
        await ctx.editMessageText(`\u{1F4C5} ${message.text}`);
      } catch (err) {
        logger.warn({ err }, 'editMessageText failed');
      }
    }
  });
}
