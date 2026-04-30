'use client';

import { Plus, ShoppingBag } from 'lucide-react';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { startNewTripAction } from './actions';

export function StartTripButton({ label = 'Начать первый поход' }: { label?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-[var(--color-accent-shopping-soft)]">
        <ShoppingBag size={28} strokeWidth={2} className="text-[var(--color-accent-shopping)]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
          Нет активного похода
        </h3>
        <p className="max-w-xs text-sm text-[var(--color-fg-secondary)]">
          Поход — это один поход в магазин. Старые автоматически уходят в историю.
        </p>
      </div>
      <Button
        variant="primary"
        size="md"
        loading={isPending}
        iconLeft={!isPending ? <Plus size={14} /> : undefined}
        onClick={() => startTransition(async () => void (await startNewTripAction({})))}
      >
        {label}
      </Button>
    </div>
  );
}
