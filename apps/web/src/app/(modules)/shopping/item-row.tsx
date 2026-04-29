'use client';

import { useState, useTransition } from 'react';

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
    });
  };

  return (
    <li
      className={`flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-sm)] ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => startTransition(async () => void (await toggleItemAction(item.id)))}
        aria-label={item.isDone ? 'Снять отметку' : 'Отметить купленным'}
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition ${
          item.isDone
            ? 'border-transparent text-white'
            : 'border-[var(--color-border)] hover:border-[var(--color-shopping-to)]'
        }`}
        style={
          item.isDone
            ? {
                background:
                  'linear-gradient(135deg, var(--color-shopping-from), var(--color-shopping-to))',
              }
            : undefined
        }
      >
        {item.isDone && <span className="text-xs leading-none">✓</span>}
      </button>

      {editing ? (
        <div className="flex flex-1 flex-wrap gap-2 sm:flex-nowrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-2 py-1 text-sm focus:border-[var(--color-shopping-to)] focus:outline-none"
            autoFocus
          />
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            placeholder="Кол-во"
            className="w-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-2 py-1 text-sm focus:border-[var(--color-shopping-to)] focus:outline-none"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-[var(--color-ink)] px-2 py-1 text-xs text-[var(--color-canvas)]"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs"
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`flex flex-1 items-baseline gap-2 text-left ${
            item.isDone ? 'text-[var(--color-ink-faint)] line-through' : ''
          }`}
        >
          <span className="text-sm">{item.name}</span>
          {item.quantity && (
            <span className="text-xs text-[var(--color-ink-soft)]">{item.quantity}</span>
          )}
        </button>
      )}

      {!editing && (
        <div className="flex shrink-0 items-center gap-0.5 text-[var(--color-ink-soft)]">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="rounded p-1 text-xs hover:text-[var(--color-ink)] disabled:opacity-30"
            aria-label="Выше"
            title="Выше"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="rounded p-1 text-xs hover:text-[var(--color-ink)] disabled:opacity-30"
            aria-label="Ниже"
            title="Ниже"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Удалить позицию?'))
                startTransition(async () => void (await deleteItemAction(item.id)));
            }}
            className="rounded p-1 text-xs hover:text-red-600"
            aria-label="Удалить"
            title="Удалить"
          >
            ✕
          </button>
        </div>
      )}
    </li>
  );
}
