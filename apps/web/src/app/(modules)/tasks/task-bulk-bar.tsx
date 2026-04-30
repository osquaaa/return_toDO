'use client';

import { Check, Trash2, Undo2, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ui/dialog';

import { bulkAction } from './actions';

export function TaskBulkBar({
  selected,
  onClear,
  onExitSelection,
}: {
  selected: Set<string>;
  onClear: () => void;
  onExitSelection: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (selected.size === 0) return null;
  const ids = Array.from(selected);

  const doAction = (action: 'done' | 'undone' | 'delete') => {
    startTransition(async () => {
      const r = await bulkAction(ids, action);
      if (r.ok) {
        const noun =
          r.data?.count === 1
            ? '1 задача'
            : r.data && r.data.count > 1 && r.data.count < 5
              ? `${r.data.count} задачи`
              : `${r.data?.count ?? ids.length} задач`;
        toast.success(
          action === 'delete'
            ? `Удалено: ${noun}`
            : action === 'done'
              ? `Готово: ${noun}`
              : `Возвращено: ${noun}`,
        );
        onClear();
        if (action === 'delete') onExitSelection();
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-fg-primary)] px-3 py-2.5 text-sm text-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)]">
        <span className="px-1 font-medium">Выбрано: {selected.size}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => doAction('done')}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20 disabled:opacity-50"
            aria-label="Сделать"
          >
            <Check size={13} strokeWidth={3} />
            <span className="hidden sm:inline">Сделать</span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => doAction('undone')}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20 disabled:opacity-50"
            aria-label="Не сделано"
          >
            <Undo2 size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">Вернуть</span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 rounded-lg bg-red-500/30 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-red-500/50 disabled:opacity-50"
            aria-label="Удалить"
          >
            <Trash2 size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">Удалить</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="ml-1 flex size-7 items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Снять выделение"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Удалить ${selected.size}?`}
        description="Задачи попадут в корзину. Восстановить можно позже."
        confirmLabel="Удалить"
        variant="danger"
        loading={isPending}
        onConfirm={() => {
          setConfirmDelete(false);
          doAction('delete');
        }}
      />
    </div>
  );
}
