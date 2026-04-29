'use client';

import { useTransition } from 'react';

import { completeTripAction, reorderItemsAction } from './actions';
import { Composer } from './composer';
import { ShoppingItemRow, type ItemRow } from './item-row';

export function ActiveTrip({
  tripId,
  tripName,
  items,
  suggestions,
}: {
  tripId: string;
  tripName: string;
  items: ItemRow[];
  suggestions: string[];
}) {
  const [isPending, startTransition] = useTransition();
  void tripName;

  const onMove = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= items.length) return;
    const ids = items.map((it) => it.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    startTransition(async () => {
      await reorderItemsAction(tripId, {
        items: ids.map((id, position) => ({ id, position })),
      });
    });
  };

  const copyMarkdown = async () => {
    const md = items
      .map((it) => {
        const mark = it.isDone ? '[x]' : '[ ]';
        const qty = it.quantity ? ` (${it.quantity})` : '';
        return `- ${mark} ${it.name}${qty}`;
      })
      .join('\n');
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      // ignore — older browsers; nothing critical
    }
  };

  const complete = () => {
    if (!confirm('Завершить поход?')) return;
    startTransition(async () => void (await completeTripAction(tripId)));
  };

  const totalDone = items.filter((it) => it.isDone).length;

  return (
    <section className="space-y-3">
      <Composer suggestions={suggestions} />

      {items.length === 0 ? (
        <div className="rounded-2xl bg-[var(--color-panel)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
          Пока пусто. Добавьте первую позицию.
        </div>
      ) : (
        <ul className={`space-y-1.5 ${isPending ? 'opacity-90' : ''}`}>
          {items.map((it, idx) => (
            <ShoppingItemRow
              key={it.id}
              item={it}
              index={idx}
              total={items.length}
              onMove={onMove}
            />
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-[var(--color-ink-soft)]">
            Куплено {totalDone} из {items.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void copyMarkdown()}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm hover:bg-[var(--color-canvas)]"
            >
              Копировать список
            </button>
            <button
              type="button"
              onClick={complete}
              disabled={isPending}
              className="rounded-xl px-4 py-1.5 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:opacity-60"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-shopping-from), var(--color-shopping-to))',
              }}
            >
              Завершить
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
