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

  const serialized: SnippetRow[] = items.map((s) => ({
    id: s.id,
    title: s.title,
    code: s.code,
    language: s.language,
    isPinned: s.isPinned,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Код</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {items.length} {pluralSnippets(items.length)}
          </p>
        </div>
        <span
          className="hidden h-10 w-10 rounded-full sm:block"
          style={{
            background: 'linear-gradient(135deg, var(--color-code-from), var(--color-code-to))',
          }}
          aria-hidden
        />
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
