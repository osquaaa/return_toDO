'use client';

import { Plus } from 'lucide-react';

import { cn } from '@/lib/cn';

export type ExerciseTab = {
  id: string;
  name: string;
  icon: string | null;
};

export function ExerciseTabs({
  items,
  activeId,
  onSelect,
  onAddClick,
}: {
  items: ExerciseTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAddClick: () => void;
}) {
  return (
    <div className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-1">
      {items.map((it) => {
        const active = it.id === activeId;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-medium tracking-tight transition-all',
              active
                ? 'border-[var(--color-accent-workouts)] bg-[var(--color-accent-workouts-soft)] text-[var(--color-accent-workouts)]'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]',
            )}
          >
            {it.icon && <span className="text-base leading-none">{it.icon}</span>}
            {it.name}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddClick}
        title="Добавить упражнение"
        aria-label="Добавить упражнение"
        className="ml-1 inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-default)] text-[var(--color-fg-tertiary)] transition-colors hover:border-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)]"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
