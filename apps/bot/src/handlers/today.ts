import type { CommandContext, Context } from 'grammy';

import { getUserByChatId } from '../services/auth';
import { redis, todayListKey, TODAY_LIST_TTL_S } from '../services/redis';
import { listTodayTasks } from '../services/tasks';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function todayHandler(ctx: CommandContext<Context>) {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  const user = await getUserByChatId(BigInt(chatId));
  if (!user) {
    await ctx.reply('Привяжи аккаунт через /start link_… (получи ссылку в настройках LETget).');
    return;
  }

  const tasks = await listTodayTasks(user.id);
  if (tasks.length === 0) {
    await ctx.reply('На сегодня задач нет. Можно отдохнуть 🙂');
    return;
  }

  const lines = tasks.map((t, i) => {
    const time = t.deadline ? ` ⏰ ${formatTime(t.deadline)}` : '';
    const pin = t.isPinned ? ' 📌' : '';
    const text = t.contentText.slice(0, 200);
    return `${i + 1}. ${text}${time}${pin}`;
  });

  await redis.set(
    todayListKey(user.id),
    JSON.stringify(tasks.map((t) => t.id)),
    'EX',
    TODAY_LIST_TTL_S,
  );

  await ctx.reply(
    `На сегодня (${tasks.length}):\n\n${lines.join('\n')}\n\nЧтобы закрыть задачу: /done <номер>`,
  );
}
