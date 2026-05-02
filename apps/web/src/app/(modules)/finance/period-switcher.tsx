'use client';

import { CalendarRange } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

import type { PeriodPreset } from './types';

const PRESETS: { key: Exclude<PeriodPreset, 'custom'>; label: string }[] = [
  { key: 'month', label: 'Месяц' },
  { key: '3m', label: '3М' },
  { key: 'year', label: 'Год' },
];

type Props = {
  preset: PeriodPreset;
  from: string;
  to: string;
};

export function PeriodSwitcher({ preset, from, to }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickFrom, setPickFrom] = useState(from);
  const [pickTo, setPickTo] = useState(to);

  const apply = (next: Partial<{ preset: string; from: string; to: string }>, reset?: boolean) => {
    const p = new URLSearchParams(params.toString());
    if (reset) {
      p.delete('from');
      p.delete('to');
    }
    if (next.preset !== undefined) p.set('preset', next.preset);
    if (next.from !== undefined) p.set('from', next.from);
    if (next.to !== undefined) p.set('to', next.to);
    router.replace(`/finance?${p.toString()}`, { scroll: false });
  };

  return (
    <>
      <div className="flex h-10 gap-0.5 rounded-2xl bg-[var(--color-bg-subtle)] p-1">
        {PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => apply({ preset: p.key }, true)}
              className={cn(
                'flex-1 rounded-xl px-3 text-sm font-medium tracking-tight transition-all',
                active
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]',
              )}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setPickFrom(from);
            setPickTo(to);
            setPickerOpen(true);
          }}
          aria-label="Выбрать период"
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium tracking-tight transition-all',
            preset === 'custom'
              ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] shadow-[var(--shadow-xs)]'
              : 'text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]',
          )}
        >
          <CalendarRange size={14} />
          Дни
        </button>
      </div>

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} title="Период">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase">
                С
              </label>
              <input
                type="date"
                value={pickFrom}
                onChange={(e) => setPickFrom(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium tracking-wider text-[var(--color-fg-tertiary)] uppercase">
                По
              </label>
              <input
                type="date"
                value={pickTo}
                onChange={(e) => setPickTo(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="md" onClick={() => setPickerOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!pickFrom || !pickTo) return;
                if (pickFrom > pickTo) return;
                setPickerOpen(false);
                apply({ preset: 'custom', from: pickFrom, to: pickTo });
              }}
            >
              Применить
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
