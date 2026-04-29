'use client';

import { useId, useRef, useState, useTransition } from 'react';

import { addItemAction } from './actions';

export function Composer({ suggestions }: { suggestions: string[] }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const r = await addItemAction({
        name: trimmed,
        quantity: quantity.trim() || null,
      });
      if (r.ok) {
        setName('');
        setQuantity('');
        nameRef.current?.focus();
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Что добавить?"
          list={listId}
          className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm focus:border-[var(--color-shopping-to)] focus:outline-none"
          autoFocus
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <input
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Кол-во (опц.)"
          className="w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm focus:border-[var(--color-shopping-to)] focus:outline-none"
        />
        <button
          type="button"
          disabled={isPending || !name.trim()}
          onClick={submit}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:opacity-50"
          style={{
            background:
              'linear-gradient(135deg, var(--color-shopping-from), var(--color-shopping-to))',
          }}
        >
          +
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
