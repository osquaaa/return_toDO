'use client';

import { ArrowDown, ArrowUp, Check, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

import { deleteItemAction, toggleItemAction, updateItemAction } from './actions';

export type ItemRow = {
  id: string;
  name: string;
  quantity: string | null;
  isDone: boolean;
  position: number;
};

export function ShoppingItemRow({
  item,
  index,
  total,
  onMove,
}: {
  item: ItemRow;
  index: number;
  total: number;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const r = await updateItemAction(item.id, {
        name: trimmed,
        quantity: quantity.trim() || null,
      });
      if (r.ok) setEditing(false);
      else toast.error(r.error);
    });
  };

  if (editing) {
    return (
      <li className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') setEditing(false);
              }}
              inputSize="md"
              autoFocus
            />
          </div>
          <div className="w-28 shrink-0">
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') setEditing(false);
              }}
              placeholder="Кол-во"
              inputSize="md"
            />
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="ghost" size="md" onClick={() => setEditing(false)}>
              Отмена
            </Button>
            <Button variant="primary" size="md" onClick={save} loading={isPending}>
              OK
            </Button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-3 transition-colors hover:border-[var(--color-border-default)]',
        item.isDone && 'opacity-60',
        isPending && 'opacity-50',
      )}
    >
      <button
        type="button"
        onClick={() => startTransition(async () => void (await toggleItemAction(item.id)))}
        aria-label={item.isDone ? 'Снять отметку' : 'Отметить купленным'}
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          item.isDone
            ? 'border-[var(--color-accent-shopping)] bg-[var(--color-accent-shopping)]'
            : 'border-[var(--color-border-strong)] bg-transparent hover:border-[var(--color-accent-shopping)]',
        )}
      >
        <Check
          size={12}
          strokeWidth={3.5}
          className={cn(
            'text-white transition-all',
            item.isDone ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
        />
      </button>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 text-left',
          item.isDone && 'line-through',
        )}
      >
        <span className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
          {item.name}
        </span>
        {item.quantity && (
          <Badge variant="shopping" size="sm">
            {item.quantity}
          </Badge>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          className="flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)] disabled:opacity-30"
          aria-label="Выше"
          title="Выше"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
          className="flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)] disabled:opacity-30"
          aria-label="Ниже"
          title="Ниже"
        >
          <ArrowDown size={14} />
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
          aria-label="Удалить"
          title="Удалить"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Удалить позицию?"
        description={`«${item.name}» будет удалена из списка.`}
        confirmLabel="Удалить"
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          const r = await deleteItemAction(item.id);
          setDeleting(false);
          setConfirmDelete(false);
          if (r.ok) toast.success('Позиция удалена');
          else toast.error(r.error);
        }}
      />
    </li>
  );
}
