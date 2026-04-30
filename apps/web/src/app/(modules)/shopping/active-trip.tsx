'use client';

import { CheckCircle2, Copy, ShoppingBag } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';

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
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
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
      toast.success('Список скопирован');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const totalDone = items.filter((it) => it.isDone).length;

  return (
    <section className="space-y-3">
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 md:p-5">
        <Composer suggestions={suggestions} />

        <div className="mt-4 space-y-1.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border-default)] px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-accent-shopping-soft)]">
                <ShoppingBag size={20} className="text-[var(--color-accent-shopping)]" />
              </span>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                Пока пусто. Добавь первую позицию.
              </p>
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
        </div>

        {items.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
            <span className="text-xs tracking-wider text-[var(--color-fg-tertiary)] uppercase">
              Куплено {totalDone} из {items.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Copy size={13} />}
                onClick={() => void copyMarkdown()}
              >
                Копировать
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<CheckCircle2 size={13} />}
                onClick={() => setConfirmComplete(true)}
              >
                Завершить
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        title="Завершить поход?"
        description="Список переедет в историю — позже его можно повторить."
        confirmLabel="Завершить"
        loading={completing}
        onConfirm={async () => {
          setCompleting(true);
          const r = await completeTripAction(tripId);
          setCompleting(false);
          setConfirmComplete(false);
          if (r.ok) toast.success('Поход завершён');
          else toast.error(r.error);
        }}
      />
    </section>
  );
}
