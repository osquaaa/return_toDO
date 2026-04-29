'use client';

import { useTransition } from 'react';

import { startNewTripAction } from './actions';

export function StartTripButton({ label = 'Начать новый поход' }: { label?: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => void (await startNewTripAction({})))}
      className="rounded-2xl px-6 py-3 text-base font-medium text-white shadow-[var(--shadow-md)] transition hover:opacity-90 disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, var(--color-shopping-from), var(--color-shopping-to))',
      }}
    >
      {isPending ? 'Создаём…' : label}
    </button>
  );
}
