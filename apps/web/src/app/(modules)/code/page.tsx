import { Code2 } from 'lucide-react';

import { listSnippetsQuerySchema } from '@letget/lib/zod/code';

import { requireUser } from '@/lib/auth/session';
import { listSnippets } from '@/lib/code/queries';

import { SnippetList, type SnippetRow } from './snippet-list';

export const metadata = { title: 'Код — LETget' };
export const dynamic = 'force-dynamic';

type SearchParamsRaw = { q?: string; pinned?: string };

export default async function CodePage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const parsed = listSnippetsQuerySchema.safeParse({
    q: raw.q ?? undefined,
    pinned: raw.pinned === 'true' ? true : undefined,
  });
  const opts = parsed.success ? parsed.data : {};
  const items = await listSnippets(user.id, opts);
  const allItems = await listSnippets(user.id, {});

  const serialized: SnippetRow[] = items.map((s) => ({
    id: s.id,
    title: s.title,
    code: s.code,
    language: s.language,
    isPinned: s.isPinned,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const totalCount = allItems.length;
  const pinnedCount = allItems.filter((s) => s.isPinned).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-8 md:py-10">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <Code2 size={12} strokeWidth={2.4} />
          Код
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Сниппеты
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          {totalCount === 0
            ? 'Тут пока пусто. Сохрани первый сниппет.'
            : `${totalCount} ${pluralSnippets(totalCount)}${pinnedCount > 0 ? ` · ${pinnedCount} закреплено` : ''}.`}
        </p>
      </header>

      <SnippetList
        items={serialized}
        initialQuery={opts.q ?? ''}
        initialPinnedOnly={opts.pinned === true}
      />
    </div>
  );
}

function pluralSnippets(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'сниппет';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'сниппета';
  return 'сниппетов';
}
