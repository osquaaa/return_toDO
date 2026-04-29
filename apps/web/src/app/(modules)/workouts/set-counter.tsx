'use client';

import { useEffect, useState, useTransition } from 'react';

import { addSetAction } from './actions';

const DEFAULT_REPS = 10;
const MAX_REPS = 9_999;

export function SetCounter({ exerciseId }: { exerciseId: string }) {
  const [value, setValue] = useState(DEFAULT_REPS);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset to default when exercise changes
  useEffect(() => {
    setValue(DEFAULT_REPS);
    setError(null);
  }, [exerciseId]);

  const dec = () => setValue((v) => Math.max(0, v - 1));
  const inc = () => setValue((v) => Math.min(MAX_REPS, v + 1));

  const submit = () => {
    if (value <= 0) {
      setError('Минимум 1 повторение');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await addSetAction({ exerciseId, reps: value });
      if (r.ok) {
        setValue(DEFAULT_REPS);
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={dec}
          disabled={value <= 0}
          aria-label="Уменьшить"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-panel)] text-2xl font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-canvas)] disabled:opacity-40"
        >
          −
        </button>
        <div className="min-w-[6rem] text-center">
          <input
            type="number"
            min={0}
            max={MAX_REPS}
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setValue(Math.max(0, Math.min(MAX_REPS, Math.floor(n))));
            }}
            className="w-full bg-transparent text-center text-5xl font-extrabold tabular-nums focus:outline-none"
            aria-label="Количество повторений"
          />
          <div className="mt-1 text-xs text-[var(--color-ink-soft)]">повторений</div>
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={value >= MAX_REPS}
          aria-label="Увеличить"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-panel)] text-2xl font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-canvas)] disabled:opacity-40"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={isPending || value <= 0}
        className="rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, var(--color-workout-from), var(--color-workout-to))',
        }}
      >
        Добавить подход
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
