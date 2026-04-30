'use client';

import { Minus, Plus } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { addSetAction } from './actions';

const DEFAULT_REPS = 10;
const MAX_REPS = 9_999;

export function SetCounter({ exerciseId }: { exerciseId: string }) {
  const [value, setValue] = useState(DEFAULT_REPS);
  const [error, setError] = useState<string | null>(null);
  const [prevExerciseId, setPrevExerciseId] = useState(exerciseId);
  const [isPending, startTransition] = useTransition();

  // Reset to default when exercise changes (storing during render is the
  // recommended React pattern for syncing state with props without an effect).
  if (prevExerciseId !== exerciseId) {
    setPrevExerciseId(exerciseId);
    setValue(DEFAULT_REPS);
    setError(null);
  }

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
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={dec}
          disabled={value <= 0}
          aria-label="Уменьшить"
          className="flex size-14 items-center justify-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-primary)] transition-all hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={22} strokeWidth={2.6} />
        </button>

        <div className="min-w-[7rem] text-center">
          <input
            type="number"
            min={0}
            max={MAX_REPS}
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setValue(Math.max(0, Math.min(MAX_REPS, Math.floor(n))));
            }}
            className="w-full bg-transparent text-center text-6xl leading-none font-semibold tracking-tight tabular-nums text-[var(--color-fg-primary)] focus:outline-none md:text-7xl"
            aria-label="Количество повторений"
          />
          <div className="mt-2 text-[10px] tracking-widest text-[var(--color-fg-tertiary)] uppercase">
            повторений
          </div>
        </div>

        <button
          type="button"
          onClick={inc}
          disabled={value >= MAX_REPS}
          aria-label="Увеличить"
          className="flex size-14 items-center justify-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-primary)] transition-all hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={22} strokeWidth={2.6} />
        </button>
      </div>

      <Button
        variant="primary"
        size="lg"
        loading={isPending}
        disabled={value <= 0}
        onClick={submit}
      >
        Добавить подход
      </Button>

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
