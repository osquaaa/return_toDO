import { eq } from 'drizzle-orm';
import type { Bot } from 'grammy';

import { createDbClient } from '@letget/db/client';
import { tasks } from '@letget/db/schema';

import { logger } from '../logger';
import { getChatIdForUser } from './queue';

const { db } = createDbClient();

export type Notification = {
  id: string;
  userId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export type DeliverResult = { ok: true } | { ok: false; error: string; blockedByUser?: boolean };

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function deliverNotification(bot: Bot, n: Notification): Promise<DeliverResult> {
  const chatId = await getChatIdForUser(n.userId);
  if (!chatId) return { ok: false, error: 'no_telegram_link' };

  try {
    if (n.eventType === 'task_deadline') {
      const taskId = n.payload.taskId as string;
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      if (!task || task.isDone || task.deletedAt) {
        return { ok: true };
      }
      const summary = (n.payload.summary as string | undefined) ?? task.contentText.slice(0, 200);
      const minBefore = task.deadline
        ? Math.max(0, Math.round((task.deadline.getTime() - Date.now()) / 60_000))
        : 0;
      await bot.api.sendMessage(
        Number(chatId),
        `⏰ Дедлайн через ${minBefore} мин: ${escapeHtml(summary)}`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Готово', callback_data: `done_${task.id}` },
                {
                  text: '\u{1F4C5} +1 час',
                  callback_data: `snooze_${task.id}_60`,
                },
              ],
            ],
          },
        },
      );
      return { ok: true };
    }

    if (n.eventType === 'morning_digest') {
      const text = (n.payload.text as string | undefined) ?? 'Доброе утро ☀️';
      await bot.api.sendMessage(Number(chatId), text, { parse_mode: 'HTML' });
      return { ok: true };
    }

    if (n.eventType === 'weekly_recap') {
      const text = (n.payload.text as string | undefined) ?? 'Еженедельный recap';
      await bot.api.sendMessage(Number(chatId), text, { parse_mode: 'HTML' });
      return { ok: true };
    }

    const text = (n.payload.text as string | undefined) ?? `Уведомление: ${n.eventType}`;
    await bot.api.sendMessage(Number(chatId), text);
    return { ok: true };
  } catch (err) {
    const e = err as { error_code?: number; description?: string; message?: string };
    const desc = e.description ?? '';
    const blocked = e.error_code === 403 || /blocked|deactivated|kicked/i.test(desc);
    logger.error({ err, notificationId: n.id }, 'push delivery failed');
    return {
      ok: false,
      error: desc || e.message || 'unknown',
      ...(blocked ? { blockedByUser: true } : {}),
    };
  }
}
