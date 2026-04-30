'use client';

import { History, RefreshCw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';

import { repeatTripAction } from './actions';

export type HistoryRow = {
  id: string;
  name: string;
  completedAt: string | null;
  counts: { total: number; done: number };
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryPanel({ rows }: { rows: HistoryRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<HistoryRow | null>(null);

  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
        <History size={12} strokeWidth={2.4} />
        История
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-3 transition-colors hover:border-[var(--color-border-default)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
                  {r.name}
                </span>
                <span className="shrink-0 text-xs text-[var(--color-fg-tertiary)]">
                  {fmt(r.completedAt)}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-fg-secondary)]">
                {r.counts.done} из {r.counts.total} {r.counts.total === 1 ? 'позиция' : 'позиций'}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw size={12} />}
              disabled={isPending}
              onClick={() => setTarget(r)}
            >
              Повторить
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        title={`Повторить «${target?.name ?? ''}»?`}
        description="Создадим новый поход с теми же позициями."
        confirmLabel="Повторить"
        loading={isPending}
        onConfirm={async () => {
          if (!target) return;
          const id = target.id;
          startTransition(async () => {
            const r = await repeatTripAction(id);
            setTarget(null);
            if (r.ok) toast.success('Поход создан');
            else toast.error(r.error);
          });
        }}
      />
    </section>
  );
}
