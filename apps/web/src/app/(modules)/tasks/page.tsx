import { listTasksQuerySchema } from '@letget/lib/zod/tasks';

import { requireUser } from '@/lib/auth/session';
import { listTasks } from '@/lib/tasks/queries';

import { TaskFilters } from './task-filters';
import { TaskList } from './task-list';

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

  // Serialize Date → ISO for client components.
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
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Задачи</h1>
        <span className="text-sm text-[var(--color-ink-soft)]">{items.length} в списке</span>
      </header>
      <TaskFilters initialFilter={opts.filter} initialQuery={opts.q ?? ''} />
      <TaskList items={serialized} />
    </div>
  );
}
