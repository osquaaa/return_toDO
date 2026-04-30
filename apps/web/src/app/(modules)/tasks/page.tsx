import { listTasksQuerySchema } from '@letget/lib/zod/tasks';

import { requireUser } from '@/lib/auth/session';
import { listTasks } from '@/lib/tasks/queries';

import { TaskList } from './task-list';
import { TasksHero } from './tasks-hero';

export const metadata = { title: 'Задачи — LETget' };
export const dynamic = 'force-dynamic';

type SearchParamsRaw = { filter?: string; q?: string };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const parsed = listTasksQuerySchema.safeParse({
    filter: raw.filter ?? 'active',
    q: raw.q ?? undefined,
  });
  const opts = parsed.success ? parsed.data : { filter: 'active' as const };
  const items = await listTasks(user.id, opts);

  const allTasks = await listTasks(user.id, { filter: 'all' });
  const stats = {
    total: allTasks.length,
    done: allTasks.filter((t) => t.isDone).length,
    pinned: allTasks.filter((t) => t.isPinned).length,
    overdue: allTasks.filter((t) => !t.isDone && t.deadline && new Date(t.deadline) < new Date())
      .length,
  };

  const serialized = items.map((t) => ({
    id: t.id,
    userId: t.userId,
    contentHtml: t.contentHtml,
    contentText: t.contentText,
    isDone: t.isDone,
    isPinned: t.isPinned,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    doneAt: t.doneAt ? t.doneAt.toISOString() : null,
    deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-8 md:py-10">
      <TasksHero name={user.name} stats={stats} />
      <TaskList items={serialized} filter={opts.filter} query={opts.q ?? ''} />
    </div>
  );
}
