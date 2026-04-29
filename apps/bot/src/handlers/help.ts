import type { CommandContext, Context } from 'grammy';

const HELP_TEXT = [
  'Команды LETget bot:',
  '',
  '/start — привязка аккаунта',
  '/today — задачи на сегодня',
  '/add <текст> — добавить задачу',
  '/done <номер> — закрыть задачу из списка /today',
  '/help — это сообщение',
].join('\n');

export async function helpHandler(ctx: CommandContext<Context>) {
  await ctx.reply(HELP_TEXT);
}
